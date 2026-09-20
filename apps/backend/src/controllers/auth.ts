import { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.js";
import { registerSchema, loginSchema } from "../utils/validators.js";

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data = registerSchema.parse(req.body);
      const result = await authService.register(data.email, data.username, data.password);
      
      // 根據服務層回傳的格式回應
      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(result.statusCode || 400).json(result);
      }
    } catch (err: any) {
      // 處理服務層拋出的結構化錯誤
      if (err.success !== undefined) {
        res.status(err.statusCode || 400).json(err);
      } else {
        // 處理其他錯誤（如驗證錯誤）
        next(err);
      }
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data = loginSchema.parse(req.body);
      const result = await authService.login(data.email, data.password);
      
      // 根據服務層回傳的格式回應
      if (result.success) {
        res.json(result);
      } else {
        res.status(result.statusCode || 401).json(result);
      }
    } catch (err: any) {
      // 處理服務層拋出的結構化錯誤
      if (err.success !== undefined) {
        res.status(err.statusCode || 401).json(err);
      } else {
        // 處理其他錯誤（如驗證錯誤）
        next(err);
      }
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.headers.authorization?.split(" ")[1] || "";
      const result = await authService.logout(token);
      res.json(result);
    } catch (err: any) {
      // 處理服務層拋出的結構化錯誤
      if (err.success !== undefined) {
        res.status(err.statusCode || 400).json(err);
      } else {
        next(err);
      }
    }
  }

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.getProfile(req.user!.userId);
      
      // 根據服務層回傳的格式回應
      if (result.success) {
        res.json(result);
      } else {
        res.status(result.statusCode || 404).json(result);
      }
    } catch (err: any) {
      // 處理服務層拋出的結構化錯誤
      if (err.success !== undefined) {
        res.status(err.statusCode || 404).json(err);
      } else {
        next(err);
      }
    }
  }
}

export const authController = new AuthController();
