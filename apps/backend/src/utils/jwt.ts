import { createHash, randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import { config } from "../config/index.js";

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  sessionId: string;
}

export type TokenSubject = Omit<TokenPayload, "sessionId"> & { sessionId?: string };

export const SESSION_TTL_MS = 60 * 60 * 1000;

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function signToken(payload: TokenSubject): string {
  const secret = config.jwt.secret;
  const expiresIn = config.jwt.expiresIn;

  if (!secret) {
    throw new Error("JWT secret is not configured");
  }

  const sessionId = payload.sessionId || randomUUID();
  return jwt.sign({ ...payload, sessionId }, secret, {
    expiresIn,
    algorithm: "HS256",
    issuer: "nightasaur-backend",
    audience: "nightasaur-user",
    jwtid: sessionId,
  } as jwt.SignOptions);
}

export function verifyToken(token: string): TokenPayload & { exp: number } {
  const secret = config.jwt.secret;

  if (!secret) {
    throw new Error("JWT secret is not configured");
  }

  const payload = jwt.verify(token, secret, {
    algorithms: ["HS256"], issuer: "nightasaur-backend", audience: "nightasaur-user",
  });
  if (typeof payload === "string" || typeof payload.userId !== "string" || !payload.userId ||
      typeof payload.email !== "string" || typeof payload.role !== "string" ||
      typeof payload.sessionId !== "string" || !payload.sessionId ||
      payload.jti !== payload.sessionId || typeof payload.exp !== "number") {
    throw new Error("Invalid token claims");
  }
  return payload as TokenPayload & { exp: number };
}
