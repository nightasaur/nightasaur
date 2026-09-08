// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Nightasaur Team

import { Request, Response, NextFunction } from "express";
import { quizBattleService } from "../services/quizBattle.js";

export class QuizBattleController {
  async start(req: Request, res: Response, next: NextFunction) {
    try {
      const { spiritId } = req.params;
      const result = await quizBattleService.startBattle(spiritId);
      res.json(result);
    } catch (err) { next(err); }
  }

  async answer(req: Request, res: Response, next: NextFunction) {
    try {
      const { spiritId } = req.params;
      const { answerIndex } = req.body;
      const result = await quizBattleService.answerQuestion(spiritId, answerIndex);
      res.json(result);
    } catch (err) { next(err); }
  }
}

export const quizBattleController = new QuizBattleController();