import { Router } from "express";
import { EnglishTrainingController } from "../controllers/englishTraining.js";
import { authMiddleware } from "../middleware/auth.js";

const englishTrainingController = new EnglishTrainingController();
const router = Router();

// 所有英語訓練路由都需要登入
router.use(authMiddleware);

// 主題相關路由
router.get("/topics", (req, res, next) => englishTrainingController.getTopics(req, res, next));
router.get("/topics/:id", (req, res, next) => englishTrainingController.getTopicById(req, res, next));

// 對話相關路由
router.post("/conversation/start", (req, res, next) => englishTrainingController.startConversation(req, res, next));
router.post("/conversation/chat", (req, res, next) => englishTrainingController.chat(req, res, next));

// 對話歷史
router.get("/history", (req, res, next) => englishTrainingController.getConversationHistory(req, res, next));

export default router;