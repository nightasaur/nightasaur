import { Request, Response } from "express";
import { puzzleService } from "../services/puzzle.js";

export class PuzzleController {
  // 獲取可用的益智關卡
  async getAvailablePuzzles(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { spiritId } = req.params;
      
      if (!spiritId) {
        res.status(400).json({ error: "請提供精靈ID" });
        return;
      }
      
      const puzzles = await puzzleService.getAvailablePuzzles(userId, spiritId);
      res.json({ puzzles });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
  
  // 獲取每日益智
  async getDailyPuzzle(req: Request, res: Response) {
    try {
      const dailyPuzzle = await puzzleService.getDailyPuzzle();
      res.json({ dailyPuzzle });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
  
  // 嘗試解決益智
  async attemptPuzzle(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { spiritId, puzzleId } = req.params;
      const { solution, timeSpent } = req.body;
      
      if (!spiritId || !puzzleId || !solution || timeSpent === undefined) {
        res.status(400).json({ 
          error: "請提供精靈ID、關卡ID、解答和花費時間" 
        });
        return;
      }
      
      const result = await puzzleService.attemptPuzzle(
        userId, 
        spiritId, 
        puzzleId, 
        solution, 
        timeSpent
      );
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
  
  // 獲取精靈升級狀態
  async getSpiritUpgrades(req: Request, res: Response) {
    try {
      const { spiritId } = req.params;
      
      if (!spiritId) {
        res.status(400).json({ error: "請提供精靈ID" });
        return;
      }
      
      const upgrades = await puzzleService.getSpiritUpgrades(spiritId);
      res.json({ upgrades });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
  
  // 獲取排行榜
  async getLeaderboard(req: Request, res: Response) {
    try {
      const { puzzleId } = req.query;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const leaderboard = await puzzleService.getLeaderboard(
        puzzleId as string, 
        limit
      );
      
      res.json({ leaderboard });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
  
  // 創建測試益智關卡（管理員用）
  async createTestPuzzle(req: Request, res: Response) {
    try {
      // 檢查是否為管理員
      const user = req.user;
      if (!user || user.role !== "ADMIN") {
        res.status(403).json({ error: "權限不足" });
        return;
      }
      
      const puzzleData = {
        title: "記憶配對遊戲",
        description: "記住卡片位置並配對相同的圖案",
        difficulty: "EASY",
        type: "MEMORY",
        puzzleData: JSON.stringify({
          cards: ["🔥", "💧", "🌿", "⚡", "✨", "🌑"],
          gridSize: 4
        }),
        solution: JSON.stringify({
          pairs: [
            [0, 8], [1, 9], [2, 10], [3, 11],
            [4, 12], [5, 13], [6, 14], [7, 15]
          ]
        }),
        reward: JSON.stringify({
          xp: 50,
          items: ["經驗糖果"]
        }),
        unlockLevel: 1,
        timeLimit: 60
      };
      
      const puzzle = await prisma.puzzleLevel.create({
        data: puzzleData
      });
      
      res.status(201).json({ puzzle });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export const puzzleController = new PuzzleController();