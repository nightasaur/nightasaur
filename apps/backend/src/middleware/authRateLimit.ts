// SPDX-License-Identifier: MIT
import { createHmac, randomBytes } from "node:crypto";
import { performance } from "node:perf_hooks";
import type { RequestHandler } from "express";

type Bucket = { count: number; until: number };
type Decision = { allowed: true } | { allowed: false; status: 429 | 503; retryAfter: number };

/** Per-process fixed-window admission control, not a distributed rate limiter. */
export class AuthAttemptLimiter {
  private readonly buckets = new Map<string, Bucket>();
  private readonly salt = randomBytes(32);
  constructor(private readonly now = () => performance.now(), private readonly capacity = 10_000) {}

  attempt(peer: string, email: string): Decision {
    const time = this.now();
    const keys = [["peer", peer], ["pair", peer, email.trim().toLowerCase()]].map(parts =>
      createHmac("sha256", this.salt).update(JSON.stringify(parts)).digest("hex"));
    const limits = [60, 10];
    const active = keys.map(key => {
      const bucket = this.buckets.get(key);
      if (bucket && bucket.until <= time) { this.buckets.delete(key); return undefined; }
      return bucket;
    });
    const blocked = active.filter((bucket, i) => bucket && bucket.count >= limits[i]);
    if (blocked.length) return { allowed: false, status: 429,
      retryAfter: Math.max(1, Math.ceil((Math.max(...blocked.map(b => b!.until)) - time) / 1000)) };
    const missing = active.filter(bucket => !bucket).length;
    if (this.buckets.size + missing > this.capacity) {
      for (const [key, bucket] of this.buckets) if (bucket.until <= time) this.buckets.delete(key);
      if (this.buckets.size + missing > this.capacity) return { allowed: false, status: 503, retryAfter: 60 };
    }
    keys.forEach((key, i) => {
      const bucket = active[i] || { count: 0, until: time + 600_000 };
      bucket.count++;
      this.buckets.set(key, bucket);
    });
    return { allowed: true };
  }
}

export function makeAuthRateLimit(limiter = new AuthAttemptLimiter()): RequestHandler {
  return (req, res, next) => {
    const peer = req.socket.remoteAddress;
    if (!peer) { res.status(503).set("Retry-After", "60").json({ error: "認證服務暫時無法使用" }); return; }
    const email = typeof req.body?.email === "string" ? req.body.email.slice(0, 320) : "";
    const decision = limiter.attempt(peer, email);
    if (!decision.allowed) {
      res.status(decision.status).set("Retry-After", String(decision.retryAfter))
        .set("Cache-Control", "no-store").json({ error: decision.status === 429 ? "嘗試次數過多，請稍後再試" : "認證服務暫時繁忙" });
      return;
    }
    next();
  };
}
