import { Router } from "express";
import { SquadController } from "../controllers/squad.js";
import { authMiddleware } from "../middleware/auth.js";

const squadController = new SquadController();
const router = Router();

// ?€?‰è·¯?±éƒ½?€è¦è?è­?
router.use(authMiddleware);

// å°é?ç®¡ç?
router.post("/", squadController.createSquad);
router.get("/", squadController.getSquad);

// å°é??å“¡ç®¡ç?
router.post("/members", squadController.addSpiritToSquad);
router.delete("/members/:spiritId", squadController.removeSpiritFromSquad);

// å°é??ä?
router.post("/switch-active", squadController.switchActiveSpirit);
router.post("/train", squadController.trainSquadSpirit);

// å°é??”å?æ´»å?
router.post("/challenge/puzzle", squadController.squadPuzzleChallenge);
router.post("/training/daily", squadController.squadDailyTraining);

// å°é??ªå???
router.post("/auto-create", squadController.autoCreateSquad);
router.post("/quick-switch", squadController.quickSquadSwitch);

// å®Œæ•´?Šæˆ²?€??
router.get("/full-state", squadController.getFullGameState);

export default router;
