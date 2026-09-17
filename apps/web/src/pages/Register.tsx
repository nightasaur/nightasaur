import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../api/client";

export default function Register({ setUser }: { setUser: (u: any) => void }) {
  const nav = useNavigate();
  const [form, setForm] = useState({ email: "", username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await authAPI.register(form);

      if (res.data && res.data.token) {
        localStorage.setItem("nightasaur_token", res.data.token);
        setUser(res.data.user);
        nav("/dashboard");
      } else {
        setError("註冊響應格式錯誤");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || "註冊失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 relative z-10">
      <div className="glass-card w-full max-w-md">
        <h2 className="text-3xl font-black text-center mb-2 neon-text">加入 Nightasaur 🌙</h2>
        <p className="text-white/50 text-center mb-8">開始你的精靈冒險旅程</p>

        {error && <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-2 rounded-lg mb-4">{error}</div>}

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
            className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-lg"
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
      </div>
    </div>
  );
}