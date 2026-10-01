import { Router } from "express";
import axios from "axios";

const router = Router();

// ⚠️ 注意：絕對不要在 Railway 上使用 host.docker.internal，請確保 Railway 的 PIPER_URL 變數已正確設定
const PIPER_ZH_URL = process.env.PIPER_URL || "";
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
  // 只要 URL 裡面有 nightasaur.com 就帶上 CF Access Header
  if (url.includes("nightasaur.com") && CF_CLIENT_ID && CF_CLIENT_SECRET) {
    headers["CF-Access-Client-Id"] = CF_CLIENT_ID;
    headers["CF-Access-Client-Secret"] = CF_CLIENT_SECRET;
  }
  return headers;
}

async function synthesizeZh(text: string): Promise<Buffer> {
  if (!PIPER_ZH_URL) {
    throw new Error("PIPER_URL 未設定");
  }
  
  const headers = buildHeaders(PIPER_ZH_URL);
  console.log(`[TTS] 正在呼叫 Piper (POST): ${PIPER_ZH_URL}/synthesize, 文字: ${text.slice(0, 10)}...`);
  
  try {
    // 👇 改用 POST 请求，中文通过 JSON Body 传输，完美避开 URL 编码问题
    const response = await axios.post(
      `${PIPER_ZH_URL}/synthesize`, 
      { text: text.slice(0, 200) },
      {
        headers: { ...headers, "Content-Type": "application/json" },
        responseType: "arraybuffer",
        timeout: 30000,
      }
    );
    return Buffer.from(response.data);
  } catch (error: any) {
    // 把更詳細的錯誤拋出來，方便在 Railway Logs 看到
    const status = error.response?.status || "無回應";
    const msg = error.response?.data ? JSON.stringify(error.response.data).slice(0, 100) : error.message;
    throw new Error(`Piper 連線失敗 (HTTP ${status}): ${msg}`);
  }
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

    try {
      const audio = await synthesizeZh(trimmed);
      setCache(cacheKey, audio);

      res.set("Content-Type", "audio/wav");
      res.set("Cache-Control", "public, max-age=1800");
      res.set("X-Cache", "MISS");
      res.send(audio);
    } catch (piperError: any) {
      // 如果 Piper 掛了，優雅降級，告訴前端用瀏覽器唸中文
      console.warn(`[TTS] Piper 失敗，降級使用瀏覽器 TTS: ${piperError.message}`);
      return res.status(200).json({
        useBrowserTTS: true,
        lang: "zh-TW",
        text: trimmed,
      });
    }

  } catch (error: any) {
    console.error("TTS 路由發生非預期錯誤:", error.message);
    res.status(500).json({ error: "TTS 處理失敗: " + error.message });
  }
});

export default router;