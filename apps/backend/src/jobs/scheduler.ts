/**
 * ?��??��? ??使用 node-cron ?�代 BullMQ/Redis
 *
 * 任�?�?
 * - �?5 ?��?：�???AI ?��??��?佇�?
 * - 每天 08:00：自?��??��??��?�?
 * - 每�??��?檢查?��?貼�?並發�?
 */
import { imageGenService } from "../services/imagegen.js";


export class Scheduler {
  private timers: NodeJS.Timeout[] = [];

  start() {
    console.log("[Scheduler] Starting background jobs...");

    // �?5 ?��?：�???AI ?��??��?佇�?
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

    // ?��??��??��??��?�?
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
