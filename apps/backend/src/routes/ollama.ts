import { Router } from "express";
import axios from "axios";

const router = Router();

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

router.post("/", async (req, res) => {
  try {
    const { prompt, model } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, error: "prompt is required" });
    }

    const fullPrompt = `${SYSTEM_PROMPT}\n\n使用者說: ${prompt}\n靈靈回應:`;

    const response = await axios.post(
      OLLAMA_URL,
      {
        model: model || DEFAULT_MODEL,
        prompt: fullPrompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          num_predict: 200,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          ...(CF_CLIENT_ID && {
            "CF-Access-Client-Id": CF_CLIENT_ID,
            "CF-Access-Client-Secret": CF_CLIENT_SECRET,
          }),
        },
        timeout: 120000,
      }
    );

    res.json({
      success: true,
      response: response.data.response?.trim() || "(無回應)",
      model: response.data.model,
    });
  } catch (error) {
    console.error("Ollama proxy error:", error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
