import { Request, Response } from "express";
import { gameService } from "../services/game.js";
import { routeParam } from "../utils/request.js";

export async function getQuests(req: Request, res: Response) {
  const userId = (req as any).userId;
  const quests = await gameService.getQuests(userId);
  res.json({ quests });
}

export async function getAchievements(req: Request, res: Response) {
  const userId = (req as any).userId;
  const achievements = await gameService.getAchievements(userId);
  res.json({ achievements });
}

export async function getInventory(req: Request, res: Response) {
  const userId = (req as any).userId;
  const inventory = await gameService.getInventory(userId);
  res.json({ inventory });
}

export const useItem = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const itemId = routeParam(req, "itemId");
  const { spiritId } = req.body;
  if (typeof spiritId !== "string" || !spiritId) {
    throw Object.assign(new Error("請提供有效的精靈 ID"), { statusCode: 400 });
  }
  await gameService.useItem(userId, spiritId, itemId);
  res.json({ success: true });
};
