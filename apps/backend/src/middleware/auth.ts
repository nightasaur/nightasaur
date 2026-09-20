import { Request, Response, NextFunction } from "express";
import { verifyToken, TokenPayload } from "../utils/jwt.js";
import { hasSession } from "../services/sessions.js";
import prisma from "../config/prisma.js";

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
      userId?: string;
    }
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "未提供認證令牌" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = verifyToken(token);
    const [user, sessionExists] = await Promise.all([
      prisma.user.findUnique({ where: { id: payload.userId },
        select: { id: true, email: true, role: true, isActive: true } }),
      hasSession(prisma, token, payload.userId),
    ]);
    if (!user?.isActive || !sessionExists) {
      res.status(401).json({ error: "帳號不可用" });
      return;
    }
    req.user = { userId: user.id, email: user.email, role: user.role, sessionId: payload.sessionId };
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: "認證令牌無效或已過期" });
  }
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const payload = verifyToken(token);
      const [user, sessionExists] = await Promise.all([
        prisma.user.findUnique({ where: { id: payload.userId },
          select: { id: true, email: true, role: true, isActive: true } }),
        hasSession(prisma, token, payload.userId),
      ]);
      if (user?.isActive && sessionExists) {
        req.user = { userId: user.id, email: user.email, role: user.role, sessionId: payload.sessionId };
        req.userId = user.id;
      }
    } catch {
      // Token 無效也沒關係
    }
  }
  next();
}

export function adminMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: "未登入" });
    return;
  }
  if (req.user.role !== "ADMIN") {
    res.status(403).json({ error: "權限不足" });
    return;
  }
  next();
}
