// SPDX-License-Identifier: MIT
import type { PrismaClient } from "@prisma/client";

export interface RemediationPlan {
  targetUserIds: string[];
  recoveryAdminId: string;
  apply?: boolean;
}

/** No CLI or production connection. Caller supplies an explicitly authorized DB.
 * Returns counts only; dry-run is default, targets are exact IDs, never wildcards.
 */
export async function remediateAccounts(db: PrismaClient, plan: RemediationPlan) {
  const targets = [...new Set(plan.targetUserIds)];
  if (!targets.length || targets.length > 20 || targets.length !== plan.targetUserIds.length ||
      targets.some(id => !id.trim() || id !== id.trim()) ||
      !plan.recoveryAdminId || targets.includes(plan.recoveryAdminId)) {
    throw new Error("Explicit unique target IDs and a separate recovery administrator are required");
  }
  return db.$transaction(async tx => {
    const recovery = await tx.user.findUnique({ where: { id: plan.recoveryAdminId },
      select: { isActive: true, role: true } });
    if (!recovery?.isActive || recovery.role !== "ADMIN") throw new Error("Active recovery administrator required");
    const where = { id: { in: targets } };
    const matched = await tx.user.count({ where });
    if (matched !== targets.length) throw new Error("Target set changed or contains unknown accounts");
    const activeTargets = await tx.user.count({ where: { ...where, isActive: true } });
    const sessions = await tx.session.count({ where: { userId: { in: targets } } });
    const resetTokens = await tx.passwordResetToken.count({ where: { userId: { in: targets }, used: false } });
    if (plan.apply === true) {
      await tx.user.updateMany({ where, data: { isActive: false } });
      await tx.session.deleteMany({ where: { userId: { in: targets } } });
      await tx.passwordResetToken.updateMany({ where: { userId: { in: targets }, used: false }, data: { used: true } });
    }
    return { targetAccounts: matched, activeTargets, sessions, resetTokens, applied: plan.apply === true };
  });
}
