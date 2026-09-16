import { Router } from "express";
import { puzzleController } from "../controllers/puzzle.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

// ?€?‰è·¯?±éƒ½?€è¦è?è­?
router.use(authMiddleware);

// ?²å??¯ç”¨?„ç??ºé???
router.get("/spirits/:spiritId/puzzles", puzzleController.getAvailablePuzzles);

// ?²å?æ¯æ—¥?Šæ™º
router.get("/daily", puzzleController.getDailyPuzzle);

// ?—è©¦è§?±º?Šæ™º
router.post("/spirits/:spiritId/puzzles/:puzzleId/attempt", puzzleController.attemptPuzzle);

// ?²å?ç²¾é??‡ç??€??
router.get("/spirits/:spiritId/upgrades", puzzleController.getSpiritUpgrades);

// ?²å??’è?æ¦?
router.get("/leaderboard", puzzleController.getLeaderboard);

// ?µå»ºæ¸¬è©¦?œå¡ï¼ˆç®¡?†å“¡?¨ï?
router.post("/admin/test-puzzle", puzzleController.createTestPuzzle);

export default router;
