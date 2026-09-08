// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Nightasaur Team

import { Router } from "express";
import { battleController } from "../controllers/battle.js";
import { authMiddleware } from "../middleware/auth.ts";

const router = Router();
router.use(authMiddleware);

// GET /api/battle/encounter/:spiritId - 遭遇野生精靈
router.get("/encounter/:spiritId", (req, res, next) => battleController.encounter(req, res, next));

// POST /api/battle/action - 執行戰鬥回合
router.post("/action", (req, res, next) => battleController.action(req, res, next));

export default router;