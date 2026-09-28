import { Router } from "express";
import axios from "axios";

const router = Router();

const PIPER_ZH_URL = process.env.PIPER_URL || "http://host.docker.internal:5000";
const CF_CLIENT_ID = process.env.CF_ACCESS_CLIENT_ID || "";
const CF_CLIENT_SECRET = process.env.CF_ACCESS_CLIENT_SECRET || "";

const cache = new Map<string, { audio: Buffer; ts: number }>();
const CACHE_TTL = 30 * 60 * 1000;
const CACHE_MAX = 500;

function getCached(key: string): Buffer | null {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() - item.ts > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return item.audio;
}

function setCache(key: string, audio: Buffer) {
  if (cache.size >= CACHE_MAX) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
  cache.set(key, { audio, ts: Date.now() });
}

function detectLang(text: string): "zh" | "en" {
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const totalChars = text.replace(/\s/g, "").length;
  if (totalChars === 0) return "en";
  return chineseChars / totalChars > 0.2 ? "zh" : "en";
}

function buildHeaders(url: string): Record<string, string> {
  const headers: Record<string, string> = {};
  if (url.includes("nightasaur.com") && CF_CLIENT_ID && CF_CLIENT_SECRET) {
    headers["CF-Access-Client-Id"] = CF_CLIENT_ID;
    headers["CF-Access-Client-Secret"] = CF_CLIENT_SECRET;
  }
  return headers;
}

async function synthesizeZh(text: string): Promise<Buffer> {
  const headers = buildHeaders(PIPER_ZH_URL);
  const response = await axios.get(`${PIPER_ZH_URL}/`, {
    params: { text: text.slice(0, 200) },
    headers,
    responseType: "arraybuffer",
    timeout: 30000,
  });
  return Buffer.from(response.data);
}

router.post("/", async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "text is required" });
    }

    const trimmed = text.trim().slice(0, 200);
    const lang = detectLang(trimmed);

    // ============================================
    // 英文：告訴前端「用瀏覽器內建 TTS」
    // ============================================
    if (lang === "en") {
      return res.status(200).json({
        useBrowserTTS: true,
        lang: "en-US",
        text: trimmed,
      });
    }

    // ============================================
    // 中文：走 Piper
    // ============================================
    const cacheKey = `zh:${trimmed}`;

    const cached = getCached(cacheKey);
    if (cached) {
      res.set("Content-Type", "audio/wav");
      res.set("Cache-Control", "public, max-age=1800");
      res.set("X-Cache", "HIT");
      return res.send(cached);
    }

    const audio = await synthesizeZh(trimmed);
    setCache(cacheKey, audio);

    res.set("Content-Type", "audio/wav");
    res.set("Cache-Control", "public, max-age=1800");
    res.set("X-Cache", "MISS");
    res.send(audio);

  } catch (error: any) {
    console.error("Piper TTS error:", error.message);
    res.status(500).json({ error: "TTS failed: " + error.message });
  }
});

export default router;