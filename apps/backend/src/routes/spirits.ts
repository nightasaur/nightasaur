import { Router } from "express";
import { spiritController } from "../controllers/spirits.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

// ?€?‰ç²¾?ˆè·¯?±éƒ½?€è¦ç™»??
router.use(authMiddleware);

// POST /api/spirits - ?µå»º?°ç²¾??
router.post("/", (req, res, next) => spiritController.create(req, res, next));

// GET /api/spirits - ?²å??¨æˆ¶ç²¾é??—è¡¨
router.get("/", (req, res, next) => spiritController.list(req, res, next));

// GET /api/spirits/:id - ç²¾é?è©³ç´°è³‡è?
router.get("/:id", (req, res, next) => spiritController.getById(req, res, next));

// POST /api/spirits/:id/evolve - ç²¾é??²å?
router.post("/:id/evolve", (req, res, next) => spiritController.evolve(req, res, next));

// PATCH /api/spirits/:id/rename - ?æ–°?½å?
router.patch("/:id/rename", (req, res, next) => spiritController.rename(req, res, next));

// DELETE /api/spirits/:id - ?ªé™¤ç²¾é?
router.delete("/:id", (req, res, next) => spiritController.delete(req, res, next));

// PATCH /api/spirits/:id - ?´æ–°å¤–è?/è£æ‰®
router.patch("/:id", (req, res, next) => spiritController.customize(req, res, next));

export default router;
