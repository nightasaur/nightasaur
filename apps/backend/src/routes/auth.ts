import { Router } from "express";
import { authController } from "../controllers/auth.js";
import { authMiddleware } from "../middleware/auth.ts";

const router = Router();

// POST /api/auth/register
router.post("/register", (req, res, next) => authController.register(req, res, next));

// POST /api/auth/login
router.post("/login", (req, res, next) => authController.login(req, res, next));

// POST /api/auth/logout
router.post("/logout", authMiddleware, (req, res, next) => authController.logout(req, res, next));

// GET /api/auth/me
router.get("/me", authMiddleware, (req, res, next) => authController.me(req, res, next));

export default router;
