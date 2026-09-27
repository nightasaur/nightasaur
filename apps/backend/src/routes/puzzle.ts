import { Router } from "express";
import { puzzleController } from "../controllers/puzzle.js";
import { adminMiddleware, authMiddleware } from "../middleware/auth.js";

const router = Router();

// All puzzle routes require authentication.
router.use(authMiddleware);

// Available puzzles for an owned spirit
router.get("/spirits/:spiritId/puzzles", puzzleController.getAvailablePuzzles);

// Daily puzzle
router.get("/daily", puzzleController.getDailyPuzzle);

// Puzzle attempt
router.post("/spirits/:spiritId/puzzles/:puzzleId/attempt", puzzleController.attemptPuzzle);

// Owned spirit upgrades
router.get("/spirits/:spiritId/upgrades", puzzleController.getSpiritUpgrades);

// Leaderboard
router.get("/leaderboard", puzzleController.getLeaderboard);

// Administrative test fixture creation
router.post("/admin/test-puzzle", adminMiddleware, puzzleController.createTestPuzzle);

export default router;
