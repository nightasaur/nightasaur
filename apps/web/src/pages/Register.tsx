import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../api/client";

export default function Register({ setUser }: { setUser: (u: any) => void }) {
  const nav = useNavigate();
  const [form, setForm] = useState({ email: "", username: "", password: "" });
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setWarning("");
    setLoading(true);

    try {
      const res = await authAPI.register(form);

      // 檢查回應格式
      if (res.data && res.data.success) {
        // 儲存 token
        if (res.data.token) {
          localStorage.setItem("nightasaur_token", res.data.token);
        }
        
        // 設定使用者資訊
        if (res.data.user) {
          setUser(res.data.user);
        }
        
        // 顯示警告訊息（如記憶體模式）
        if (res.data.warning) {
          setWarning(res.data.warning);
          // 仍然允許註冊成功，但顯示警告
          setTimeout(() => {
            nav("/dashboard");
          }, 2000);
        } else {
          // 正常跳轉到儀表板
          nav("/dashboard");
        }
        
        // 如果有精靈資訊，顯示成功訊息
        if (res.data.spirit) {
          console.log("🎉 註冊成功！初始精靈已創建:", res.data.spirit.name);
        }
      } else {
        // 處理錯誤回應
        setError(res.data?.message || "註冊失敗，請檢查輸入資料");
      }
    } catch (err: any) {
      // 處理 API 錯誤
      const errorData = err.response?.data;
      
      if (errorData) {
        // 結構化錯誤訊息
        if (errorData.message) {
          setError(errorData.message);
        } else if (errorData.error) {
          setError(errorData.error);
        } else {
          setError("註冊失敗，請稍後再試");
        }
        
        // 如果有詳細錯誤資訊，記錄到 console
        if (errorData.details) {
          console.error("註冊詳細錯誤:", errorData.details);
        }
      } else {
        // 網路錯誤或其他錯誤
        setError(err.message || "網路錯誤，請檢查連線狀態");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 relative z-10">
      <div className="glass-card w-full max-w-md">
        <h2 className="text-3xl font-black text-center mb-2 neon-text">加入 Nightasaur 🌙</h2>
        <p className="text-white/50 text-center mb-8">開始你的精靈冒險旅程</p>

        {/* 錯誤訊息 */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-2 rounded-lg mb-4">
            <div className="font-medium">❌ 註冊失敗</div>
            <div className="text-sm mt-1">{error}</div>
          </div>
        )}

        {/* 警告訊息 */}
        {warning && (
          <div className="bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 px-4 py-2 rounded-lg mb-4">
            <div className="font-medium">⚠️ 注意</div>
            <div className="text-sm mt-1">{warning}</div>
            <div className="text-xs mt-2 text-yellow-400/70">將在 2 秒後自動跳轉...</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Email</label>
            <input
              className="input-field"
              type="email"
              placeholder="your@email.com"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">用戶名</label>
            <input
              className="input-field"
              type="text"
              placeholder="選擇一個酷炫的名字"
              required
              minLength={3}
              maxLength={20}
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              disabled={loading}
            />
            <p className="text-xs text-white/40 mt-1">3-20 個字元，可使用中文、英文或數字</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">密碼</label>
            <input
              className="input-field"
              type="password"
              placeholder="至少8個字元"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              disabled={loading}
            />
            <p className="text-xs text-white/40 mt-1">建議使用大小寫字母、數字和符號的組合</p>
          </div>

          <button
            className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                註冊中...
              </>
            ) : (
              <>
                <span className="text-xl">🥚</span>
                開始孵化！
              </>
            )}
          </button>
        </form>

        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-center">
            <div className="h-px bg-white/10 flex-1"></div>
            <span className="px-4 text-sm text-white/40">或</span>
            <div className="h-px bg-white/10 flex-1"></div>
          </div>

          <p className="text-center text-white/60">
            已經有帳號？{" "}
            <Link to="/login" className="text-purple-400 hover:text-purple-300 font-medium">
              登入 →
            </Link>
          </p>
        </div>

        {/* 資料庫狀態提示 */}
        <div className="mt-6 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="text-xs text-blue-300/70">
            💡 提示：系統會自動檢測資料庫連線狀態。如果資料庫不可用，將使用記憶體模式暫時儲存資料。
          </div>
        </div>
      </div>
    </div>
  );
}