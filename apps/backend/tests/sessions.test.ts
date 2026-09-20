import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import express from "express";
import { issueSession, hasSession, tokenDigest } from "../src/services/sessions.js";
import { signToken } from "../src/utils/jwt.js";

const require = createRequire(import.meta.url);

test("persisted sessions revoke one device and fail closed after expiry or account disable", async () => {
  const dir = await mkdtemp(join(tmpdir(), "nightasaur-sessions-"));
  // Prisma's Windows schema engine needs the empty SQLite file to exist.
  await writeFile(join(dir, "test.db"), "", { flag: "wx" });
  process.env.DATABASE_URL = `file:${join(dir, "test.db")}`;
  execFileSync(process.execPath, [require.resolve("prisma/build/index.js"), "db", "push", "--skip-generate", "--schema", "prisma/schema.prisma"], { env: process.env, stdio: "pipe" });
  const { default: db } = await import("../src/config/prisma.js");
  const { authMiddleware, optionalAuth } = await import("../src/middleware/auth.js");
  const { authService } = await import("../src/services/auth.js");
  const app = express();
  app.get("/private", authMiddleware, (req, res) => res.json({ userId: req.userId }));
  app.get("/optional", optionalAuth, (req, res) => res.json({ authenticated: !!req.user }));
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>(resolve => server.once("listening", resolve));
  const port = (server.address() as { port: number }).port;
  const request = (token: string, path = "/private") => fetch(`http://127.0.0.1:${port}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  try {
    const user = await db.user.create({ data: { email: "session@example.invalid", username: "session-fixture", passwordHash: "fixture-no-login", isActive: true } });
    const payload = { userId: user.id, email: user.email, role: user.role };
    const first = await issueSession(db, payload);
    const second = await issueSession(db, payload);
    assert.notEqual(first, second);
    const rows = await db.session.findMany();
    assert.equal(rows.length, 2);
    assert.ok(rows.every(row => /^[a-f0-9]{64}$/.test(row.token)));
    assert.equal((await request(first)).status, 200);
    assert.equal((await request(signToken(payload))).status, 401);
    await authService.logout(first);
    await authService.logout(first); // Idempotent service operation.
    assert.equal(await hasSession(db, first, user.id), false);
    assert.equal((await request(first)).status, 401);
    assert.deepEqual(await (await request(first, "/optional")).json(), { authenticated: false });
    assert.equal((await request(second)).status, 200);
    await db.user.update({ where: { id: user.id }, data: { isActive: false } });
    assert.equal((await request(second)).status, 401);
    await db.user.update({ where: { id: user.id }, data: { isActive: true } });
    await db.session.update({ where: { token: tokenDigest(second) }, data: { expiresAt: new Date(0) } });
    assert.equal((await request(second)).status, 401);
    await db.$executeRawUnsafe('DROP TABLE sessions');
    assert.equal((await request(second)).status, 401);
    assert.deepEqual(await (await request(second, "/optional")).json(), { authenticated: false });
  } finally {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
    await db.$disconnect();
    await rm(dir, { recursive: true, force: true });
  }
});
