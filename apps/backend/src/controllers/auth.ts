import { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.js";
import { registerSchema, loginSchema } from "../utils/validators.js";

// 定義通用的 API 回應介面
interface ApiResponse {
  success: boolean;
  message?: string;
  [key: string]: any;
}

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data = registerSchema.parse(req.body);
      const result = await authService.register(data.email, data.username, data.password) as ApiResponse;
      
      // 根據服務層回傳的格式回應
      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status((result as any).statusCode || 400).json(result);
      }
    } catch (err: any) {
      // 處理服務層拋出的結構化錯誤
      if ((err as any).success !== undefined) {
        res.status((err as any).statusCode || 400).json(err);
      } else {
        // 處理其他錯誤（如驗證錯誤）
        next(err);
      }
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data = loginSchema.parse(req.body);
      const result = await authService.login(data.email, data.password) as any;
      
      // login 方法回傳的是 {user, token}，所以我們需要包裝它
      const response = {
        success: true,
        ...result
      };
      res.json(response);
    } catch (err: any) {
      // 處理服務層拋出的結構化錯誤
      if ((err as any).success !== undefined) {
        res.status((err as any).statusCode || 401).json(err);
      } else {
        // 處理其他錯誤（如驗證錯誤）
        next(err);
      }
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.headers.authorization?.split(" ")[1] || "";
      await authService.logout(token);
      res.json({ success: true, message: "登出成功" });
    } catch (err: any) {
      // 處理服務層拋出的結構化錯誤
      if ((err as any).success !== undefined) {
        res.status((err as any).statusCode || 400).json(err);
      } else {
        next(err);
      }
    }
  }

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.getProfile(req.user!.userId) as any;
      
      // getProfile 方法回傳的是用戶資料，所以我們需要包裝它
      const response = {
        success: true,
        ...result
      };
      res.json(response);
    } catch (err: any) {
      // 處理服務層拋出的結構化錯誤
      if ((err as any).success !== undefined) {
        res.status((err as any).statusCode || 404).json(err);
      } else {
        next(err);
      }
    }
  }
}

export const authController = new AuthController();
