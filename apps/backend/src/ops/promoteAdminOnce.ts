// SPDX-License-Identifier: MIT
import { randomUUID } from "node:crypto";
import prisma from "../config/prisma.js";

const AUTHORIZED_EMAIL = "ceo@cccbuyear.com";
const REQUIRED_CONFIRMATION = "PROMOTE_EXACT_ADMIN_ONCE";

async function main() {
  const requestedEmail = process.env.ONE_TIME_ADMIN_EMAIL || "";
  const confirmation = process.env.ONE_TIME_ADMIN_CONFIRMATION || "";
  const operationId = process.env.ONE_TIME_ADMIN_OPERATION_ID || randomUUID();

  if (process.env.NODE_ENV !== "production") throw new Error("Production environment required");
  if (requestedEmail !== AUTHORIZED_EMAIL || requestedEmail !== requestedEmail.trim().toLowerCase()) {
    throw new Error("Exact authorized email required");
  }
  if (confirmation !== REQUIRED_CONFIRMATION) throw new Error("Explicit one-time confirmation required");
  if (!/^[A-Za-z0-9._:-]{8,100}$/.test(operationId)) throw new Error("Valid operation id required");

  const result = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      CREATE TABLE IF NOT EXISTS operational_audit_logs (
        id TEXT PRIMARY KEY,
        event TEXT NOT NULL,
        actor TEXT NOT NULL,
        target_user_id TEXT NOT NULL,
        target_email TEXT NOT NULL,
        before_role TEXT NOT NULL,
        after_role TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    const matches = await tx.user.findMany({
      where: { email: requestedEmail },
      select: { id: true, email: true, role: true, isActive: true },
      take: 2,
    });
    if (matches.length !== 1) throw new Error("Expected exactly one matching account");
    const target = matches[0];
    if (!target.isActive) throw new Error("Target account must be active");

    if (target.role !== "ADMIN") {
      await tx.user.update({ where: { id: target.id }, data: { role: "ADMIN" } });
    }
    await tx.$executeRaw`
      INSERT INTO operational_audit_logs
        (id, event, actor, target_user_id, target_email, before_role, after_role)
      VALUES
        (${operationId}, ${"ADMIN_PROMOTION"}, ${"chatgpt-work-authorized-operation"},
         ${target.id}, ${target.email}, ${target.role}, ${"ADMIN"})
    `;
    return { userId: target.id, email: target.email, active: target.isActive,
      beforeRole: target.role, afterRole: "ADMIN", changed: target.role !== "ADMIN" };
  });

  console.log(JSON.stringify({ event: "ADMIN_PROMOTION_AUDITED", operationId, ...result }));
}

main().catch((error) => {
  console.error(JSON.stringify({ event: "ADMIN_PROMOTION_FAILED", reason: error.message }));
  process.exitCode = 1;
}).finally(async () => prisma.$disconnect());
