import { Router } from "express";
import { arLocationController } from "../controllers/arLocation.js";
import { adminMiddleware, authMiddleware } from "../middleware/auth.js";

const router = Router();

// All AR routes require authentication.
router.use(authMiddleware);

// Location data
router.post("/location", arLocationController.updatePlayerLocation);
router.get("/spawns/nearby", arLocationController.getNearbySpawns);
router.get("/hotspots/nearby", arLocationController.getNearbyHotspots);

// Exploration
router.post("/visit", arLocationController.visitLocation);
router.post("/capture", arLocationController.captureSpiritAR);
router.get("/route", arLocationController.getExplorationRoute);

// Statistics
router.get("/stats", arLocationController.getPlayerExplorationStats);

// Administrative operations
router.post("/admin/generate-spawns", adminMiddleware, arLocationController.generateNewSpawns);

export default router;
