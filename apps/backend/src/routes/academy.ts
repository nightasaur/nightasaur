// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Nightasaur Team

/**
 * 學院路由
 * 提供學習課程、分類題庫、學習進度等API
 */
import { Router } from "express";
import { academyController } from "../controllers/academy.js";
import { authMiddleware } from "../middleware/auth.ts";

const router = Router();

// 所有學院路由都需要認證
router.use(authMiddleware);

// 獲取學院課程列表
router.get("/courses", (req, res, next) => academyController.getCourses(req, res, next));

// 獲取學術分類列表
router.get("/categories", (req, res, next) => academyController.getCategories(req, res, next));

// 獲取分類題庫
router.get("/questions/category/:category", (req, res, next) => academyController.getCategoryQuestions(req, res, next));

// 開始學習課程
router.post("/courses/:courseId/start", (req, res, next) => academyController.startCourse(req, res, next));

// 回答學習問題
router.post("/sessions/:sessionId/answer", (req, res, next) => academyController.answerQuestion(req, res, next));

// 獲取學習進度
router.get("/progress", (req, res, next) => academyController.getProgress(req, res, next));

export default router;