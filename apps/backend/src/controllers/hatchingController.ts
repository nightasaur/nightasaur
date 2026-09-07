import { Request, Response, NextFunction } from "express";
import { hatchingService } from "../services/hatchingService.js";

export class HatchingController {
  // 開始孵化
  async startHatching(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const { spiritId, temperature = 30, humidity = 50 } = req.body;
      
      if (!spiritId) {
        res.status(400).json({ error: "請提供精靈ID" });
        return;
      }
      
      const result = await hatchingService.startHatching({
        spiritId,
        userId,
        temperature,
        humidity
      });
      
      res.json(result);
    } catch (error: any) {
      next(error);
    }
  }
  
  // 互動孵化
  async interact(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const { spiritId, interactionType, intensity = 1 } = req.body;
      
      if (!spiritId || !interactionType) {
        res.status(400).json({ 
          error: "請提供精靈ID和互動類型" 
        });
        return;
      }
      
      const result = await hatchingService.handleInteraction({
        spiritId,
        userId,
        interactionType,
        intensity
      });
      
      res.json(result);
    } catch (error: any) {
      next(error);
    }
  }
  
  // 獲取孵化狀態
  async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { spiritId } = req.params;
      
      if (!spiritId) {
        res.status(400).json({ error: "請提供精靈ID" });
        return;
      }
      
      const status = await hatchingService.getHatchingStatus(spiritId);
      
      res.json({
        success: true,
        ...status
      });
    } catch (error: any) {
      next(error);
    }
  }
  
  // 獲取孵化歷史
  async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const { limit = 10 } = req.query;
      
      // 這裡可以從數據庫獲取孵化歷史
      // 目前返回示例數據
      const history = [
        {
          spiritId: "example_1",
          startTime: new Date(Date.now() - 86400000).toISOString(),
          endTime: new Date().toISOString(),
          status: "COMPLETED",
          finalProgress: 100
        }
      ];
      
      res.json({
        success: true,
        history,
        count: history.length
      });
    } catch (error: any) {
      next(error);
    }
  }
  
  // 批量互動
  async batchInteract(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const { spiritId, interactions } = req.body;
      
      if (!spiritId || !Array.isArray(interactions)) {
        res.status(400).json({ 
          error: "請提供精靈ID和互動數組" 
        });
        return;
      }
      
      const results = [];
      for (const interaction of interactions.slice(0, 10)) { // 限制最多10個
        try {
          const result = await hatchingService.handleInteraction({
            spiritId,
            userId,
            interactionType: interaction.type,
            intensity: interaction.intensity || 1
          });
          results.push(result);
        } catch (error) {
          results.push({ error: error.message });
        }
      }
      
      res.json({
        success: true,
        results,
        total: results.length
      });
    } catch (error: any) {
      next(error);
    }
  }
  
  // 加速孵化（使用道具）
  async accelerate(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const { spiritId, itemId } = req.body;
      
      if (!spiritId || !itemId) {
        res.status(400).json({ 
          error: "請提供精靈ID和道具ID" 
        });
        return;
      }
      
      // 這裡可以實現使用道具加速孵化的邏輯
      // 目前返回示例響應
      
      res.json({
        success: true,
        message: "使用了孵化加速道具！",
        timeReduced: 3600, // 減少1小時
        itemUsed: itemId
      });
    } catch (error: any) {
      next(error);
    }
  }
}

export const hatchingController = new HatchingController();