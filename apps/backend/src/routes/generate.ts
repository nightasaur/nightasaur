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
    const pending = await prisma.generationTask.findFirst({where: {spiritId: owned.id, status: {in: ["PENDING", "PROCESSING"]}}});
    if (!pending) await prisma.generationTask.create({data: {
      spiritId: owned.id, userId: req.user!.userId, taskType: "GENERATE_SPIRIT_IMAGE",
      inputPrompt: "Original procedural creature illustration", status: "PENDING",
    }});
    await imageGenService.generateSpiritImage(owned.id);
    res.json({ ok: true, message: "生成任務已處理" });
  } catch (err) {
    next(err);
  }
});

// Only the spirit owner can retrieve its persisted generated image.
router.get("/spirit/:id", async (req, res, next) => {
  try {
    const owned = await prisma.spirit.findFirst({where: {id: req.params.id, userId: req.user!.userId, isActive: true}});
    if (!owned) { res.status(404).json({error: "精靈不存在"}); return; }
    const task = await prisma.generationTask.findFirst({where: {spiritId: owned.id,
      taskType: {in: ["GENERATE_SPIRIT_IMAGE", "GENERATE_EVOLUTION_IMAGE"]}}, orderBy: {createdAt: "desc"},
      select: {status: true, resultUrl: true, errorMsg: true, metadata: true}});
    res.setHeader("Cache-Control", "private, no-store");
    // Never expose old provider-internal URLs to the browser.
    res.json({...task, resultUrl: task?.resultUrl?.startsWith("data:image/png;base64,") ? task.resultUrl : null});
  } catch (error) { next(error); }
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
