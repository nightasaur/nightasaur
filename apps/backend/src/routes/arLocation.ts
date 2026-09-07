import { Router } from "express";
import { arLocationController } from "../controllers/arLocation.js";
import { authMiddleware } from "../middleware/auth.ts";

const router = Router();

// 所有路由都需要認證
router.use(authMiddleware);

// 位置相關
router.post("/location", arLocationController.updatePlayerLocation);
router.get("/spawns/nearby", arLocationController.getNearbySpawns);
router.get("/hotspots/nearby", arLocationController.getNearbyHotspots);

// 探索相關
router.post("/visit", arLocationController.visitLocation);
router.post("/capture", arLocationController.captureSpiritAR);
router.get("/route", arLocationController.getExplorationRoute);

// 統計相關
router.get("/stats", arLocationController.getPlayerExplorationStats);

// 管理員功能
router.post("/admin/generate-spawns", arLocationController.generateNewSpawns);

export default router;