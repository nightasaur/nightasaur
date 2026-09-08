// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Nightasaur Team

import { Router } from "express";
import { quizBattleController } from "../controllers/quizBattle.js";
import { authMiddleware } from "../middleware/auth.ts";

const router = Router();
router.use(authMiddleware);

// POST /api/battle/quiz/start/:spiritId - 開始益智問答對戰
router.post("/quiz/start/:spiritId", (req, res, next) => quizBattleController.start(req, res, next));

// POST /api/battle/quiz/answer/:spiritId - 回答問題
router.post("/quiz/answer/:spiritId", (req, res, next) => quizBattleController.answer(req, res, next));

export default router;