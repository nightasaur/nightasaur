import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { getQuests, getAchievements, getInventory, useItem } from "../controllers/game.js";

const router = Router();
router.use(authMiddleware);

router.get("/quests", getQuests);
router.get("/achievements", getAchievements);
router.get("/inventory", getInventory);
router.post("/items/:itemId/use", useItem);

export default router;
