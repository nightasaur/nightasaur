// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Nightasaur Team

/** 學院課程、分類題庫與學習進度 API。 */
import { Router } from "express";
import { academyController } from "../controllers/academy.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

// 所有學院路由都需要登入。
router.use(authMiddleware);

// 學院課程列表
router.get("/courses", (req, res, next) => academyController.getCourses(req, res, next));

// 學習分類列表
router.get("/categories", (req, res, next) => academyController.getCategories(req, res, next));

// 分類題庫
router.get("/questions/category/:category", (req, res, next) => academyController.getCategoryQuestions(req, res, next));

// IELTS Learning Profile（學習檔案）：只回傳已完成診斷的客觀證據。
router.get("/ielts/profile", (req, res, next) => academyController.getIeltsLearningProfile(req, res, next));

// IELTS Reading Diagnostic（閱讀診斷）：作答前不向前台下發正解。
router.post("/ielts/diagnostic/start", (req, res, next) => academyController.startIeltsReadingDiagnostic(req, res, next));
router.post("/ielts/diagnostic/:sessionId/answer", (req, res, next) => academyController.answerIeltsReadingDiagnostic(req, res, next));

// 開始學習課程
router.post("/courses/:courseId/start", (req, res, next) => academyController.startCourse(req, res, next));

// 提交學習答案
router.post("/sessions/:sessionId/answer", (req, res, next) => academyController.answerQuestion(req, res, next));

// 學習進度
router.get("/progress", (req, res, next) => academyController.getProgress(req, res, next));

export default router;
