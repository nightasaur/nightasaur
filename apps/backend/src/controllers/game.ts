import { Request, Response } from "express";
import { gameService } from "../services/game.js";

export async function getQuests(req: Request, res: Response) {
  const userId = (req as any).userId;
  const quests = await gameService.getQuests(userId);
  res.json({ quests });
}

export async function trackAction(req: Request, res: Response) {
  const userId = (req as any).userId;
  const { action, amount } = req.body;
  const result = await gameService.trackAction(userId, action, amount || 1);
  res.json(result);
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

export async function claimQuest(req: Request, res: Response) {
  const userId = (req as any).userId;
  const { questId } = req.params;
  const reward = await gameService.claimQuest(userId, questId);
  if (!reward) throw Object.assign(new Error("?¡æ??˜å??Žå‹µ"), { statusCode: 400 });
  res.json({ reward });
}

export const completeQuest = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { questId } = req.params;
  await gameService.completeQuest(userId, questId);
  res.json({ success: true });
};

export const useItem = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { itemId } = req.params;
  const { spiritId } = req.body;
  await gameService.useItem(userId, spiritId, itemId);
  res.json({ success: true });
};
