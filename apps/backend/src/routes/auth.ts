import { Router } from "express";
import { authController } from "../controllers/auth.js";
import { authMiddleware } from "../middleware/auth.js";

import { makeAuthRateLimit } from "../middleware/authRateLimit.js";

const router = Router();
const limitAttempts = makeAuthRateLimit();

// POST /api/auth/register
router.post("/register", limitAttempts, (req, res, next) => authController.register(req, res, next));

// POST /api/auth/login
router.post("/login", limitAttempts, (req, res, next) => authController.login(req, res, next));

// POST /api/auth/logout
router.post("/logout", authMiddleware, (req, res, next) => authController.logout(req, res, next));

// GET /api/auth/me
router.get("/me", authMiddleware, (req, res, next) => authController.me(req, res, next));

export default router;
