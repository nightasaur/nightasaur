import { Router } from "express";
import { spiritController } from "../controllers/spirits.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

// ?�?�精?�路?�都?�要登??
router.use(authMiddleware);

// POST /api/spirits - ?�建?�精??
router.post("/", (req, res, next) => spiritController.create(req, res, next));

// GET /api/spirits - ?��??�戶精�??�表
router.get("/", (req, res, next) => spiritController.list(req, res, next));

// GET /api/spirits/:id - 精�?詳細資�?
router.get("/:id", (req, res, next) => spiritController.getById(req, res, next));

// POST /api/spirits/:id/evolve - 精�??��?
router.post("/:id/evolve", (req, res, next) => spiritController.evolve(req, res, next));

// PATCH /api/spirits/:id/rename - ?�新?��?
router.patch("/:id/rename", (req, res, next) => spiritController.rename(req, res, next));

// DELETE /api/spirits/:id - ?�除精�?
router.delete("/:id", (req, res, next) => spiritController.delete(req, res, next));

// PATCH /api/spirits/:id - ?�新外�?/裝扮
router.patch("/:id", (req, res, next) => spiritController.customize(req, res, next));


// GET /api/spirits/:id/memories - list spirit memories (owner only)
router.get("/:id/memories", (req, res, next) => spiritController.listMemories(req, res, next));

// DELETE /api/spirits/:id/memories/:memoryId - delete one memory (owner only)
router.delete("/:id/memories/:memoryId", (req, res, next) => spiritController.deleteMemory(req, res, next));
export default router;
