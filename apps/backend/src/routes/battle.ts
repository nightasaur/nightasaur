// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Nightasaur Team

import { Router } from "express";
import { quizBattleController } from "../controllers/quizBattle.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();
router.use(authMiddleware);

// POST /api/battle/quiz/start/:spiritId - ?‹å??Šæ™º?ç?å°æˆ°
router.post("/quiz/start/:spiritId", (req, res, next) => quizBattleController.start(req, res, next));

// POST /api/battle/quiz/answer/:spiritId - ?žç??é?
router.post("/quiz/answer/:spiritId", (req, res, next) => quizBattleController.answer(req, res, next));

export default router;
