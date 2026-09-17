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
  } as jwt.SignOptions);
}

export function verifyToken(token: string): TokenPayload {
  const secret = config.jwt.secret;

  if (!secret) {
    throw new Error("JWT secret is not configured");
  }

  return jwt.verify(token, secret) as TokenPayload;
}
