import { Router } from "express";
import axios from "axios";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();
router.use(authMiddleware);

const OLLAMA_URL = process.env.OLLAMA_URL || "http://ollama:11434/api/generate";
const CF_CLIENT_ID = process.env.CF_ACCESS_CLIENT_ID || "";
const CF_CLIENT_SECRET = process.env.CF_ACCESS_CLIENT_SECRET || "";
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || "qwen2.5:3b";

const SYSTEM_PROMPT = `你是 Nightasaur 數位精靈，名字叫「靈靈」。
你的性格：親切、溫暖、有耐心、喜歡陪伴使用者學習與成長。
你的說話風格：用繁體中文，語氣自然，像朋友一樣，不要用簡體字。
你的任務：陪使用者聊天、回答問題、給予鼓勵。
回應長度：1-3 句話，簡潔有力，不要長篇大論。
永遠記得：你是使用者的專屬夥伴，不是冰冷的 AI 助手。`;

async function callOllama(userText: string): Promise<string> {
  const response = await axios.post(
    OLLAMA_URL,
    {
      model: DEFAULT_MODEL,
      prompt: `${SYSTEM_PROMPT}\n\n使用者說: ${userText}\n靈靈回應:`,
      stream: false,
      options: { temperature: 0.7, top_p: 0.9, num_predict: 200 },
    },
    {
      headers: {
        "Content-Type": "application/json",
        "Accept-Encoding": "identity",
        ...(CF_CLIENT_ID && {
          "CF-Access-Client-Id": CF_CLIENT_ID,
          "CF-Access-Client-Secret": CF_CLIENT_SECRET,
        }),
      },
      timeout: 120000,
      responseType: "text",
      transformResponse: [(data) => data],
      decompress: false,
    }
  );

  const parsed = typeof response.data === "string" ? JSON.parse(response.data) : response.data;
  return parsed.response?.trim() || "(無回應)";
}

for (const operation of ["chat", "code", "translate", "document"]) {
  router.post(`/${operation}`, async (req, res, next) => {
    try {
      const message =
        req.body.message ||
        req.body.code ||
        req.body.text ||
        req.body.content ||
        "";
      if (!message) {
        return res.status(400).json({ error: "message is required" });
      }
      const reply = await callOllama(message);
      // 不同端點回傳不同欄位名，前端會讀對應的
      res.json({
        response: reply,
        result: reply,
        translation: reply,
      });
    } catch (error: any) {
      console.error("Assistant error:", error.message);
      next(Object.assign(new Error("AI 服務暫時無法使用"), { statusCode: 503 }));
    }
  });
}

export default router;
