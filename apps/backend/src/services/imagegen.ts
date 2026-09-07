import axios from "axios";
import prisma from "../config/prisma.js";
import { config } from "../config/index.js";

/**
 * AI ?ñÁ??üÊ??çÂ? ???ºÂè´ Python AI Engine ??ComfyUI
 */
export class ImageGenService {
  /**
   * ?∫Á≤æ?àÁ??êÂ??áÔ??åÊôØ‰ªªÂ??®Ô?
   */
  async generateSpiritImage(spiritId: string) {
    const spirit = await prisma.spirit.findUnique({ where: { id: spiritId } });
    if (!spirit) return;

    // ?¥Êñ∞‰ªªÂ??Ä??
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
        { timeout: 300000 }
      );

      const data = res.data;
      if (data.status === "completed" && data.images?.length > 0) {
        const imageUrl = data.images[0].url || `http://localhost:8188/view?filename=${data.images[0].filename}`;
        await prisma.spirit.update({
          where: { id: spiritId },
          data: { imageUrl },
        });
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
   * ?πÊ¨°?ïÁ??Ä?âÂ??ïÁ??ÑÂ??áÁ??ê‰ªª??
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
