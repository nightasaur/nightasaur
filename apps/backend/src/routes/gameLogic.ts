import { Router } from "express";
import { gameLogicController } from "../controllers/gameLogic.js";
import { authMiddleware } from "../middleware/auth.ts";

const router = Router();

// 所有路由都需要認證
router.use(authMiddleware);

// 執行遊戲循環
router.post("/cycle", gameLogicController.executeGameCycle);

// 獲取遊戲概覽
router.get("/overview", gameLogicController.getGameOverview);

// 快速開始遊戲
router.post("/quick-start", gameLogicController.quickStart);

export default router;