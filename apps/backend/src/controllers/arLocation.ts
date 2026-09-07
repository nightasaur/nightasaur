import { Request, Response } from "express";
import { arLocationService } from "../services/arLocation.js";

export class ARLocationController {
  // 更新玩家位置
  async updatePlayerLocation(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { 
        latitude, 
        longitude, 
        accuracy, 
        altitude, 
        speed, 
        heading 
      } = req.body;
      
      if (!latitude || !longitude) {
        res.status(400).json({ error: "請提供經緯度座標" });
        return;
      }
      
      const result = await arLocationService.updatePlayerLocation(
        userId,
        latitude,
        longitude,
        accuracy,
        altitude,
        speed,
        heading
      );
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
  
  // 獲取附近的生成點
  async getNearbySpawns(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { latitude, longitude, radius = 500 } = req.query;
      
      if (!latitude || !longitude) {
        res.status(400).json({ error: "請提供經緯度座標" });
        return;
      }
      
      const spawns = await arLocationService.getNearbySpawns(
        parseFloat(latitude as string),
        parseFloat(longitude as string),
        parseInt(radius as string)
      );
      
      res.json({ spawns });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
  
  // 獲取附近的熱點
  async getNearbyHotspots(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { latitude, longitude, radius = 1000 } = req.query;
      
      if (!latitude || !longitude) {
        res.status(400).json({ error: "請提供經緯度座標" });
        return;
      }
      
      const hotspots = await arLocationService.getNearbyHotspots(
        parseFloat(latitude as string),
        parseFloat(longitude as string),
        parseInt(radius as string)
      );
      
      res.json({ hotspots });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
  
  // 造訪地點
  async visitLocation(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { locationId, latitude, longitude } = req.body;
      
      if (!locationId || !latitude || !longitude) {
        res.status(400).json({ 
          error: "請提供地點ID和經緯度座標" 
        });
        return;
      }
      
      const result = await arLocationService.visitLocation(
        userId,
        locationId,
        latitude,
        longitude
      );
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
  
  // AR 捕捉精靈
  async captureSpiritAR(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { 
        spiritId, 
        locationId, 
        latitude, 
        longitude, 
        arData, 
        captureTime, 
        accuracy 
      } = req.body;
      
      if (!spiritId || !locationId || !latitude || !longitude || 
          !arData || captureTime === undefined || accuracy === undefined) {
        res.status(400).json({ 
          error: "請提供完整的捕捉資料" 
        });
        return;
      }
      
      const result = await arLocationService.captureSpiritAR(
        userId,
        spiritId,
        locationId,
        latitude,
        longitude,
        arData,
        captureTime,
        accuracy
      );
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
  
  // 獲取探索路線
  async getExplorationRoute(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { latitude, longitude, radius = 2000 } = req.query;
      
      if (!latitude || !longitude) {
        res.status(400).json({ error: "請提供經緯度座標" });
        return;
      }
      
      const route = await arLocationService.getExplorationRoute(
        userId,
        parseFloat(latitude as string),
        parseFloat(longitude as string),
        parseInt(radius as string)
      );
      
      res.json({ route });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
  
  // 獲取玩家探索統計
  async getPlayerExplorationStats(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      
      const stats = await arLocationService.getPlayerExplorationStats(userId);
      res.json({ stats });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
  
  // 生成新的精靈生成（管理員用）
  async generateNewSpawns(req: Request, res: Response) {
    try {
      // 檢查是否為管理員
      const user = req.user;
      if (!user || user.role !== "ADMIN") {
        res.status(403).json({ error: "權限不足" });
        return;
      }
      
      const spawns = await arLocationService.generateNewSpawns();
      res.json({ 
        success: true, 
        generatedSpawns: spawns.length,
        spawns 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export const arLocationController = new ARLocationController();