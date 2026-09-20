import prisma from "../config/prisma.js";
import { z } from "zod";
const actionSchema = z
  .object({
    action: z.enum(["BAN", "RESTORE", "REVOKE_SESSIONS"]),
    reason: z.string().trim().min(3).max(500),
  })
  .strict();
const querySchema = z.object({
  q: z.string().trim().max(100).default(""),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  status: z.enum(["all", "active", "banned"]).default("all"),
});
const select = {
  id: true,
  email: true,
  username: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;
const fail = (message: string, statusCode: number): never => {
  throw Object.assign(new Error(message), { statusCode });
};
export async function listAccounts(input: unknown) {
  const { q, page, status } = querySchema.parse(input);
  const where = {
    ...(status === "all" ? {} : { isActive: status === "active" }),
    ...(q
      ? { OR: [{ email: { contains: q } }, { username: { contains: q } }] }
      : {}),
  };
  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select,
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      skip: (page - 1) * 20,
      take: 20,
    }),
    prisma.user.count({ where }),
  ]);
  return { users, total, page, pageSize: 20 };
}
export async function changeAccount(
  actorId: string,
  targetId: string,
  input: unknown,
) {
  const { action, reason } = actionSchema.parse(input);
  return prisma.$transaction(async (tx) => {
    const actor = await tx.user.findUnique({ where: { id: actorId }, select });
    if (!actor?.isActive || actor.role !== "ADMIN")
      fail("需要有效管理員權限", 403);
    const target = await tx.user.findUnique({
      where: { id: targetId },
      select,
    });
    if (!target) return fail("帳號不存在", 404);
    if (targetId === actorId || target.role === "ADMIN")
      fail("管理員帳號受保護，不能在此變更", 403);
    const resultingActive =
      action === "BAN" ? false : action === "RESTORE" ? true : target.isActive;
    if (action !== "REVOKE_SESSIONS" && resultingActive === target.isActive)
      fail("帳號狀態已變更，請重新整理", 409);
    const changed = await tx.user.updateMany({
      where: {
        id: targetId,
        role: target.role,
        isActive: target.isActive,
        updatedAt: target.updatedAt,
      },
      data: { isActive: resultingActive },
    });
    if (changed.count !== 1) fail("帳號狀態已變更，請重新整理", 409);
    await tx.session.deleteMany({ where: { userId: targetId } });
    await tx.accountAudit.create({
      data: {
        actorId,
        targetId,
        action,
        reason,
        previousActive: target.isActive,
        resultingActive,
      },
    });
    return tx.user.findUniqueOrThrow({ where: { id: targetId }, select });
  });
}
export async function accountHistory(targetId: string) {
  return prisma.accountAudit.findMany({
    where: { targetId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 50,
  });
}
