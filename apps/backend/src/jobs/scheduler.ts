/**
 * ?’ç??å? ??ä½¿ç”¨ node-cron ?–ä»£ BullMQ/Redis
 *
 * ä»»å?ï¼?
 * - æ¯?5 ?†é?ï¼šè???AI ?–ç??Ÿæ?ä½‡å?
 * - æ¯å¤© 08:00ï¼šè‡ª?•ç??æ??¥æ?äº?
 * - æ¯å??‚ï?æª¢æŸ¥?’ç?è²¼æ?ä¸¦ç™¼å¸?
 */
import { imageGenService } from "../services/imagegen.js";

let cronJob: any = null;

export class Scheduler {
  private timers: NodeJS.Timeout[] = [];

  start() {
    console.log("[Scheduler] Starting background jobs...");

    // æ¯?5 ?†é?ï¼šè???AI ?–ç??Ÿæ?ä½‡å?
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

    // ?Ÿå??‚ç??»è??†ä?æ¬?
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
