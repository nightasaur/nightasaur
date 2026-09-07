import { Request, Response, NextFunction } from "express";
import { verifyToken, TokenPayload } from "../utils/jwt.js";

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "未提供認證令牌" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "認證令牌無效或已過期" });
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      req.user = verifyToken(token);
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
