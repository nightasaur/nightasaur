import prisma from "../config/prisma.js";
import { gameService } from "./game.js";
import { getLLMProvider, type LLMMessage } from "./llm/index.js";
import { spiritDialogueService } from "./spirit/SpiritDialogueService.js";
import type { SupportedLanguage } from "./spirit/personality.js";
import { detectLanguage } from "./spirit/detectLanguage.js";
import { memoryService } from "./spirit/MemoryService.js";

const VALID_LANGUAGES: SupportedLanguage[] = ["zh-TW", "zh-CN", "en", "ja", "ko", "es"];

function normalizeLanguage(raw: string | null | undefined): SupportedLanguage {
  if (raw && (VALID_LANGUAGES as string[]).includes(raw)) {
    return raw as SupportedLanguage;
  }
  return "zh-TW";
}

// 對話系統後端 - 從 Python AI Engine 換成 Ollama 本地推理
export class DialogueService {
  async chat(spiritId: string, userId: string, message: string) {
    const spirit = await prisma.spirit.findFirst({
      where: { id: spiritId, userId, isActive: true },
    });
    if (!spirit) throw Object.assign(new Error("Spirit not found"), { statusCode: 404 });

    // 取使用者語言偏好（作為 fallback）
    const pref = await prisma.languagePreference.findUnique({ where: { userId } });
    const fallbackLanguage = normalizeLanguage(pref?.primaryLang);

    // 先偵測輸入訊息語言；偵測失敗才用偏好設定
    const detectedRaw = detectLanguage(message, fallbackLanguage);
    const language = (VALID_LANGUAGES as string[]).includes(detectedRaw)
      ? (detectedRaw as SupportedLanguage)
      : fallbackLanguage;

    // 英語優先模式：使用者偏好為英文，或偵測到英文
    const englishFirst =
      language === "en" ||
      (pref?.showEnglishHint === true && pref?.secondaryLang === "en");

    // 最近 10 輪對話作為短期記憶
    const recentHistory = await prisma.conversation.findMany({
      where: { spiritId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const history: Array<{ role: "user" | "assistant"; content: string }> = recentHistory
      .reverse()
      .flatMap((h) => [
        { role: "user" as const, content: h.userMessage },
        { role: "assistant" as const, content: h.aiResponse },
      ]);

    // 主要：Ollama 本地推理
    // 檢索相關記憶
    const memories = await memoryService.retrieve(spiritId, message, 5).catch(() => []);

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
      userId,
      message,
      history,
      language,
      englishFirst,
      memories,
    });

    const aiResponse = chatResult.reply;

    // 更新精靈情緒狀態
    if (spiritId) {
      try {
        await prisma.spirit.update({
          where: { id: spiritId },
          data: {
            currentEmotion: chatResult.emotion,
            displayIcon: chatResult.displayIcon,
            lastComfortAt: chatResult.intensity >= 6 ? new Date() : undefined,
          },
        });
      } catch (err) {
        console.warn("[Emotion] spirit update failed:", err instanceof Error ? err.message : err);
      }
    }

    await prisma.conversation.create({
      data: { spiritId, userMessage: message, aiResponse },
    });

    await prisma.spirit.update({
      where: { id: spiritId },
      data: { experience: { increment: 10 } },
    });

    await gameService.trackAction(userId, "CHAT", 1).catch(() => {});

    // 提取並儲存新記憶（非阻塞）
    memoryService
      .extract(message, aiResponse)
      .then((items) => memoryService.save(spiritId, userId, items))
      .catch((err) => console.warn("[Memory] save failed:", err instanceof Error ? err.message : err));

    return {
      message: aiResponse,
      spiritName: spirit.name,
      emotion: chatResult.emotion,
      intensity: chatResult.intensity,
      displayIcon: chatResult.displayIcon,
    };
  }

  // 生成精靈背景故事（改用 Ollama 本地推理）
  async generateBackstory(spiritId: string, userId: string) {
    const spirit = await prisma.spirit.findFirst({ where: { id: spiritId, userId } });
    if (!spirit) return;

    try {
      const provider = getLLMProvider();
      const messages: LLMMessage[] = [
        {
          role: "system",
          content:
            "You write short, warm backstories for spirit companions in a fantasy game. " +
            "Respond in Traditional Chinese with plain text only, no markdown.",
        },
        {
          role: "user",
          content: buildStoryPrompt(spirit.name, spirit.element, spirit.personality),
        },
      ];
      const story = await provider.chat(messages, { maxTokens: 500, temperature: 0.9 });
      const trimmed = story?.trim();
      if (trimmed) {
        await prisma.spirit.update({
          where: { id: spiritId },
          data: { backstory: trimmed },
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[Backstory] LLM unavailable: ${msg}`);
    }
  }
}

// 元素與階段的輔助函式

const ELEMENT_CN: Record<string, string> = {
  FIRE: "火焰",
  WATER: "水流",
  LIGHT: "光輝",
  SHADOW: "暗影",
  STAR: "星辰",
  ILLUSION: "幻象",
  MOON: "月光",
  NATURE: "自然",
  THUNDER: "雷電",
  ICE: "寒冰",
};


function getElementLabel(e: string): string {
  return ELEMENT_CN[e] || e;
}

function buildStoryPrompt(
  name: string,
  element: string,
  personality?: string | null
): string {
  return `你是 Nightasaur 世界的精靈傳記作者。請為名為「${name}」的${getElementLabel(
    element
  )}系精靈寫一段背景故事。性格：${personality || "溫柔"}。請用 100-200 字，繁體中文，純文字。`;
}

export const dialogueService = new DialogueService();
