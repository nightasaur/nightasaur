import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import express from "express";
import bcrypt from "bcryptjs";
const require = createRequire(import.meta.url);

test("admin HTTP controls preserve accounts, revoke sessions, protect admins and audit atomically", async () => {
  const dir = await mkdtemp(join(tmpdir(), "nightasaur-admin-"));
  await writeFile(join(dir, "test.db"), "", { flag: "wx" });
  process.env.DATABASE_URL = `file:${join(dir, "test.db")}`;
  execFileSync(
    process.execPath,
    [
      require.resolve("prisma/build/index.js"),
      "db",
      "push",
      "--skip-generate",
      "--schema",
      "prisma/schema.prisma",
    ],
    { env: process.env, stdio: "pipe" },
  );
  const { default: db } = await import("../src/config/prisma.js");
  const { default: router } = await import("../src/routes/adminAccounts.js");
  const { authMiddleware } = await import("../src/middleware/auth.js");
  const { issueSession } = await import("../src/services/sessions.js");
  const { authService } = await import("../src/services/auth.js");
  const app = express();
  app.use(express.json());
  app.use("/admin", router);
  app.get("/me", authMiddleware, (_q, r) => {
    r.json({ ok: true });
  });
  app.use((e: any, _q: any, r: any, _n: any) =>
    r.status(e.statusCode || 400).json({ error: "rejected" }),
  );
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${(server.address() as any).port}`;
  const call = (
    path: string,
    token?: string,
    body?: object,
    method = body ? "POST" : "GET",
  ) =>
    fetch(base + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  try {
    const admin = await db.user.create({
      data: {
        email: "admin@example.invalid",
        username: "admin",
        role: "ADMIN",
        passwordHash: "unused",
      },
    });
    const password = "isolated-fixture-password";
    const user = await db.user.create({
      data: {
        email: "user@example.invalid",
        username: "user",
        role: "USER",
        passwordHash: await bcrypt.hash(password, 4),
      },
    });
    const spirit = await db.spirit.create({
      data: { userId: user.id, name: "preserved", element: "MOON" },
    });
    const token = await issueSession(db, {
      userId: admin.id,
      email: admin.email,
      role: admin.role,
    });
    const userToken = await issueSession(db, {
      userId: user.id,
      email: user.email,
      role: user.role,
    });
    assert.equal((await call("/admin")).status, 401);
    assert.equal((await call("/admin", userToken)).status, 403);
    const listing = await (await call("/admin", token)).json();
    assert.equal(listing.total, 2);
    assert.equal("passwordHash" in listing.users[0], false);
    assert.equal((await call("/admin?page=-1", token)).status, 400);
    assert.equal(
      (
        await call(`/admin/${user.id}/actions`, userToken, {
          action: "BAN",
          reason: "test reason",
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await call(`/admin/${admin.id}/actions`, token, {
          action: "BAN",
          reason: "test reason",
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await call(`/admin/${user.id}/actions`, token, {
          action: "BAN",
          reason: " ",
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await call(`/admin/${user.id}/actions`, token, {
          action: "BAN",
          reason: "test suspension",
        })
      ).status,
      200,
    );
    assert.equal((await call("/me", userToken)).status, 401);
    await assert.rejects(authService.login(user.email, password), {
      statusCode: 403,
    });
    assert.equal(await db.spirit.count({ where: { id: spirit.id } }), 1);
    assert.equal(await db.accountAudit.count(), 1);
    assert.equal(
      (
        await call(`/admin/${user.id}/actions`, token, {
          action: "BAN",
          reason: "duplicate",
        })
      ).status,
      409,
    );
    assert.equal(
      (
        await call(`/admin/${user.id}/actions`, token, {
          action: "RESTORE",
          reason: "appeal accepted",
        })
      ).status,
      200,
    );
    assert.equal((await call("/me", userToken)).status, 401);
    const login = await authService.login(user.email, password);
    assert.equal((await call("/me", login.token)).status, 200);
    assert.equal(
      (
        await call(`/admin/${user.id}/actions`, token, {
          action: "REVOKE_SESSIONS",
          reason: "session reset",
        })
      ).status,
      200,
    );
    assert.equal((await call("/me", login.token)).status, 401);
    assert.equal(
      (await call(`/admin/${user.id}`, token, undefined, "DELETE")).status,
      405,
    );
    assert.equal(
      (await (await call(`/admin/${user.id}/history`, token)).json()).length,
      3,
    );
    // Failure to persist audit must roll back suspension.
    await db.$executeRawUnsafe(
      "CREATE TRIGGER audit_fail BEFORE INSERT ON account_audits BEGIN SELECT RAISE(ABORT, 'fixture failure'); END",
    );
    assert.notEqual(
      (
        await call(`/admin/${user.id}/actions`, token, {
          action: "BAN",
          reason: "rollback check",
        })
      ).status,
      200,
    );
    assert.equal(
      (await db.user.findUniqueOrThrow({ where: { id: user.id } })).isActive,
      true,
    );
    await db.$executeRawUnsafe("DROP TRIGGER audit_fail");
    await db.$executeRawUnsafe(
      "CREATE TRIGGER users_no_delete BEFORE DELETE ON users BEGIN SELECT RAISE(ABORT, 'Account removal forbidden'); END",
    );
    await assert.rejects(db.user.delete({ where: { id: user.id } }));
    assert.equal(await db.user.count({ where: { id: user.id } }), 1);
    await db.user.update({
      where: { id: admin.id },
      data: { isActive: false },
    });
    assert.equal((await call("/admin", token)).status, 401);
  } finally {
    await new Promise<void>((r) => server.close(() => r()));
    await db.$disconnect();
    await rm(dir, { recursive: true, force: true });
  }
});
