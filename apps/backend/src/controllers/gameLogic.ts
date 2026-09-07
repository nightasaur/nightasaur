import { Request, Response } from "express";
import { gameLogicService } from "../services/gameLogic.js";

export class GameLogicController {
  // 執行遊戲循環
  async executeGameCycle(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { spiritId, action } = req.body;
      
      if (!spiritId || !action) {
        res.status(400).json({ 
          error: "請提供精靈ID和動作類型" 
        });
        return;
      }
      
      const results = await gameLogicService.completeGameCycle(
        userId, 
        spiritId, 
        action
      );
      
      res.json(results);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
  
  // 獲取遊戲概覽
  async getGameOverview(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      
      const overview = await gameLogicService.getGameOverview(userId);
      res.json(overview);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
  
  // 快速開始遊戲（一鍵開始）
  async quickStart(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      
      // 獲取使用者的第一個活躍精靈
      const spirits = await prisma.spirit.findMany({
        where: { userId, isActive: true },
        take: 1
      });
      
      if (spirits.length === 0) {
        res.status(404).json({ error: "沒有可用的精靈" });
        return;
      }
      
      const spiritId = spirits[0].id;
      
      // 執行完整的遊戲循環
      const results = await gameLogicService.completeGameCycle(
        userId, 
        spiritId, 
        "CHAT"
      );
      
      res.json({
        success: true,
        spirit: spirits[0],
        results
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export const gameLogicController = new GameLogicController();