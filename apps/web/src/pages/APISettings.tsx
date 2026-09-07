import { useState, useEffect } from "react";
import { socialAPI } from "../api/client";

export default function APISettings() {
  const [fbStatus, setFbStatus] = useState<any>(null);
  const [igStatus, setIgStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testFB = async () => {
    setLoading(true);
    try {
      const res = await socialAPI.getUserPosts();
      // Use the test endpoint
      const testRes = await fetch("/api/social/posts/test/fb", {
        headers: { Authorization: `Bearer ${localStorage.getItem("nightasaur_token")}` },
      });
      setFbStatus(await testRes.json());
    } catch (err: any) {
      setFbStatus({ ok: false, error: err.message });
    }
    setLoading(false);
  };

  const testIG = async () => {
    setLoading(true);
    try {
      const testRes = await fetch("/api/social/posts/test/ig", {
        headers: { Authorization: `Bearer ${localStorage.getItem("nightasaur_token")}` },
      });
      setIgStatus(await testRes.json());
    } catch (err: any) {
      setIgStatus({ ok: false, error: err.message });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-black mb-2">🔌 API 連線設定</h1>
      <p className="text-white/50 mb-8">設定 Facebook / Instagram API 以發布貼文</p>

      {/* FB Test */}
      <div className="glass-card mb-6">
        <h2 className="text-xl font-bold mb-2">📘 Facebook 粉專</h2>
        <p className="text-white/40 text-sm mb-4">
          需要：FACEBOOK_PAGE_ID + FACEBOOK_PAGE_ACCESS_TOKEN
        </p>
        <button onClick={testFB} disabled={loading} className="btn-primary text-sm mb-4">
          {loading ? "測試中..." : "🔍 測試連線"}
        </button>
        {fbStatus && (
          <div className={`p-4 rounded-xl ${fbStatus.ok ? "bg-green-500/10 border border-green-500/30" : "bg-red-500/10 border border-red-500/30"}`}>
            {fbStatus.ok ? (
              <>
                <p className="text-green-400 font-bold">✅ 連線成功！</p>
                <p className="text-white/70 text-sm mt-1">粉專：{fbStatus.page?.name}</p>
                <p className="text-white/50 text-sm">粉絲：{fbStatus.page?.fan_count?.toLocaleString()}</p>
              </>
            ) : (
              <p className="text-red-400">{fbStatus.error}</p>
            )}
          </div>
        )}
      </div>

      {/* IG Test */}
      <div className="glass-card mb-6">
        <h2 className="text-xl font-bold mb-2">📸 Instagram 商業帳號</h2>
        <p className="text-white/40 text-sm mb-4">
          需要：INSTAGRAM_BUSINESS_ACCOUNT_ID + 同一個 Page Token
        </p>
        <button onClick={testIG} disabled={loading} className="btn-primary text-sm mb-4">
          {loading ? "測試中..." : "🔍 測試連線"}
        </button>
        {igStatus && (
          <div className={`p-4 rounded-xl ${igStatus.ok ? "bg-green-500/10 border border-green-500/30" : "bg-red-500/10 border border-red-500/30"}`}>
            {igStatus.ok ? (
              <>
                <p className="text-green-400 font-bold">✅ 連線成功！</p>
                <p className="text-white/70 text-sm mt-1">帳號：@{igStatus.account?.username}</p>
                <p className="text-white/50 text-sm">粉絲：{igStatus.account?.followers_count?.toLocaleString()} | 貼文：{igStatus.account?.media_count}</p>
              </>
            ) : (
              <p className="text-red-400">{igStatus.error}</p>
            )}
          </div>
        )}
      </div>

      {/* Setup Guide */}
      <div className="glass-card">
        <h2 className="text-xl font-bold mb-4">📋 設定步驟</h2>
        <div className="space-y-4 text-sm text-white/70">
          <div className="flex gap-4">
            <span className="text-2xl">1️⃣</span>
            <div>
              <p className="font-bold text-white">建立 Facebook App</p>
              <p>前往 <a href="https://developers.facebook.com" target="_blank" className="text-purple-400 hover:underline">developers.facebook.com</a> → 建立應用程式 → 選擇「其他」</p>
            </div>
          </div>
          <div className="flex gap-4">
            <span className="text-2xl">2️⃣</span>
            <div>
              <p className="font-bold text-white">取得 Page Access Token</p>
              <p>Graph API Explorer → 選擇你的 App → 取得 User Token → 交換為 Page Token</p>
            </div>
          </div>
          <div className="flex gap-4">
            <span className="text-2xl">3️⃣</span>
            <div>
              <p className="font-bold text-white">綁定 Instagram</p>
              <p>FB 粉專設定 → Instagram → 連結商業帳號 → 取得 IG Business Account ID</p>
            </div>
          </div>
          <div className="flex gap-4">
            <span className="text-2xl">4️⃣</span>
            <div>
              <p className="font-bold text-white">更新 .env</p>
              <code className="block bg-black/30 p-3 rounded-lg mt-2 text-xs">
                FACEBOOK_PAGE_ID=你的粉專ID{"\n"}
                FACEBOOK_PAGE_ACCESS_TOKEN=你的Token{"\n"}
                INSTAGRAM_BUSINESS_ACCOUNT_ID=你的IG商業帳號ID
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}