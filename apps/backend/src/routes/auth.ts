import { resetAdministratorPassword } from "../services/adminPasswordReset.js";
import prisma from "../config/prisma.js";
import { z } from "zod";
import { Router } from "express";
import { authController } from "../controllers/auth.js";
import { authMiddleware } from "../middleware/auth.js";
import { makeAuthRateLimit } from "../middleware/authRateLimit.js";

const router = Router();
const limitAttempts = makeAuthRateLimit();

// Recovery is limited to the exact owner-authorized administrator. No account creation.
router.post("/admin-password-reset", limitAttempts, async (req,res,next) => {
  try {
    const body=z.object({code:z.string().min(1).max(128),password:z.string().min(1).max(128)}).parse(req.body);
    await resetAdministratorPassword(prisma,body.code,body.password);
    res.setHeader("Cache-Control","no-store");
    res.json({ok:true,message:"密碼已更新，舊登入狀態已撤銷，請重新登入。"});
  } catch(error) {next(error);}
});

// POST /api/auth/register
router.post("/register", limitAttempts, (req, res, next) => authController.register(req, res, next));

// POST /api/auth/login
router.post("/login", limitAttempts, (req, res, next) => authController.login(req, res, next));

// POST /api/auth/logout
router.post("/logout", authMiddleware, (req, res, next) => authController.logout(req, res, next));

// GET /api/auth/me
router.get("/me", authMiddleware, (req, res, next) => authController.me(req, res, next));

export default router;
