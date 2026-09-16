import { Router } from "express";
import { namingController } from "../controllers/namingController.js";
import { hatchingController } from "../controllers/hatchingController.js";
import { spiritController } from "../controllers/spirits.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

// 命名系統路由
router.get("/naming/suggestions", authMiddleware, namingController.getSuggestions.bind(namingController));
router.post("/naming/validate", authMiddleware, namingController.validateName.bind(namingController));
router.post("/naming/ai-suggestions", authMiddleware, namingController.getAISuggestions.bind(namingController));
router.get("/naming/history", authMiddleware, namingController.getHistory.bind(namingController));
router.post("/naming/save", authMiddleware, namingController.saveName.bind(namingController));

// 孵化系統路由
router.post("/hatching/start", authMiddleware, hatchingController.startHatching.bind(hatchingController));
router.post("/hatching/interact", authMiddleware, hatchingController.interact.bind(hatchingController));
router.get("/hatching/status/:spiritId", authMiddleware, hatchingController.getStatus.bind(hatchingController));
router.get("/hatching/history", authMiddleware, hatchingController.getHistory.bind(hatchingController));
router.post("/hatching/batch-interact", authMiddleware, hatchingController.batchInteract.bind(hatchingController));
router.post("/hatching/accelerate", authMiddleware, hatchingController.accelerate.bind(hatchingController));

// 精靈系統路由（現有功能保持兼容）
router.post("/spirits", authMiddleware, spiritController.create.bind(spiritController));
router.get("/spirits", authMiddleware, spiritController.list.bind(spiritController));
router.get("/spirits/:id", authMiddleware, spiritController.getById.bind(spiritController));
router.post("/spirits/:id/evolve", authMiddleware, spiritController.evolve.bind(spiritController));
router.post("/spirits/:id/rename", authMiddleware, spiritController.rename.bind(spiritController));
router.post("/spirits/:id/customize", authMiddleware, spiritController.customize.bind(spiritController));

export default router;
