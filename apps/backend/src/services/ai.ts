import axios from "axios";
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

    // 先創建對話記錄
    const conv = await prisma.conversation.create({
      data: { spiritId, userMessage: message, aiResponse: "思考中..." },
    });

    // 呼叫 AI 引擎
    const aiResponse = await this.callAIEngine(spirit, message, recentHistory);

    // 更新 AI 回應
    await prisma.conversation.update({
      where: { id: conv.id },
      data: { aiResponse },
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
        { timeout: 30000 }
      );
      return res.data.response || "思考中...";
    } catch (err: any) {
      console.warn("[AI Engine offline] falling back to local mock", err.code || err.message);
      return this.mockResponse(spirit);
    }
  }

  // 模擬 AI 引擎回應 - 離線支援功能
  private mockResponse(spirit: any): string {
    const emoji = EMOJI[spirit.element] || "✨";
    const name = spirit.name;
    const pools: Record<string, string[]> = {
      FIRE: [`${emoji} 我是${name}，燃燒熱情！`, `火焰之心在沸騰！`, `要一起去冒險嗎？`],
      WATER: [`${emoji} 潮汐的呼喚...`, `水波蕩漾真舒服！`, `深海裡的秘密等著你`],
      SHADOW: [`${emoji} 陰影深處...`, `黑暗中的${name}在等待`, `...別怕，我在這裡。`],
      STAR: [`${emoji} 來自星空的光芒`, `宇宙能量在流動！`, `你能看見星星嗎？`],
      MOON: [`${emoji} 月光之靈，晚安好。`, `${name}守護著你。`, `今晚特別安靜呢。`],
      LIGHT: [`${emoji} 光明與你同在`, `祝福圍繞著我們`, `好溫暖的感覺～`],
      ILLUSION: [`${emoji} 幻象？還是現實？`, `你相信魔法嗎？`, `夢與現實的交界...`],
      NATURE: [`${emoji} 森林在說話..`, `大自然真美好！`, `聞到花香了嗎？`],
      THUNDER: [`${emoji} 雷鳴轟響！`, `閃電之火！`, `暴風雨前的寧靜...`],
      ICE: [`${emoji} 水晶閃耀的光芒`, `永恆之冰的感覺！`, `冷靜沉著是我的風格`],
    };
    const pool = pools[spirit.element] || [`${emoji} 你好～`, `精靈精靈！`, `一起玩吧！`];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // 生成背景故事（可選功能）
  async generateBackstory(spiritId: string, userId: string) {
    const spirit = await prisma.spirit.findFirst({ where: { id: spiritId, userId } });
    if (!spirit) return;

    try {
      const res = await axios.post(`${config.ai.engineUrl}/api/dialogue/story`, {
        prompt: buildStoryPrompt(spirit.name, spirit.element, spirit.personality),
      }, { timeout: 60000 });
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
const EMOJI: Record<string, string> = {
  FIRE: "🔥", WATER: "💧", LIGHT: "✨", SHADOW: "🌑", STAR: "⭐",
  ILLUSION: "🦊", MOON: "🌙", NATURE: "🌿", THUNDER: "⚡", ICE: "❄️",
};

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
