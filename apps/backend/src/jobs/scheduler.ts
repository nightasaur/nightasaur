/**
 * 背景排程服務：使用計時器取代 BullMQ/Redis。
 *
 * 任務：
 * - 每 5 分鐘處理 AI 圖片生成佇列
 * - 啟動 5 秒後先處理一次待辦任務
 */
import { imageGenService } from "../services/imagegen.js";

export class Scheduler {
  private timers: NodeJS.Timeout[] = [];

  start() {
    console.log("[Scheduler] Starting background jobs...");

    // 每 5 分鐘處理 AI 圖片生成佇列
    this.timers.push(setInterval(async () => {
      try {
        const result = await imageGenService.processPendingTasks();
        if (result.processed > 0) {
          console.log(`[Scheduler] Processed ${result.processed} image tasks`);
        }
      } catch (err: any) {
        console.error("[Scheduler] Image task error:", err.message);
      }
    }, 5 * 60 * 1000));

    // 啟動後先處理一次待辦任務
    setTimeout(async () => {
      try {
        await imageGenService.processPendingTasks();
      } catch {}
    }, 5000);

    console.log("[Scheduler] All jobs registered");
  }

  stop() {
    this.timers.forEach((t) => clearInterval(t));
    this.timers = [];
    console.log("[Scheduler] Stopped");
  }
}

export const scheduler = new Scheduler();
