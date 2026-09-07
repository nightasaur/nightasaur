import { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.js";
import { registerSchema, loginSchema } from "../utils/validators.js";

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data = registerSchema.parse(req.body);
      const result = await authService.register(data.email, data.username, data.password);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data = loginSchema.parse(req.body);
      const result = await authService.login(data.email, data.password);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.headers.authorization?.split(" ")[1] || "";
      await authService.logout(token);
      res.json({ message: "已登出" });
    } catch (err) {
      next(err);
    }
  }

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await authService.getProfile(req.user!.userId);
      res.json(profile);
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
