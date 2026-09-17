import { Router } from "express";
import { arLocationController } from "../controllers/arLocation.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

// ?Ä?âË∑Ø?±ÈÉΩ?ÄË¶ÅË?Ë≠?
router.use(authMiddleware);

// ‰ΩçÁΩÆ?∏È?
router.post("/location", arLocationController.updatePlayerLocation);
router.get("/spawns/nearby", arLocationController.getNearbySpawns);
router.get("/hotspots/nearby", arLocationController.getNearbyHotspots);

// ?¢Á¥¢?∏È?
router.post("/visit", arLocationController.visitLocation);
router.post("/capture", arLocationController.captureSpiritAR);
router.get("/route", arLocationController.getExplorationRoute);

// Áµ±Ë??∏È?
router.get("/stats", arLocationController.getPlayerExplorationStats);

// ÁÆ°Á??°Â???
router.post("/admin/generate-spawns", arLocationController.generateNewSpawns);

export default router;
