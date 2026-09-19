import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import { config } from "../config/index.js";

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export function signToken(payload: TokenPayload): string {
  const secret = config.jwt.secret;
  const expiresIn = config.jwt.expiresIn;

  if (!secret) {
    throw new Error("JWT secret is not configured");
  }

  return jwt.sign(payload, secret, {
    expiresIn,
    jwtid: randomUUID(),
    algorithm: "HS256",
    issuer: "nightasaur-backend",
    audience: "nightasaur-user",
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
      typeof payload.exp !== "number") throw new Error("Invalid token claims");
  return payload as TokenPayload & { exp: number };
}
