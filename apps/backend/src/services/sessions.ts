// SPDX-License-Identifier: MIT
import { createHash } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { signToken, verifyToken, type TokenPayload } from "../utils/jwt.js";

export const tokenDigest = (token: string) => createHash("sha256").update(token).digest("hex");

export async function issueSession(db: PrismaClient, user: TokenPayload): Promise<string> {
  const token = signToken(user);
  const claims = verifyToken(token);
  await db.session.create({ data: { userId: user.userId, token: tokenDigest(token),
    expiresAt: new Date(claims.exp * 1000) } });
  return token;
}

export async function hasSession(db: PrismaClient, token: string, userId: string): Promise<boolean> {
  return (await db.session.count({ where: { token: tokenDigest(token), userId,
    expiresAt: { gt: new Date() } } })) === 1;
}

export async function revokeSession(db: PrismaClient, token: string): Promise<void> {
  await db.session.deleteMany({ where: { token: tokenDigest(token) } });
}
