import axios from "axios";
import { aiRequestOptions } from "./aiClient.js";
import prisma from "../config/prisma.js";
import { config } from "../config/index.js";

/**
 * AI 圖片生成服務，呼叫 Python AI Engine 與 ComfyUI。
 */
export class ImageGenService {
  /**
   * 為精靈執行圖片生成背景任務。
   */
  async generateSpiritImage(spiritId: string) {
    const spirit = await prisma.spirit.findUnique({ where: { id: spiritId } });
    if (!spirit) return;

    // 更新任務狀態
    await prisma.generationTask.updateMany({
      where: { spiritId, taskType: "GENERATE_SPIRIT_IMAGE", status: "PENDING" },
      data: { status: "PROCESSING" },
    });

    try {
      const res = await axios.post(
        `${config.ai.engineUrl}/api/generate/image`,
        {
          name: spirit.name,
          element: spirit.element,
          stage: spirit.stage,
          personality: spirit.personality || "friendly",
        },
        aiRequestOptions(300000)
      );

      const data = res.data;
      if (data.status === "completed" && data.images?.length > 0) {
        const imageUrl = data.images[0].url || `http://localhost:8188/view?filename=${data.images[0].filename}`;
        await prisma.generationTask.updateMany({
          where: { spiritId, taskType: "GENERATE_SPIRIT_IMAGE", status: "PROCESSING" },
          data: { status: "COMPLETED", resultUrl: imageUrl, completedAt: new Date(), metadata: JSON.stringify(data) },
        });
        console.log(`[ImageGen] ??${spirit.name} image generated`);
      } else if (data.status === "offline") {
        await prisma.generationTask.updateMany({
          where: { spiritId, taskType: "GENERATE_SPIRIT_IMAGE", status: "PROCESSING" },
          data: { status: "PENDING", errorMsg: "ComfyUI offline - will retry" },
        });
      } else {
        await prisma.generationTask.updateMany({
          where: { spiritId, taskType: "GENERATE_SPIRIT_IMAGE", status: "PROCESSING" },
          data: { status: "FAILED", errorMsg: data.msg || "Unknown error" },
        });
      }
    } catch (err: any) {
      console.error(`[ImageGen] Error for ${spirit.name}:`, err.message);
      await prisma.generationTask.updateMany({
        where: { spiritId, taskType: "GENERATE_SPIRIT_IMAGE", status: "PROCESSING" },
        data: { status: "PENDING", errorMsg: err.message },
      });
    }
  }

  /**
   * 批次處理等待中的圖片生成任務。
   */
  async processPendingTasks() {
    const tasks = await prisma.generationTask.findMany({
      where: {
        taskType: { in: ["GENERATE_SPIRIT_IMAGE", "GENERATE_EVOLUTION_IMAGE"] },
        status: "PENDING",
      },
      take: 3,
      orderBy: { createdAt: "asc" },
    });

    for (const task of tasks) {
      if (task.spiritId) {
        await this.generateSpiritImage(task.spiritId);
      }
    }

    return { processed: tasks.length };
  }
}

export const imageGenService = new ImageGenService();
