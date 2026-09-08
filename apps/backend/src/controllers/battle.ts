// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Nightasaur Team

import { Request, Response, NextFunction } from "express";
import { battleService } from "../services/battle.js";

export class BattleController {
  async encounter(req: Request, res: Response, next: NextFunction) {
    try {
      const { spiritId } = req.params;
      const result = await battleService.encounterWild(spiritId);
      res.json(result);
    } catch (err) { next(err); }
  }

  async action(req: Request, res: Response, next: NextFunction) {
    try {
      const { player, enemy, action } = req.body;
      const result = await battleService.executeBattle(player, enemy, action);
      res.json(result);
    } catch (err) { next(err); }
  }
}

export const battleController = new BattleController();