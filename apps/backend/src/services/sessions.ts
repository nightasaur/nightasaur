// SPDX-License-Identifier: MIT
import { createHash } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { signToken, verifyToken, type TokenPayload } from "../utils/jwt.js";

export const tokenDigest = (token: string) => createHash("sha256").update(token).digest("hex");
const MAX_ACTIVE_SESSIONS = 20;
type SessionSubject = Pick<TokenPayload, "userId" | "email" | "role">;

export async function issueSession(db: PrismaClient, user: SessionSubject): Promise<string> {
  const token = signToken(user);
  const claims = verifyToken(token);
  await db.$transaction(async tx => {
    await tx.session.deleteMany({
      where: { userId: user.userId, expiresAt: { lte: new Date() } },
    });
    const overflow = await tx.session.findMany({
      where: { userId: user.userId },
      select: { id: true },
      orderBy: { createdAt: "desc" },
      skip: MAX_ACTIVE_SESSIONS - 1,
    });
    if (overflow.length) {
      await tx.session.deleteMany({ where: { id: { in: overflow.map(item => item.id) } } });
    }
    await tx.session.create({ data: {
      id: claims.sessionId,
      userId: user.userId,
      token: tokenDigest(token),
      expiresAt: new Date(claims.exp * 1000),
    } });
  });
  return token;
}

export async function hasSession(db: PrismaClient, token: string, userId: string): Promise<boolean> {
  const claims = verifyToken(token);
  if (claims.userId !== userId) return false;
  return Boolean(await db.session.findFirst({ where: {
    id: claims.sessionId,
    token: tokenDigest(token),
    userId,
    expiresAt: { gt: new Date() },
  }, select: { id: true } }));
}

export async function revokeSession(db: PrismaClient, token: string): Promise<void> {
  const claims = verifyToken(token);
  await db.session.deleteMany({ where: {
    id: claims.sessionId,
    token: tokenDigest(token),
    userId: claims.userId,
  } });
}
