import { Router } from "express";
import axios from "axios";

const router = Router();

const PIPER_ZH_URL = process.env.PIPER_URL || "http://host.docker.internal:5000";
const PIPER_EN_URL = process.env.PIPER_EN_URL || "http://host.docker.internal:5001";
const CF_CLIENT_ID = process.env.CF_ACCESS_CLIENT_ID || "";
const CF_CLIENT_SECRET = process.env.CF_ACCESS_CLIENT_SECRET || "";

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

async function synthesize(text: string, lang: "zh" | "en"): Promise<Buffer> {
  const url = lang === "zh" ? PIPER_ZH_URL : PIPER_EN_URL;
  const headers = buildHeaders(url);

  const response = await axios.get(`${url}/`, {
    params: { text: text.slice(0, 500) },
    headers,
    responseType: "arraybuffer",
    timeout: 30000,
  });

  return Buffer.from(response.data);
}

router.post("/", async (req, res, next) => {
  try {
    const { text, lang: forcedLang } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "text is required" });
    }

    const lang = forcedLang === "en" ? "en" : forcedLang === "zh" ? "zh" : detectLang(text);

    let audio: Buffer;
    try {
      audio = await synthesize(text, lang);
    } catch (err: any) {
      console.warn(`[TTS] ${lang} Piper failed, trying fallback:`, err.message);
      const fallbackLang = lang === "zh" ? "en" : "zh";
      audio = await synthesize(text, fallbackLang);
    }

    res.set("Content-Type", "audio/wav");
    res.set("Cache-Control", "no-cache");
    res.send(audio);

  } catch (error: any) {
    console.error("Piper TTS error:", error.message);
    res.status(500).json({ error: "TTS failed: " + error.message });
  }
});

export default router;