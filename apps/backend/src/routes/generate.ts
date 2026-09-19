import { Router } from "express";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";
import prisma from "../config/prisma.js";
import { imageGenService } from "../services/imagegen.js";

const router = Router();
router.use(authMiddleware);

// POST /api/generate/spirit/:id - 觸發精靈圖像生成
router.post("/spirit/:id", async (req, res, next) => {
  try {
    const owned = await prisma.spirit.findFirst({ where: {
      id: req.params.id, userId: req.user!.userId, isActive: true,
    } });
    if (!owned) { res.status(404).json({ error: "精靈不存在" }); return; }
    await imageGenService.generateSpiritImage(req.params.id);
    res.json({ ok: true, message: "生成任務已觸發" });
  } catch (err) {
    next(err);
  }
});

// POST /api/generate/process - 觸發批次生成
router.post("/process", adminMiddleware, async (_req, res, next) => {
  try {
    const result = await imageGenService.processPendingTasks();
    res.json({ ok: true, ...result });
  } catch (err) {
    next(err);
  }
});

// GET /api/generate/status - AI Engine 狀態
router.get("/status", async (_req, res) => {
  try {
    const axios = (await import("axios")).default;
    const { config } = await import("../config/index.js");
    const r = await axios.get(`${config.ai.engineUrl}/api/health`, { timeout: 5000 });
    res.json(r.data);
  } catch {
    res.json({ status: "offline", message: "AI Engine 離線" });
  }
});

export default router;
