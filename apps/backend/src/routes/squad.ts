import { Router } from "express";
import { SquadController } from "../controllers/squad.js";
import { authMiddleware } from "../middleware/auth.ts";

const squadController = new SquadController();
const router = Router();

// 所有路由都需要認證
router.use(authMiddleware);

// 小隊管理
router.post("/", squadController.createSquad);
router.get("/", squadController.getSquad);

// 小隊成員管理
router.post("/members", squadController.addSpiritToSquad);
router.delete("/members/:spiritId", squadController.removeSpiritFromSquad);

// 小隊操作
router.post("/switch-active", squadController.switchActiveSpirit);
router.post("/train", squadController.trainSquadSpirit);

// 小隊協同活動
router.post("/challenge/puzzle", squadController.squadPuzzleChallenge);
router.post("/training/daily", squadController.squadDailyTraining);

// 小隊自動化
router.post("/auto-create", squadController.autoCreateSquad);
router.post("/quick-switch", squadController.quickSquadSwitch);

// 完整遊戲狀態
router.get("/full-state", squadController.getFullGameState);

export default router;