import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../api/client";

export default function Login({ setUser }: { setUser: (u: any) => void }) {
  const nav = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      const res = await authAPI.login(form);
      
      if (res.data && res.data.user) {
        localStorage.setItem("nightasaur_token", res.data.token);
        setUser(res.data.user);
        nav("/dashboard");
      } else {
        setError("登入響應格式錯誤");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.response?.data?.error || "登入失敗");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 relative z-10">
      <div className="glass-card w-full max-w-md">
        <h2 className="text-3xl font-black text-center mb-2 neon-text">歡迎回來 🌙</h2>
        <p className="text-white/50 text-center mb-8">你的精靈在等你！</p>

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
            />
          </div>
          
          <div className="relative">
            <label className="block text-sm font-medium text-white/70 mb-2">密碼</label>
            <input
              className="input-field w-full pr-10"
              type={showPassword ? "text" : "password"} 
              placeholder="輸入密碼" 
              required
              value={form.password} 
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <button
              type="button"
              className="absolute right-3 top-9 transform -translate-y-1/2 text-white/50 hover:text-white/80 focus:outline-none text-sm"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "隱藏密碼" : "顯示密碼"}
            >
              {showPassword ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>
          
          <button 
            className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-lg" 
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                登入中...
              </>
            ) : (
              <>
                <span className="text-xl">🔑</span>
                進入冒險
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
            還沒有帳號？{" "}
            <Link to="/register" className="text-purple-400 hover:text-purple-300 font-medium">
              立即註冊 →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}