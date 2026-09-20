import axios from "axios";
import { aiRequestOptions } from "./aiClient.js";
import prisma from "../config/prisma.js";
import { config } from "../config/index.js";
import { gameService } from "./game.js";

// 對話系統服務 - Phase 2 可實串接
// 提供精靈對話和故事生成功能
export class DialogueService {
  async chat(spiritId: string, userId: string, message: string) {
    const spirit = await prisma.spirit.findFirst({
      where: { id: spiritId, userId, isActive: true },
    });
    if (!spirit) throw Object.assign(new Error("精靈不存在"), { statusCode: 404 });

    const recentHistory = await prisma.conversation.findMany({
      where: { spiritId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Obtain a real response before persisting a successful conversation.
    const aiResponse = await this.callAIEngine(spirit, message, recentHistory);
    await prisma.conversation.create({
      data: { spiritId, userMessage: message, aiResponse },
    });

    // 增加 EXP
    await prisma.spirit.update({
      where: { id: spiritId },
      data: { experience: { increment: 10 } },
    });

    // 遊戲系統追蹤對話
    await gameService.trackAction(userId, "CHAT", 1).catch(() => {});

    return { message: aiResponse, spiritName: spirit.name };
  }

  // 核心功能：呼叫 Python AI Engine 服務
  private async callAIEngine(spirit: any, message: string, history: any[]): Promise<string> {
    try {
      const res = await axios.post(
        `${config.ai.engineUrl}/api/dialogue/chat`,
        {
          spirit_info: {
            name: spirit.name,
            element: spirit.element,
            personality: spirit.personality || "活潑開朗",
            stage: getStageLabel(spirit.stage),
            backstory: spirit.backstory || "",
          },
          message,
          history: history.map((h) => ({
            role: "user",
            content: h.userMessage,
          })).concat(
            history.map((h) => ({
              role: "assistant",
              content: h.aiResponse,
            }))
          ).slice(-16), // 保留最近16條
        },
        // CPU-backed production inference can legitimately take longer than 30s.
        // The AI service already bounds concurrency and validates the pinned model;
        // allow the request to finish instead of turning a healthy inference into 503.
        aiRequestOptions(120000)
      );
      if (typeof res.data.response !== "string" || !res.data.response.trim()) {
        throw new Error("Empty AI response");
      }
      return res.data.response;
    } catch {
      throw Object.assign(new Error("AI 服務暫時不可用"), { statusCode: 503 });
    }
  }

  // 生成背景故事（可選功能）
  async generateBackstory(spiritId: string, userId: string) {
    const spirit = await prisma.spirit.findFirst({ where: { id: spiritId, userId } });
    if (!spirit) return;

    try {
      const res = await axios.post(`${config.ai.engineUrl}/api/dialogue/story`, {
        prompt: buildStoryPrompt(spirit.name, spirit.element, spirit.personality),
      }, aiRequestOptions(60000));
      const story = res.data.story;
      if (story) {
        await prisma.spirit.update({ where: { id: spiritId }, data: { backstory: story } });
      }
    } catch (err: any) {
      console.warn(`[Backstory] AI engine unavailable: ${err.code || err.message}`);
    }
  }
}

// 輔助函數
const STAGE_CN: Record<string, string> = {
  EGG: "蛋", HATCHLING: "幼體", JUVENILE: "少年體", ADULT: "成年體", ULTIMATE: "究極體", LEGENDARY: "傳說體",
};
function getStageLabel(s: string) { return STAGE_CN[s] || s; }

function buildStoryPrompt(name: string, element: string, personality?: string | null) {
  const elemCN: Record<string, string> = {
    FIRE: "火焰", WATER: "水流", LIGHT: "光明", SHADOW: "陰影", STAR: "星辰",
    ILLUSION: "幻象", MOON: "月亮", NATURE: "自然", THUNDER: "雷電", ICE: "冰雪",
  };
  return `你是 Nightasaur 世界故事敘述者。請為${name}這隻${elemCN[element] || element}屬性精靈創作短篇背景故事。性格：${personality || "神秘"}。50-500字，風格溫暖魔幻奇幻。`;
}

export const dialogueService = new DialogueService();
