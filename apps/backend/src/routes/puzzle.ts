import { Router } from "express";
import { puzzleController } from "../controllers/puzzle.js";
import { authMiddleware } from "../middleware/auth.ts";

const router = Router();

// 所有路由都需要認證
router.use(authMiddleware);

// 獲取可用的益智關卡
router.get("/spirits/:spiritId/puzzles", puzzleController.getAvailablePuzzles);

// 獲取每日益智
router.get("/daily", puzzleController.getDailyPuzzle);

// 嘗試解決益智
router.post("/spirits/:spiritId/puzzles/:puzzleId/attempt", puzzleController.attemptPuzzle);

// 獲取精靈升級狀態
router.get("/spirits/:spiritId/upgrades", puzzleController.getSpiritUpgrades);

// 獲取排行榜
router.get("/leaderboard", puzzleController.getLeaderboard);

// 創建測試關卡（管理員用）
router.post("/admin/test-puzzle", puzzleController.createTestPuzzle);

export default router;