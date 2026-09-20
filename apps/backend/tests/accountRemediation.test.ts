import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { PrismaClient } from "@prisma/client";
import { remediateAccounts } from "../src/services/accountRemediation.js";
const require = createRequire(import.meta.url);

test("account remediation defaults to no writes, requires recovery, and changes only exact targets", async () => {
  const dir = await mkdtemp(join(tmpdir(), "nightasaur-remediation-"));
  const url = `file:${join(dir, "test.db")}`;
  execFileSync(process.execPath, [require.resolve("prisma/build/index.js"), "db", "push", "--skip-generate", "--schema", "prisma/schema.prisma"], { env: { ...process.env, DATABASE_URL: url }, stdio: "pipe" });
  const db = new PrismaClient({ datasources: { db: { url } } });
  try {
    const [target, recovery, other] = await Promise.all(["target", "recovery", "other"].map(name => db.user.create({ data: {
      email: `${name}@example.invalid`, username: name, passwordHash: "fixture-not-login", role: "ADMIN",
    } })));
    for (const user of [target, other]) {
      await db.session.create({ data: { userId: user.id, token: `session-${user.id}`, expiresAt: new Date(Date.now()+60000) } });
      await db.passwordResetToken.create({ data: { userId: user.id, token: `reset-${user.id}`, expiresAt: new Date(Date.now()+60000) } });
    }
    const plan = { targetUserIds: [target.id], recoveryAdminId: recovery.id };
    assert.deepEqual(await remediateAccounts(db, plan), { targetAccounts: 1, activeTargets: 1, sessions: 1, resetTokens: 1, applied: false });
    assert.equal((await db.user.findUniqueOrThrow({ where: { id: target.id } })).isActive, true);
    for (const targetUserIds of [[], [target.id,target.id], ["missing"], [recovery.id]]) {
      await assert.rejects(remediateAccounts(db, { ...plan, targetUserIds, apply: true }));
    }
    await db.user.update({ where: { id: recovery.id }, data: { isActive: false } });
    await assert.rejects(remediateAccounts(db, { ...plan, apply: true }));
    await db.user.update({ where: { id: recovery.id }, data: { isActive: true } });
    await remediateAccounts(db, { ...plan, apply: true });
    assert.equal((await db.user.findUniqueOrThrow({ where: { id: target.id } })).isActive, false);
    assert.equal(await db.session.count({ where: { userId: target.id } }), 0);
    assert.equal(await db.passwordResetToken.count({ where: { userId: target.id, used: false } }), 0);
    assert.equal((await db.user.findUniqueOrThrow({ where: { id: other.id } })).isActive, true);
    assert.equal(await db.session.count({ where: { userId: other.id } }), 1);
    assert.equal(await db.passwordResetToken.count({ where: { userId: other.id, used: false } }), 1);
  } finally { await db.$disconnect(); await rm(dir, { recursive: true, force: true }); }
});
