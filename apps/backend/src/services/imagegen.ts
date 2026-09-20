// SPDX-License-Identifier: MIT
import axios from "axios";
import { createHash } from "node:crypto";
import { aiRequestOptions } from "./aiClient.js";
import prisma from "../config/prisma.js";
import { config } from "../config/index.js";

export function validateGeneratedImage(data: any): string {
  const image = data?.images?.[0];
  if (data?.status !== "completed" || data?.generator !== "nightasaur-procedural-v1" ||
      typeof image?.url !== "string" || image.url.length > 2_000_000 ||
      !/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(image.url)) {
    throw new Error("Image generation did not return a supported PNG");
  }
  const bytes = Buffer.from(image.url.slice(22), "base64");
  if (bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a" ||
      createHash("sha256").update(bytes).digest("hex") !== image.sha256) {
    throw new Error("Image integrity check failed");
  }
  return image.url;
}

export class ImageGenService {
  async generateSpiritImage(spiritId: string) {
    const spirit = await prisma.spirit.findUnique({ where: { id: spiritId } });
    if (!spirit || !spirit.isActive) return;
    const task = await prisma.generationTask.findFirst({ where: {
      spiritId, status: "PENDING",
      taskType: { in: ["GENERATE_SPIRIT_IMAGE", "GENERATE_EVOLUTION_IMAGE"] },
    }, orderBy: {createdAt: "asc"} });
    if (!task) return;
    const claim = await prisma.generationTask.updateMany({where: {id: task.id, status: "PENDING"}, data: {status: "PROCESSING"}});
    if (!claim.count) return;
    try {
      const { data } = await axios.post(`${config.ai.engineUrl}/api/generate/image`,
        {element: spirit.element, stage: spirit.stage}, aiRequestOptions(30000));
      const resultUrl = validateGeneratedImage(data);
      await prisma.generationTask.update({where: {id: task.id}, data: {
        status: "COMPLETED", resultUrl, completedAt: new Date(), errorMsg: null,
        metadata: JSON.stringify({generator: data.generator, seed: data.seed, sha256: data.images[0].sha256}),
      }});
    } catch {
      await prisma.generationTask.update({where: {id: task.id}, data: {
        status: "FAILED", errorMsg: "圖片生成失敗，請稍後重新生成", completedAt: new Date(),
      }});
    }
  }

  async processPendingTasks() {
    const tasks = await prisma.generationTask.findMany({where: {
      taskType: {in: ["GENERATE_SPIRIT_IMAGE", "GENERATE_EVOLUTION_IMAGE"]}, status: "PENDING",
    }, take: 3, orderBy: {createdAt: "asc"}});
    for (const task of tasks) if (task.spiritId) await this.generateSpiritImage(task.spiritId);
    return {processed: tasks.length};
  }
}
export const imageGenService = new ImageGenService();
