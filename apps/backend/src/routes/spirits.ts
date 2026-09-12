import { Router } from "express";
import { spiritController } from "../controllers/spirits.js";
import { authMiddleware } from "../middleware/auth.ts";

const router = Router();

// 所有精靈路由都需要登入
router.use(authMiddleware);

// POST /api/spirits - 創建新精靈
router.post("/", (req, res, next) => spiritController.create(req, res, next));

// GET /api/spirits - 獲取用戶精靈列表
router.get("/", (req, res, next) => spiritController.list(req, res, next));

// GET /api/spirits/:id - 精靈詳細資訊
router.get("/:id", (req, res, next) => spiritController.getById(req, res, next));

// POST /api/spirits/:id/evolve - 精靈進化
router.post("/:id/evolve", (req, res, next) => spiritController.evolve(req, res, next));

// PATCH /api/spirits/:id/rename - 重新命名
router.patch("/:id/rename", (req, res, next) => spiritController.rename(req, res, next));

// DELETE /api/spirits/:id - 刪除精靈
router.delete("/:id", (req, res, next) => spiritController.delete(req, res, next));

// PATCH /api/spirits/:id - 更新外觀/裝扮
router.patch("/:id", (req, res, next) => spiritController.customize(req, res, next));

export default router;
