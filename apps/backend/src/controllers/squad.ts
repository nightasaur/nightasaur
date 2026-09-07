import { Request, Response } from "express";
import { squadService } from "../services/squad.js";
import { gameLogicService } from "../services/gameLogic.js";

export class SquadController {
  // 創建小隊
  async createSquad(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { name } = req.body;
      
      if (!name) {
        res.status(400).json({ error: "請提供小隊名稱" });
        return;
      }
      
      const squad = await squadService.createSquad(userId, name);
      res.status(201).json({ squad });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
  
  // 獲取小隊資訊
  async getSquad(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      
      const squad = await squadService.getSquad(userId);
      
      if (!squad) {
        res.status(404).json({ error: "尚未創建小隊" });
        return;
      }
      
      res.json({ squad });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
  
  // 添加精靈到小隊
  async addSpiritToSquad(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { spiritId, position } = req.body;
      
      if (!spiritId) {
        res.status(400).json({ error: "請提供精靈ID" });
        return;
      }
      
      const squadMember = await squadService.addSpiritToSquad(
        userId, 
        spiritId, 
        position
      );
      
      res.status(201).json({ squadMember });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
  
  // 從小隊中移除精靈
  async removeSpiritFromSquad(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { spiritId } = req.params;
      
      if (!spiritId) {
        res.status(400).json({ error: "請提供精靈ID" });
        return;
      }
      
      const success = await squadService.removeSpiritFromSquad(userId, spiritId);
      res.json({ success });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
  
  // 切換主精靈
  async switchActiveSpirit(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { spiritId } = req.body;
      
      if (!spiritId) {
        res.status(400).json({ error: "請提供精靈ID" });
        return;
      }
      
      const result = await squadService.switchActiveSpirit(userId, spiritId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
  
  // 訓練小隊精靈
  async trainSquadSpirit(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { spiritId, trainingType, duration } = req.body;
      
      if (!spiritId || !trainingType || !duration) {
        res.status(400).json({ 
          error: "請提供精靈ID、訓練類型和持續時間" 
        });
        return;
      }
      
      const result = await squadService.trainSquadSpirit(
        userId, 
        spiritId, 
        trainingType, 
        duration
      );
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
  
  // 獲取小隊統計
  async getSquadStats(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      
      const stats = await squadService.getSquadStats(userId);
      
      if (!stats) {
        res.status(404).json({ error: "尚未創建小隊" });
        return;
      }
      
      res.json({ stats });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
// 小隊益智挑戰
  async squadPuzzleChallenge(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { puzzleId } = req.body;
      
      if (!puzzleId) {
        res.status(400).json({ error: "請提供益智關卡ID" });
        return;
      }
      
      const result = await gameLogicService.squadPuzzleChallenge(userId, puzzleId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
  
  // 小隊日常訓練
  async squadDailyTraining(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      
      const result = await gameLogicService.squadDailyTraining(userId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
  
  // 自動創建小隊
  async autoCreateSquad(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      
      const squad = await gameLogicService.autoCreateSquad(userId);
      res.json({ squad });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
  
  // 快速切換小隊精靈
  async quickSquadSwitch(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      
      const result = await gameLogicService.quickSquadSwitch(userId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
  
  // 獲取完整遊戲狀態
  async getFullGameState(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      
      const gameState = await gameLogicService.getFullGameState(userId);
      res.json(gameState);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}