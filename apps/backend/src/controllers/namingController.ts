import { Request, Response, NextFunction } from "express";
import { namingService } from "../services/namingService.js";
import { namingRequestSchema, namingSuggestionSchema, namingValidationSchema } from "../utils/namingSystem.js";

export class NamingController {
  // 獲取命名建議
  async getSuggestions(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const { element, count = 5, language = "zh-TW", style = "CLASSIC" } = req.query;
      
      if (!element) {
        res.status(400).json({ error: "請提供元素類型" });
        return;
      }
      
      const suggestions = await namingService.generateSuggestions({
        element: element as string,
        count: parseInt(count as string) || 5,
        language: language as string,
        style: style as string
      });
      
      res.json({
        success: true,
        suggestions,
        count: suggestions.length
      });
    } catch (error: any) {
      next(error);
    }
  }
  
  // 驗證名稱
  async validateName(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const { name } = req.body;
      
      if (!name) {
        res.status(400).json({ error: "請提供名稱" });
        return;
      }
      
      const result = await namingService.validateName(name, userId);
      
      res.json({
        success: result.valid,
        ...result
      });
    } catch (error: any) {
      next(error);
    }
  }
  
  // AI輔助命名
  async getAISuggestions(req: Request, res: Response, next: NextFunction) {
    try {
      const { element, personality } = req.body;
      
      if (!element) {
        res.status(400).json({ error: "請提供元素類型" });
        return;
      }
      
      const suggestions = await namingService.getAISuggestions(element, personality);
      
      res.json({
        success: true,
        suggestions,
        source: "AI_GENERATED"
      });
    } catch (error: any) {
      next(error);
    }
  }
  
  // 獲取命名歷史
  async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const { limit = 10 } = req.query;
      
      // 這裡可以從數據庫獲取歷史
      // 目前返回空數組，待實現
      const history = [];
      
      res.json({
        success: true,
        history,
        count: history.length
      });
    } catch (error: any) {
      next(error);
    }
  }
  
  // 保存命名
  async saveName(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const { name, element, style = "CLASSIC", language = "zh-TW" } = req.body;
      
      if (!name || !element) {
        res.status(400).json({ error: "請提供名稱和元素類型" });
        return;
      }
      
      // 驗證名稱
      const validation = await namingService.validateName(name, userId);
      if (!validation.valid) {
        res.status(400).json({
          success: false,
          errors: validation.errors
        });
        return;
      }
      
      // 保存到歷史（待實現數據庫）
      // await namingService.saveNamingHistory(userId, name, element, style);
      
      res.json({
        success: true,
        name,
        element,
        style,
        language,
        message: "名稱保存成功！"
      });
    } catch (error: any) {
      next(error);
    }
  }
}

export const namingController = new NamingController();