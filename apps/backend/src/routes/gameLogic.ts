import { Router } from "express";
import { gameLogicController } from "../controllers/gameLogic.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

// ?€?‰è·¯?±éƒ½?€è¦è?è­?
router.use(authMiddleware);

// ?·è??Šæˆ²å¾ªç’°
router.post("/cycle", gameLogicController.executeGameCycle);

// ?²å??Šæˆ²æ¦‚è¦½
router.get("/overview", gameLogicController.getGameOverview);

// å¿«é€Ÿé?å§‹é???
router.post("/quick-start", gameLogicController.quickStart);

export default router;
