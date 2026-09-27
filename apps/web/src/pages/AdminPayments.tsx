import { useEffect, useState } from "react";

type Submission = {
  id: string; userId: string; productId: string; amount: number; currency: string; status: string;
  passportName?: string; invoiceNumber?: string; proofUrl?: string; proofNote?: string; createdAt: string;
};

export default function AdminPayments() {
  const [list, setList] = useState<Submission[]>([]);
  const [status, setStatus] = useState("PENDING");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("nightasaur_token") : null;
  const base = import.meta.env.VITE_API_URL || "http://localhost:3002/api";

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${base}/payment/admin/list?status=${status}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json();
      if (d.success) setList(d.submissions); else setMsg(d.error || "載入失敗");
    } catch (e: any) { setMsg(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [status]);

  const act = async (id: string, action: "approve" | "reject") => {
    const adminNote = prompt("備註（可選）：") || "";
    try {
      const res = await fetch(`${base}/payment/admin/${id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ adminNote }),
      });
      const d = await res.json();
      if (d.success) { setMsg(`✅ 已${action === "approve" ? "批准" : "拒絕"}`); load(); }
      else setMsg("❌ " + (d.error || "操作失敗"));
    } catch (e: any) { setMsg("❌ " + e.message); }
  };

  const downloadInvoice = async (id: string, invoiceNumber?: string) => {
    const res = await fetch(`${base}/payment/admin/invoices/${id}/download`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) { alert("下載失敗：" + res.status); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `invoice-${invoiceNumber || id}.pdf`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-2">付款審核</h1>
      <p className="text-white/50 mb-6">Payment Submissions</p>

      <div className="flex gap-2 mb-6">
        {["PENDING", "APPROVED", "REJECTED", "ALL"].map((s) => (
          <button key={s} onClick={() => setStatus(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${status === s ? "bg-purple-600 text-white" : "bg-white/10 text-white/60 hover:bg-white/20"}`}>
            {s === "PENDING" ? "待審核" : s === "APPROVED" ? "已批准" : s === "REJECTED" ? "已拒絕" : "全部"}
          </button>
        ))}
      </div>

      {msg && <div className="mb-4 p-3 rounded-lg bg-white/10 text-white text-sm">{msg}</div>}
      {loading && <div className="text-white/60">載入中...</div>}

      <div className="space-y-4">
        {list.map((item) => (
          <div key={item.id} className="bg-white/5 rounded-2xl p-5 border border-white/10">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="text-white font-medium">{item.productId}</div>
                <div className="text-white/50 text-xs mt-1">{new Date(item.createdAt).toLocaleString("zh-TW")}</div>
                <div className="text-white/70 text-sm mt-2">用戶 ID：{item.userId.slice(0, 8)}...</div>
              </div>
              <div className="text-right">
                <div className="text-white font-mono">{item.currency} {(item.amount / 100).toFixed(2)}</div>
                <div className="text-xs text-white/50 mt-1">{item.status}</div>
              </div>
            </div>
            <div className="text-sm text-white/70 space-y-1 mb-3">
              {item.passportName && <div>護照名：<span className="text-purple-300">{item.passportName}</span></div>}
              {item.invoiceNumber && <div>Invoice：{item.invoiceNumber}</div>}
              {item.proofNote && <div>備註：{item.proofNote}</div>}
            </div>
            {item.proofUrl && (
              <a href={item.proofUrl} target="_blank" rel="noreferrer" className="text-purple-300 text-sm underline">
                查看匯款截圖
              </a>
            )}
            <div className="flex gap-2 mt-4">
              {item.status === "PENDING" && (
                <>
                  <button onClick={() => act(item.id, "approve")}
                    className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm">
                    ✅ 批准並生成 Invoice
                  </button>
                  <button onClick={() => act(item.id, "reject")}
                    className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm">
                    ❌ 拒絕
                  </button>
                </>
              )}
              {item.status === "APPROVED" && (
                <button onClick={() => downloadInvoice(item.id, item.invoiceNumber)}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm">
                  📄 下載 Invoice
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
