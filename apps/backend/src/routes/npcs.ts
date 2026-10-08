import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { NPCS, NPC_BY_KEY } from "../data/npcs.js";
import { ensureSpawns, encounterSpawn, findNpcSpiritByKey } from "../services/npc.js";
import { spiritDialogueService } from "../services/spirit/SpiritDialogueService.js";

const router = Router();
router.use(authMiddleware);

/** GET /api/npcs — 回傳 9 隻 NPC 的靜態資料（給圖鑑用） */
router.get("/", (_req, res) => {
  res.json(NPCS);
});

/** GET /api/npcs/nearby?lat=X&lng=Y — 拉玩家附近的龍（自動補 spawn） */
router.get("/nearby", async (req, res, next) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      res.status(400).json({ error: "lat and lng required" });
      return;
    }
    const spawns = await ensureSpawns(req.user!.userId, lat, lng);
    const enriched = spawns.map((s) => {
      const meta = NPC_BY_KEY.get(s.npcKey);
      return { ...s, meta };
    });
    res.json(enriched);
  } catch (err) {
    next(err);
  }
});

/** POST /api/npcs/spawns/:id/encounter — 上報遭遇，該龍重生到 10km 外 */
router.post("/spawns/:id/encounter", async (req, res, next) => {
  try {
    const updated = await encounterSpawn(req.user!.userId, req.params.id);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

/** POST /api/npcs/:npcKey/dialogue — 對 NPC 對話（不寫 Conversation、不改 NPC exp） */
router.post("/:npcKey/dialogue", async (req, res, next) => {
  try {
    const { message } = req.body || {};
    if (typeof message !== "string" || !message.trim()) {
      res.status(400).json({ error: "message required" });
      return;
    }
    const meta = NPC_BY_KEY.get(req.params.npcKey);
    if (!meta) {
      res.status(404).json({ error: "NPC not found" });
      return;
    }

    const spirit = await findNpcSpiritByKey(req.params.npcKey);
    if (!spirit) {
      res.status(503).json({ error: "NPC not seeded" });
      return;
    }

    const chatResult = await spiritDialogueService.chatWithEmotion({
      spirit: {
        id: spirit.id,
        name: spirit.name,
        element: spirit.element,
        stage: spirit.stage,
        level: spirit.level,
        personality: spirit.personality,
        backstory: spirit.backstory,
        currentEmotion: spirit.currentEmotion,
      },
      userId: req.user!.userId,
      message,
      history: [],
      language: "zh-TW",
      englishFirst: false,
      memories: [],
    });

    res.json({
      message: chatResult.reply,
      emotion: chatResult.emotion,
      intensity: chatResult.intensity,
      displayIcon: chatResult.displayIcon,
      npcKey: meta.key,
      npcName: meta.name,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
