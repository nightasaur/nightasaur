import { useEffect, useState } from "react";

type Submission = {
  id: string; productId: string; amount: number; currency: string; status: string;
  passportName?: string; invoiceNumber?: string; createdAt: string; reviewedAt?: string;
};

export default function MyInvoices() {
  const [list, setList] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [passportName, setPassportName] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [message, setMessage] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("nightasaur_token") : null;
  const base = import.meta.env.VITE_API_URL || "http://localhost:3002/api";

  const load = () => {
    if (!token) { setError("Please login first"); setLoading(false); return; }
    fetch(`${base}/payment/my-submissions`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (d.success) setList(d.submissions); else setError(d.error || "Load failed"); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const downloadInvoice = async (id: string, invoiceNumber?: string) => {
    const res = await fetch(`${base}/payment/invoices/${id}/download`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) { alert("Download failed: " + res.status); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice-${invoiceNumber || id}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const previewInvoice = async () => {
    if (!passportName.trim() || passportName.trim().length < 2) {
      alert("Please enter your passport full name");
      return;
    }
    setPreviewLoading(true);
    try {
      const res = await fetch(
        `${base}/payment/preview-invoice?name=${encodeURIComponent(passportName.trim())}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) { alert("Preview failed: " + res.status); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e: any) {
      alert("Preview failed: " + e.message);
    } finally {
      setPreviewLoading(false);
    }
  };

  const confirmPurchase = async () => {
    if (!passportName.trim() || passportName.trim().length < 2) {
      alert("Please enter your passport full name");
      return;
    }
    if (!confirm("請確認已依下方帳號完成匯款。點擊「確定」後將立即開通 30 天課程。\n\nHas your bank transfer been completed?")) return;

    setConfirmLoading(true);
    setMessage("");
    try {
      const res = await fetch(`${base}/payment/confirm-purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          productId: "ielts-immersion",
          passportName: passportName.trim(),
          amount: 500000,
          currency: "AUD",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage("✅ 已開通 30 天課程！可下載 Invoice 或前往學習。");
        load();
      } else {
        alert("Failed: " + (data.error || "unknown"));
      }
    } catch (e: any) {
      alert("Failed: " + e.message);
    } finally {
      setConfirmLoading(false);
    }
  };

  const statusLabel = (s: string) => {
    if (s === "PENDING") return { text: "審核中", cls: "bg-yellow-500/20 text-yellow-300" };
    if (s === "APPROVED") return { text: "已開通", cls: "bg-green-500/20 text-green-300" };
    if (s === "REJECTED") return { text: "已拒絕", cls: "bg-red-500/20 text-red-300" };
    return { text: s, cls: "bg-white/10 text-white/60" };
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-2">我的 Invoice</h1>
      <p className="text-white/50 mb-6">My Invoices / Payment History</p>

      <div className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10 mb-6">
        <h3 className="text-white font-medium mb-4">📋 銀行匯款資訊 / Bank Transfer</h3>
        <div className="space-y-2 text-sm text-white/80">
          <div className="flex justify-between"><span className="text-white/50">Bank</span><span>Chang Hwa Bank (彰化銀行)</span></div>
          <div className="flex justify-between"><span className="text-white/50">Bank Code</span><span className="font-mono text-purple-300">009</span></div>
          <div className="flex justify-between"><span className="text-white/50">Branch</span><span>8244 Bo'ai Branch, Kaohsiung</span></div>
          <div className="flex justify-between"><span className="text-white/50">SWIFT</span><span className="font-mono text-purple-300">CCBCTWTP824</span></div>
          <div className="flex justify-between"><span className="text-white/50">Account No.</span><span className="font-mono text-purple-300">8244 86 075332 00</span></div>
          <div className="flex justify-between"><span className="text-white/50">Account Name</span><span>JRENTECKHH. CO.</span></div>
          <div className="flex justify-between"><span className="text-white/50">Amount</span><span className="font-mono text-purple-300">AUD 5,000.00</span></div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10 mb-8">
        <h3 className="text-white font-medium mb-3">🧾 產生 Invoice 並開通課程</h3>
        <label className="block text-sm text-white/70 mb-2">
          護照英文全名 / Passport Full Name
        </label>
        <input
          type="text"
          value={passportName}
          onChange={(e) => setPassportName(e.target.value)}
          placeholder="例如：CHEN, WEI-TING"
          className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-purple-500 mb-3"
        />
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={previewInvoice}
            disabled={previewLoading}
            className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium border border-white/20 disabled:opacity-50"
          >
            {previewLoading ? "生成中..." : "🔍 預覽 Invoice"}
          </button>
          <button
            onClick={confirmPurchase}
            disabled={confirmLoading}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium disabled:opacity-50 hover:opacity-90"
          >
            {confirmLoading ? "開通中..." : "✅ 確認已匯款，開通課程"}
          </button>
        </div>
        <p className="text-xs text-white/40 mt-3">
          點擊「確認已匯款」即代表您已完成匯款，系統將立即開通 30 天課程並生成正式 Invoice。
        </p>
        {message && (
          <div className="mt-4 p-3 rounded-lg bg-green-500/20 text-green-300 text-sm">{message}</div>
        )}
      </div>

      {loading && <div className="text-white/60">載入中...</div>}
      {error && <div className="text-red-300">{error}</div>}

      {!loading && !error && list.length === 0 && (
        <div className="bg-white/5 rounded-2xl p-8 text-center text-white/60">
          尚無付款記錄
        </div>
      )}

      <div className="space-y-4">
        {list.map((item) => {
          const sl = statusLabel(item.status);
          return (
            <div key={item.id} className="bg-white/5 rounded-2xl p-5 border border-white/10">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-white font-medium">{item.productId}</div>
                  <div className="text-white/50 text-xs mt-1">
                    {new Date(item.createdAt).toLocaleDateString("zh-TW")}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${sl.cls}`}>
                  {sl.text}
                </span>
              </div>

              <div className="text-sm text-white/70 space-y-1 mb-4">
                <div>金額：{item.currency} {(item.amount / 100).toFixed(2)}</div>
                {item.passportName && <div>Invoice 名稱：{item.passportName}</div>}
                {item.invoiceNumber && <div>Invoice No.：{item.invoiceNumber}</div>}
              </div>

              {item.status === "APPROVED" && (
                <button
                  onClick={() => downloadInvoice(item.id, item.invoiceNumber)}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium"
                >
                  📄 下載 Invoice PDF
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}