import { Router } from "express";
import { namingController } from "../controllers/namingController.js";
import { hatchingController } from "../controllers/hatchingController.js";
import { spiritController } from "../controllers/spirits.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

// 命名系統路由
router.get("/naming/suggestions", authenticate, namingController.getSuggestions.bind(namingController));
router.post("/naming/validate", authenticate, namingController.validateName.bind(namingController));
router.post("/naming/ai-suggestions", authenticate, namingController.getAISuggestions.bind(namingController));
router.get("/naming/history", authenticate, namingController.getHistory.bind(namingController));
router.post("/naming/save", authenticate, namingController.saveName.bind(namingController));

// 孵化系統路由
router.post("/hatching/start", authenticate, hatchingController.startHatching.bind(hatchingController));
router.post("/hatching/interact", authenticate, hatchingController.interact.bind(hatchingController));
router.get("/hatching/status/:spiritId", authenticate, hatchingController.getStatus.bind(hatchingController));
router.get("/hatching/history", authenticate, hatchingController.getHistory.bind(hatchingController));
router.post("/hatching/batch-interact", authenticate, hatchingController.batchInteract.bind(hatchingController));
router.post("/hatching/accelerate", authenticate, hatchingController.accelerate.bind(hatchingController));

// 精靈系統路由（現有，保持兼容）
router.post("/spirits", authenticate, spiritController.create.bind(spiritController));
router.get("/spirits", authenticate, spiritController.list.bind(spiritController));
router.get("/spirits/:id", authenticate, spiritController.getById.bind(spiritController));
router.post("/spirits/:id/evolve", authenticate, spiritController.evolve.bind(spiritController));
router.post("/spirits/:id/rename", authenticate, spiritController.rename.bind(spiritController));
router.post("/spirits/:id/customize", authenticate, spiritController.customize.bind(spiritController));

export default router;