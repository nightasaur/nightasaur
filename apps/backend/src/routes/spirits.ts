import { Router } from "express";
import { spiritController } from "../controllers/spirits.js";
import { authMiddleware } from "../middleware/auth.ts";

const router = Router();

// ?€?‰ç²¾?ˆè·¯?±éƒ½?€è¦ç™»??
router.use(authMiddleware);

// POST /api/spirits - å»ºç??°ç²¾??
router.post("/", (req, res, next) => spiritController.create(req, res, next));

// GET /api/spirits - ?–å??‘ç?ç²¾é??—è¡¨
router.get("/", (req, res, next) => spiritController.list(req, res, next));

// GET /api/spirits/:id - ç²¾é?è©³æ?
router.get("/:id", (req, res, next) => spiritController.getById(req, res, next));

// POST /api/spirits/:id/evolve - ç²¾é??²å?
router.post("/:id/evolve", (req, res, next) => spiritController.evolve(req, res, next));

// PATCH /api/spirits/:id/rename - ?æ–°?½å?
router.patch("/:id/rename", (req, res, next) => spiritController.rename(req, res, next));

// PATCH /api/spirits/:id - ?ªè?å¤–è?/è£æ‰®
router.patch("/:id", (req, res, next) => spiritController.customize(req, res, next));

export default router;
