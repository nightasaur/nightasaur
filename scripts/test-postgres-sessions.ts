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
  await assert.rejects(db.user.delete({ where: { id: user.id } }));
  await assert.rejects(db.$executeRawUnsafe('TRUNCATE TABLE "users" CASCADE'));
  assert.equal(await db.user.count({where:{id:user.id}}),1);
  const audit=await db.accountAudit.create({data:{actorId:user.id,targetId:user.id,action:"TEST",reason:"isolated migration test",previousActive:true,resultingActive:true}});
  await assert.rejects(db.accountAudit.update({where:{id:audit.id},data:{reason:"rewrite"}}));
  await assert.rejects(db.accountAudit.delete({where:{id:audit.id}}));
  console.log("Isolated PostgreSQL migration and session smoke test passed");
} finally { await db.$disconnect(); }

}
main().catch(() => { console.error("PostgreSQL fixture smoke test failed"); process.exitCode = 1; });
