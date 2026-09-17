// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Nightasaur Team

/**
 * å­¸é™¢è·¯ç”±
 * ?ä?å­¸ç?èª²ç??å?é¡žé?åº«ã€å­¸ç¿’é€²åº¦ç­‰API
 */
import { Router } from "express";
import { academyController } from "../controllers/academy.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

// ?€?‰å­¸?¢è·¯?±éƒ½?€è¦è?è­?
router.use(authMiddleware);

// ?²å?å­¸é™¢èª²ç??—è¡¨
router.get("/courses", (req, res, next) => academyController.getCourses(req, res, next));

// ?²å?å­¸è??†é??—è¡¨
router.get("/categories", (req, res, next) => academyController.getCategories(req, res, next));

// ?²å??†é?é¡Œåº«
router.get("/questions/category/:category", (req, res, next) => academyController.getCategoryQuestions(req, res, next));

// ?‹å?å­¸ç?èª²ç?
router.post("/courses/:courseId/start", (req, res, next) => academyController.startCourse(req, res, next));

// ?žç?å­¸ç??é?
router.post("/sessions/:sessionId/answer", (req, res, next) => academyController.answerQuestion(req, res, next));

// ?²å?å­¸ç??²åº¦
router.get("/progress", (req, res, next) => academyController.getProgress(req, res, next));

export default router;
