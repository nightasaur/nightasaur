import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { subscriptionAPI, type SubscriptionPlan, type MySubscription } from "../api/client";

declare global {
  interface Window {
    TPDirect: any;
  }
}

const PLAN_META: Record<string, {
  name: string;
  nameEn: string;
  badge?: string;
  tagline: string;
  audience: string;
  usd: number;
  battleCount: number;
  highlight?: boolean;
}> = {
  starter: {
    name: "入門版", nameEn: "STARTER",
    tagline: "個人創作者的日常用量",
    audience: "適合：奈米網紅、個人賣家",
    usd: 20, battleCount: 2,
  },
  growth: {
    name: "成長版", nameEn: "GROWTH", badge: "最受歡迎",
    tagline: "品牌與自媒體的成長產能",
    audience: "適合：品牌小編、自媒體創作者",
    usd: 50, battleCount: 5, highlight: true,
  },
  "pro-a": {
    name: "專業版 A", nameEn: "PRO A",
    tagline: "行銷代理商與工作室的輕量用量",
    audience: "適合：行銷代理商、工作室",
    usd: 100, battleCount: 10,
  },
  "pro-b": {
    name: "專業版 B", nameEn: "PRO B",
    tagline: "行銷代理商與工作室的標準用量",
    audience: "適合：行銷代理商、工作室",
    usd: 180, battleCount: 18,
  },
  "pro-c": {
    name: "專業版 C", nameEn: "PRO C",
    tagline: "行銷代理商與工作室的大量用量",
    audience: "適合：行銷代理商、工作室",
    usd: 300, battleCount: 30,
  },
};

export default function Pricing() {
  const nav = useNavigate();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [mySub, setMySub] = useState<MySubscription | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const cardNumberRef = useRef<HTMLDivElement>(null);
  const cardExpiryRef = useRef<HTMLDivElement>(null);
  const cardCcvRef = useRef<HTMLDivElement>(null);
  const tappayReady = useRef(false);

  useEffect(() => {
    subscriptionAPI.listPlans().then((r) => setPlans(r.data)).catch(() => {});
    subscriptionAPI.me().then((r) => setMySub(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedPlan || tappayReady.current) return;
    if (!window.TPDirect) { setError("TapPay SDK 未載入"); return; }

    const appId = import.meta.env.VITE_TAPPAY_APP_ID;
    const appKey = import.meta.env.VITE_TAPPAY_APP_KEY;
    const env = import.meta.env.VITE_TAPPAY_ENV || "sandbox";
    if (!appId || !appKey) { setError("TapPay 金鑰未設定"); return; }

    window.TPDirect.setupSDK(appId, appKey, env);
    window.TPDirect.card.setup({
      fields: {
        number: { element: cardNumberRef.current, placeholder: "**** **** **** ****" },
        expirationDate: { element: cardExpiryRef.current, placeholder: "MM / YY" },
        ccv: { element: cardCcvRef.current, placeholder: "CCV" },
      },
      styles: {
        input: { color: "white", "font-size": "16px" },
        ".valid": { color: "#4ade80" },
        ".invalid": { color: "#f87171" },
      },
    });
    tappayReady.current = true;
  }, [selectedPlan]);

  const closeModal = () => { if (busy) return; setSelectedPlan(null); setError(""); };

  const handleSubscribe = async () => {
    if (!selectedPlan) return;
    setError(""); setBusy(true);
    try {
      if (!name.trim() || !email.trim() || !phone.trim()) throw new Error("請填寫姓名、Email、手機");
      const status = window.TPDirect.card.getTappayFieldsStatus();
      if (!status.canGetPrime) throw new Error("信用卡資訊未填完整");

      const prime: string = await new Promise((resolve, reject) => {
        window.TPDirect.card.getPrime((result: any) => {
          if (result.status !== 0) reject(new Error(result.msg || "getPrime failed"));
          else resolve(result.card.prime);
        });
      });

      const r = await subscriptionAPI.subscribe({
        prime, planId: selectedPlan,
        cardholder: { phone_number: phone, name, email },
      });

      if (r.data?.success) {
        alert("訂閱成功！");
        setSelectedPlan(null);
        nav("/account");
      } else {
        throw new Error(r.data?.error || "訂閱失敗");
      }
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "訂閱失敗");
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("確定要取消訂閱嗎？下期將不再扣款。")) return;
    try {
      await subscriptionAPI.cancel();
      alert("已取消訂閱");
      const r = await subscriptionAPI.me();
      setMySub(r.data);
    } catch (e: any) {
      alert(e?.response?.data?.error || "取消失敗");
    }
  };

  const currentPlan = selectedPlan ? plans.find((p) => p.id === selectedPlan) : null;
  const meta = selectedPlan ? PLAN_META[selectedPlan] : null;

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-12">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-black text-white text-center mb-3">
          選擇你的方案
        </h1>
        <p className="text-white/50 text-center mb-12">
          解鎖精靈對戰系統，每月自動扣款，隨時取消
        </p>

        {mySub?.status === "ACTIVE" && (
          <div className="max-w-3xl mx-auto mb-10 p-5 rounded-2xl bg-teal-500/10 border border-teal-400/30 text-center">
            <p className="text-white/80">
              目前訂閱：<strong className="text-teal-300">{PLAN_META[mySub.planId]?.name || mySub.planId}</strong>
              {" "}｜下次扣款：{new Date(mySub.nextBillingAt).toLocaleDateString()}
            </p>
            <button onClick={handleCancel} className="mt-2 text-sm text-red-300 underline">
              取消訂閱
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5 items-stretch">
          {/* 免費版 */}
          <Card>
            <CardHeader name="免費版" nameEn="FREE" />
            <CardBody
              tagline="體驗精靈對戰的起點"
              audience="適合：體驗使用者"
            />
            <CardPrice usd={0} />
            <CardNote>不需綁定付款方式</CardNote>
            <CardNote>註冊即可開始，無使用期限</CardNote>
            <CardBattle count={0} />
            <button
              disabled
              className="w-full py-3 rounded-xl bg-white/5 text-white/40 cursor-not-allowed font-bold"
            >
              免費使用
            </button>
          </Card>

          {/* 付費版 */}
          {plans.map((p) => {
            const m = PLAN_META[p.id];
            if (!m) return null;
            return (
              <Card key={p.id} highlight={m.highlight}>
                {m.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-pink-400 to-purple-400 text-white shadow-lg">
                      {m.badge}
                    </span>
                  </div>
                )}
                <CardHeader name={m.name} nameEn={m.nameEn} />
                <CardBody tagline={m.tagline} audience={m.audience} />
                <CardPrice usd={m.usd} twd={p.amountTwd} />
                <CardNote>每月自動扣款，可隨時取消</CardNote>
                <CardNote>改季繳可省 8%</CardNote>
                <CardBattle count={m.battleCount} highlight={m.highlight} />
                <button
                  onClick={() => setSelectedPlan(p.id)}
                  className={`w-full py-3 rounded-xl font-bold transition ${
                    m.highlight
                      ? "bg-gradient-to-r from-pink-400 to-purple-400 text-white hover:opacity-90"
                      : "bg-white text-slate-900 hover:bg-white/90"
                  }`}
                >
                  選擇方案
                </button>
              </Card>
            );
          })}
        </div>
      </div>

      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-md bg-slate-950/95 border border-white/20 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-2xl font-black text-white mb-1">訂閱 {meta?.name}</h3>
            <p className="text-sm text-white/50 mb-4">
              TWD {currentPlan?.amountTwd} / 月，可戰鬥 {meta?.battleCount} 次
            </p>

            <div className="space-y-3">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="姓名" className="input-field w-full" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" className="input-field w-full" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="手機號碼（例：+886912345678）" className="input-field w-full" />
              <div ref={cardNumberRef} className="tpfield input-field h-12" />
              <div className="grid grid-cols-2 gap-3">
                <div ref={cardExpiryRef} className="tpfield input-field h-12" />
                <div ref={cardCcvRef} className="tpfield input-field h-12" />
              </div>
            </div>

            {error && <p className="mt-3 text-sm text-red-300">{error}</p>}

            <div className="flex gap-3 mt-5">
              <button onClick={closeModal} disabled={busy} className="flex-1 py-2 rounded-xl bg-white/5 text-white/60 disabled:opacity-40">
                取消
              </button>
              <button onClick={handleSubscribe} disabled={busy} className="flex-1 py-2 rounded-xl btn-primary disabled:opacity-40">
                {busy ? "處理中…" : "確認付款"}
              </button>
            </div>

            <p className="text-[11px] text-white/30 mt-3 text-center">
              訂閱後每月自動扣款，可隨時取消。
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 卡片零件 ────────────────────────────────────
function Card({ children, highlight }: { children: React.ReactNode; highlight?: boolean }) {
  return (
    <div
      className={`relative rounded-2xl p-5 flex flex-col transition ${
        highlight
          ? "bg-gradient-to-b from-purple-900/40 via-pink-900/30 to-slate-900/60 border-2 border-pink-400/40 shadow-xl shadow-pink-500/10 scale-[1.02]"
          : "bg-white/[0.03] border border-white/10 hover:border-white/20"
      }`}
    >
      {children}
    </div>
  );
}

function CardHeader({ name, nameEn }: { name: string; nameEn: string }) {
  return (
    <div className="mb-3">
      <h3 className="text-xl font-black text-white leading-tight">{name}</h3>
      <p className="text-[11px] text-white/40 tracking-widest font-bold mt-0.5">{nameEn}</p>
    </div>
  );
}

function CardBody({ tagline, audience }: { tagline: string; audience: string }) {
  return (
    <div className="mb-4 space-y-1">
      <p className="text-xs text-white/60 leading-relaxed">{tagline}</p>
      <p className="text-[11px] text-white/40">{audience}</p>
    </div>
  );
}

function CardPrice({ usd, twd }: { usd: number; twd?: number }) {
  return (
    <div className="mb-4">
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-black text-white">${usd}</span>
        <span className="text-xs text-white/40">/ 月</span>
      </div>
      {twd !== undefined && (
        <p className="text-[11px] text-white/40 mt-0.5">≈ TWD {twd} 元 / 月</p>
      )}
    </div>
  );
}

function CardNote({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] text-white/40 leading-relaxed mb-1">{children}</p>;
}

function CardBattle({ count, highlight }: { count: number; highlight?: boolean }) {
  return (
    <div
      className={`my-4 p-3 rounded-xl text-center ${
        highlight ? "bg-white/10 border border-white/10" : "bg-white/5"
      }`}
    >
      <div className="text-lg font-black text-white">
        {count === 0 ? "—" : count}
        {count > 0 && <span className="text-xs font-normal text-white/40 ml-1">次 / 月</span>}
      </div>
      <p className="text-[10px] text-white/40 mt-0.5">
        {count === 0 ? "僅瀏覽精靈" : `可戰鬥 ${count} 次`}
      </p>
    </div>
  );
}