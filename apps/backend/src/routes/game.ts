import { Router } from "express";
import { authMiddleware } from "../middleware/auth.ts";
import { getQuests, trackAction, getAchievements, getInventory, claimQuest, completeQuest, useItem } from "../controllers/game.js";

const router = Router();
router.use(authMiddleware);

router.get("/quests", getQuests);
router.post("/track", trackAction);
router.post("/quests/:questId/claim", claimQuest);
router.post("/quests/:questId/complete", completeQuest);
router.get("/achievements", getAchievements);
router.get("/inventory", getInventory);
router.post("/items/:itemId/use", useItem);

export default router;
