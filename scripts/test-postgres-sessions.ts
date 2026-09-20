// SPDX-License-Identifier: MIT
// Only for the isolated CI service declared in .github/workflows/ci.yml.
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
const url = new URL(process.env.DATABASE_URL || "http://invalid");
if (process.env.CI !== "true" || url.hostname !== "127.0.0.1" ||
    url.pathname !== "/nightasaur_ci" || url.username !== "nightasaur_ci") {
  throw new Error("Refusing non-isolated PostgreSQL test target");
}
process.env.JWT_SECRET = randomBytes(48).toString("base64url");
process.env.NODE_ENV = "test";
async function main() {
const { PrismaClient } = await import("@prisma/client");
const { issueSession, hasSession, revokeSession } = await import("../apps/backend/src/services/sessions.js");
const db = new PrismaClient();
try {
  const user = await db.user.create({ data: {
    email: "postgres-fixture@example.invalid", username: "postgres-fixture",
    passwordHash: "not-a-real-password-hash", isActive: true,
  } });
  const subject = { userId: user.id, email: user.email, role: user.role };
  const token = await issueSession(db, subject);
  assert.equal(await hasSession(db, token, user.id), true);
  await revokeSession(db, token);
  assert.equal(await hasSession(db, token, user.id), false);
  assert.equal((await db.user.findUniqueOrThrow({ where: { id: user.id } })).passwordHash, "not-a-real-password-hash");
  const { makeReceipt, provision, cleanup } = await import('./test-account-lifecycle.mjs');
  const key = randomBytes(48).toString('hex');
  const target = process.env.DATABASE_URL!;
  const receipt = makeReceipt(key, target);
  await provision(db, receipt, key, target, randomBytes(32).toString('hex'));
  const fixtureId = receipt.payload.id;
  const spirit = await db.spirit.findFirstOrThrow({ where: { userId: fixtureId } });
  await db.conversation.create({ data: { spiritId: spirit.id, userMessage: 'synthetic', aiResponse: 'synthetic' } });
  await db.session.create({ data: { userId: fixtureId, token: randomBytes(32).toString('hex'), expiresAt: new Date(Date.now() + 60000) } });
  assert.equal((await cleanup(db, receipt, key, target)).status, 'preview');
  assert.equal((await cleanup(db, receipt, key, target, fixtureId)).status, 'deleted');
  assert.equal(await db.session.count({ where: { userId: fixtureId } }), 0);
  assert.equal(await db.conversation.count({ where: { spiritId: spirit.id } }), 0);
  assert.equal(await db.spirit.count({ where: { id: spirit.id } }), 0);
  assert.equal(await db.user.count({ where: { id: user.id } }), 1);
  assert.equal((await cleanup(db, receipt, key, target, fixtureId)).status, 'already_absent');
  console.log("Isolated PostgreSQL migration and session smoke test passed");
} finally { await db.$disconnect(); }

}
main().catch(() => { console.error("PostgreSQL fixture smoke test failed"); process.exitCode = 1; });
