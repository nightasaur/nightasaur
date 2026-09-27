import { useState } from "react";

const BANK_INFO = {
  bankCode: "009",
  bankName: "彰化銀行 Chang Hwa Bank",
  branch: "博愛分行",
  branchCode: "8244",
  swift: "CCBCTWTP824",
  account: "8244 86 075332 00",
  holderZh: "藤勝數位科技企業社",
  holderEn: "JRENTECKHH. CO.",
  amount: "AUD $5,000.00",
  twdApprox: "約 TWD $113,400",
};

interface Props {
  productId: string;
  amount: number;
  currency: string;
  onSubmitted?: () => void;
}

export default function BankTransferForm({ productId, amount, currency, onSubmitted }: Props) {
  const [proof, setProof] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [passportName, setPassportName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = async () => {
    if (!passportName.trim() || passportName.trim().length < 2) {
      setResult({ success: false, message: "請填寫護照英文全名（用於 Invoice）" });
      return;
    }
    if (!proof && !note.trim()) {
      setResult({ success: false, message: "請上傳匯款截圖或填寫交易編號" });
      return;
    }
    setSubmitting(true);
    setResult(null);

    try {
      const token = localStorage.getItem("nightasaur_token");
      const formData = new FormData();
      formData.append("productId", productId);
      formData.append("amount", String(amount));
      formData.append("currency", currency);
      formData.append("proofNote", note);
      formData.append("passportName", passportName.trim());
      if (proof) formData.append("proof", proof);

      const base = import.meta.env.VITE_API_URL || "http://localhost:3002/api";
      const res = await fetch(`${base}/payment/submit`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setResult({ success: true, message: "已收到您的匯款證明！我們將在 1-2 個工作日內審核並開通課程。" });
        setProof(null); setNote(""); setPassportName("");
        onSubmitted?.();
      } else {
        setResult({ success: false, message: data.error || "提交失敗" });
      }
    } catch (e: any) {
      setResult({ success: false, message: e.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10">
      <h3 className="text-xl font-bold text-white mb-4">📋 銀行匯款資訊 / Bank Transfer</h3>

      <div className="space-y-3 mb-6 text-sm">
        <Row label="銀行 / Bank" value={BANK_INFO.bankName} />
        <Row label="銀行代碼 / Code" value={BANK_INFO.bankCode} highlight />
        <Row label="分行 / Branch" value={`${BANK_INFO.branch}（${BANK_INFO.branchCode}）`} />
        <Row label="SWIFT Code" value={BANK_INFO.swift} highlight />
        <Row label="帳號 / Account No." value={BANK_INFO.account} highlight />
        <Row label="戶名（中文）" value={BANK_INFO.holderZh} />
        <Row label="Account Name (EN)" value={BANK_INFO.holderEn} highlight />
        <Row label="金額 / Amount" value={`${BANK_INFO.amount}（${BANK_INFO.twdApprox}）`} highlight />
      </div>

      <div className="border-t border-white/10 pt-6 space-y-4">
        <div>
          <label className="block text-sm text-white/70 mb-2">
            護照英文全名 / Passport Full Name <span className="text-red-400">*必填</span>
          </label>
          <input
            type="text"
            value={passportName}
            onChange={(e) => setPassportName(e.target.value)}
            placeholder="例如：CHEN, WEI-TING"
            className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
          />
          <p className="text-xs text-white/40 mt-1">用於 Invoice 開立，請與護照一致</p>
        </div>

        <div>
          <label className="block text-sm text-white/70 mb-2">
            上傳匯款截圖 / Upload Receipt（選填，5MB 以內）
          </label>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setProof(e.target.files?.[0] || null)}
            className="w-full text-sm text-white/80 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-600 file:text-white hover:file:bg-purple-700"
          />
        </div>

        <div>
          <label className="block text-sm text-white/70 mb-2">
            交易編號 / 備註 / Transaction Reference（選填）
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="例如：轉帳末五碼 12345，或匯款時間 2026/09/28 14:30"
            rows={3}
            className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium disabled:opacity-50 hover:opacity-90"
        >
          {submitting ? "提交中..." : "我已匯款，提交證明"}
        </button>

        {result && (
          <div className={`p-4 rounded-lg text-sm ${result.success ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}`}>
            {result.message}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-white/50 shrink-0">{label}</span>
      <span className={`text-right ${highlight ? "text-purple-300 font-mono font-medium" : "text-white"}`}>
        {value}
      </span>
    </div>
  );
}
