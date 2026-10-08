import { Router } from "express";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";
import prisma from "../config/prisma.js";
import { payByPrime, payByToken } from "../services/tappay.js";

const router = Router();

// ─── 方案定價表（TWD / 月） ──────────────────────────
const PLANS: Record<string, { amountTwd: number; label: string }> = {
  starter: { amountTwd: 600,  label: "入門版 Starter" },
  growth:  { amountTwd: 1500, label: "成長版 Growth" },
  "pro-a": { amountTwd: 3000, label: "專業版 A" },
  "pro-b": { amountTwd: 5400, label: "專業版 B" },
  "pro-c": { amountTwd: 9000, label: "專業版 C" },
};

/** GET /api/subscriptions/plans — 取方案清單（公開給前端用） */
router.get("/plans", (_req, res) => {
  res.json(
    Object.entries(PLANS).map(([id, v]) => ({
      id,
      amountTwd: v.amountTwd,
      label: v.label,
    }))
  );
});

/** GET /api/subscriptions/me — 查目前訂閱狀態 */
router.get("/me", authMiddleware, async (req, res, next) => {
  try {
    const sub = await prisma.userSubscription.findUnique({
      where: { userId: req.user!.userId },
      include: { transactions: { orderBy: { createdAt: "desc" }, take: 10 } },
    });
    res.json(sub);
  } catch (err) {
    next(err);
  }
});

/** POST /api/subscriptions/subscribe — 首次訂閱（帶 prime） */
router.post("/subscribe", authMiddleware, async (req, res, next) => {
  try {
    const { prime, planId, cardholder } = req.body || {};
    if (!prime || typeof prime !== "string") {
      res.status(400).json({ error: "prime required" });
      return;
    }
    if (!planId || !PLANS[planId]) {
      res.status(400).json({ error: "invalid planId" });
      return;
    }
    if (
      !cardholder ||
      typeof cardholder.phone_number !== "string" ||
      typeof cardholder.name !== "string" ||
      typeof cardholder.email !== "string"
    ) {
      res.status(400).json({ error: "cardholder { phone_number, name, email } required" });
      return;
    }

    const userId = req.user!.userId;
    const plan = PLANS[planId];

    // 檢查是否已有訂閱
    const existing = await prisma.userSubscription.findUnique({ where: { userId } });
    if (existing && existing.status === "ACTIVE") {
      res.status(409).json({ error: "already subscribed", planId: existing.planId });
      return;
    }

    // 呼叫 TapPay
    const result = await payByPrime({
      prime,
      amount: plan.amountTwd,
      details: `Nightasaur ${plan.label} - 首期`,
      cardholder,
      orderNumber: `SUB-${userId.slice(0, 8)}-${Date.now()}`,
    });

    if (result.status !== 0 || !result.card_secret) {
      res.status(400).json({
        error: result.msg || "TapPay error",
        tappayStatus: result.status,
      });
      return;
    }

    const now = new Date();
    const nextBilling = new Date(now);
    nextBilling.setMonth(nextBilling.getMonth() + 1);

    // 建立 / 更新訂閱 + 記錄交易
    const sub = await prisma.$transaction(async (tx) => {
      const s = existing
        ? await tx.userSubscription.update({
            where: { userId },
            data: {
              planId,
              amountTwd: plan.amountTwd,
              cardKey: result.card_secret!.card_key,
              cardToken: result.card_secret!.card_token,
              status: "ACTIVE",
              nextBillingAt: nextBilling,
              lastBilledAt: now,
              cancelledAt: null,
            },
          })
        : await tx.userSubscription.create({
            data: {
              userId,
              planId,
              amountTwd: plan.amountTwd,
              cardKey: result.card_secret!.card_key,
              cardToken: result.card_secret!.card_token,
              nextBillingAt: nextBilling,
              lastBilledAt: now,
            },
          });

      await tx.subscriptionTransaction.create({
        data: {
          subscriptionId: s.id,
          tappayRecTradeId: result.rec_trade_id || null,
          amountTwd: plan.amountTwd,
          status: "SUCCESS",
          isFirstCharge: true,
        },
      });

      // 升級 User.role（可選）
      await tx.user.update({
        where: { id: userId },
        data: { role: "PREMIUM" },
      });

      return s;
    });

    res.json({
      success: true,
      subscriptionId: sub.id,
      planId: sub.planId,
      nextBillingAt: sub.nextBillingAt,
    });
  } catch (err) {
    console.error("[Subscription] subscribe error:", err instanceof Error ? err.message : err);
    next(err);
  }
});

/** POST /api/subscriptions/cancel — 取消訂閱 */
router.post("/cancel", authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const sub = await prisma.userSubscription.findUnique({ where: { userId } });
    if (!sub) {
      res.status(404).json({ error: "no subscription" });
      return;
    }
    if (sub.status === "CANCELLED") {
      res.json({ success: true, alreadyCancelled: true });
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.userSubscription.update({
        where: { userId },
        data: { status: "CANCELLED", cancelledAt: new Date() },
      });
      await tx.user.update({ where: { id: userId }, data: { role: "PLAYER" } });
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

/** POST /api/subscriptions/process-due — 排程扣款（需 admin） */
router.post("/process-due", adminMiddleware, async (_req, res, next) => {
  try {
    const now = new Date();
    const dueList = await prisma.userSubscription.findMany({
      where: { status: "ACTIVE", nextBillingAt: { lte: now } },
      include: { user: { select: { email: true, username: true } } },
    });

    const results: Array<{ id: string; ok: boolean; msg?: string }> = [];

    for (const sub of dueList) {
      try {
        const plan = PLANS[sub.planId];
        if (!plan) {
          results.push({ id: sub.id, ok: false, msg: "unknown plan" });
          continue;
        }
        const r = await payByToken({
          cardKey: sub.cardKey,
          cardToken: sub.cardToken,
          amount: plan.amountTwd,
          details: `Nightasaur ${plan.label} - 續訂`,
          cardholder: {
            phone_number: "+886900000000",
            name: sub.user.username,
            email: sub.user.email,
          },
        });

        const ok = r.status === 0;
        await prisma.$transaction(async (tx) => {
          await tx.subscriptionTransaction.create({
            data: {
              subscriptionId: sub.id,
              tappayRecTradeId: r.rec_trade_id || null,
              amountTwd: plan.amountTwd,
              status: ok ? "SUCCESS" : "FAILED",
              errorMsg: ok ? null : r.msg,
            },
          });
          if (ok) {
            const nextDate = new Date(sub.nextBillingAt);
            nextDate.setMonth(nextDate.getMonth() + 1);
            await tx.userSubscription.update({
              where: { id: sub.id },
              data: { nextBillingAt: nextDate, lastBilledAt: now, status: "ACTIVE" },
            });
          } else {
            await tx.userSubscription.update({
              where: { id: sub.id },
              data: { status: "PAST_DUE" },
            });
          }
        });
        results.push({ id: sub.id, ok, msg: ok ? undefined : r.msg });
      } catch (e) {
        results.push({ id: sub.id, ok: false, msg: e instanceof Error ? e.message : "exception" });
      }
    }

    res.json({ processed: dueList.length, results });
  } catch (err) {
    next(err);
  }
});

export default router;