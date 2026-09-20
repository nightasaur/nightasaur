import { Router } from "express";
import { SquadController } from "../controllers/squad.js";
import { authMiddleware } from "../middleware/auth.js";

const squadController = new SquadController();
const router = Router();

// 所有路由都需要登入。
router.use(authMiddleware);

// 小隊管理
router.post("/", squadController.createSquad);
router.get("/", squadController.getSquad);

// 小隊成員管理
router.post("/members", squadController.addSpiritToSquad);
router.delete("/members/:spiritId", squadController.removeSpiritFromSquad);

// 主精靈切換
router.post("/switch-active", squadController.switchActiveSpirit);

// 獎勵型訓練與挑戰端點暫不公開。重新啟用前必須由伺服器驗證事件、
// 冷卻時間與一次性獎勵，不能信任客戶端提交的時長或答案。

// 小隊快速操作
router.post("/auto-create", squadController.autoCreateSquad);
router.post("/quick-switch", squadController.quickSquadSwitch);

// 完整遊戲狀態
router.get("/full-state", squadController.getFullGameState);

export default router;
