import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../api/client";

export default function Register({ setUser }: { setUser: (u: any) => void }) {
  const nav = useNavigate();
  const [form, setForm] = useState({ email: "", username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      console.log("註冊請求:", form);
      const res = await authAPI.register(form);
      console.log("註冊響應:", res);
      
      if (res.data && res.data.token) {
        localStorage.setItem("nightasaur_token", res.data.token);
        setUser(res.data.user);
        
        // 檢查是否為本地模式
        if (res.data.message && res.data.message.includes("本地")) {
          setIsOfflineMode(true);
          alert("🎉 註冊成功！(本地模式)\n由於伺服器連接問題，您正在使用本地測試模式。\n您的數據將保存在瀏覽器中。");
        }
        
        nav("/dashboard");
      } else {
        setError("註冊響應格式錯誤");
      }
    } catch (err: any) {
      console.error("註冊錯誤:", err);
      
      if (err.isNetworkError) {
        // 網絡錯誤，提示用戶使用本地模式
        setError("無法連接到伺服器，請檢查網絡連接");
        
        // 提供本地模式選項
        const useLocal = confirm("🔌 網絡連接失敗\n是否要使用本地測試模式？\n您的數據將保存在瀏覽器中。");
        
        if (useLocal) {
          // 創建本地用戶
          const mockUser = {
            id: `local_${Date.now()}`,
            email: form.email,
            username: form.username,
            avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(form.username)}&background=667eea&color=fff`,
            bio: '本地測試用戶',
            trainerLevel: 1,
            gems: 100,
            coins: 100,
            createdAt: new Date().toISOString()
          };
          
          const mockToken = `local_token_${Date.now()}`;
          localStorage.setItem("nightasaur_token", mockToken);
          localStorage.setItem("nightasaur_local_user", JSON.stringify(mockUser));
          
          setUser(mockUser);
          setIsOfflineMode(true);
          nav("/dashboard");
          return;
        }
      } else {
        setError(err.response?.data?.message || err.response?.data?.error || "註冊失敗");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 relative z-10">
      {/* 背景裝飾 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-4 h-4 bg-purple-500/20 rounded-full"></div>
        <div className="absolute bottom-40 right-20 w-6 h-6 bg-green-500/10 rounded-full"></div>
        <div className="absolute top-1/2 left-1/4 w-8 h-8 bg-blue-500/10 rounded-full"></div>
      </div>

      <div className="glass-card w-full max-w-md relative">
        {/* 奈奈引導語 */}
        <div className="night-night-guide mb-8">
          <div className="flex items-center gap-4">
            <div className="night-night-avatar">
              <span className="text-white">🎮</span>
            </div>
            <div>
              <h3 className="text-lg font-bold gradient-text mb-1">Night Night (奈奈)</h3>
              <p className="text-sm text-white/70">你的冒險嚮導</p>
            </div>
          </div>
          
          <div className="night-night-speech mt-4">
            <p className="text-white/90">
              歡迎來到 Nightasaur 世界！🌙<br/>
              我是你的引導者奈奈，讓我帶你開始這段奇幻冒險吧！
            </p>
          </div>
        </div>

        <h2 className="text-3xl font-black text-center mb-2 neon-text">孵化你的精靈 🥚</h2>
        <p className="text-white/50 text-center mb-8">註冊即可生成屬於你的 AI 精靈夥伴！</p>
        
        {isOfflineMode && (
          <div className="bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 px-4 py-2 rounded-lg mb-4 text-sm">
            ⚡ 本地模式：數據將保存在您的瀏覽器中
          </div>
        )}

        {error && <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-2 rounded-lg mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Email</label>
            <input
              className="input-field" type="email" placeholder="your@email.com" required
              value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">使用者名稱</label>
            <input
              className="input-field" type="text" placeholder="選擇一個酷炫的名字" required
              value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">密碼</label>
            <input
              className="input-field" type="password" placeholder="至少8個字元" required
              minLength={8}
              value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
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
                孵化中...
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
          
          {/* 測試帳號資訊 */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-center text-white/70 text-sm mb-2">測試帳號：</p>
            <div className="space-y-2">
              <div className="bg-white/5 rounded-lg p-3">
                <p className="font-mono text-xs text-green-400 mb-1">管理員帳號</p>
                <p className="font-mono text-sm">admin@nightasaur.com</p>
                <p className="font-mono text-sm text-red-300">admin123!</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="font-mono text-xs text-blue-400 mb-1">演示帳號</p>
                <p className="font-mono text-sm">demo@nightasaur.com</p>
                <p className="font-mono text-sm text-blue-300">demo1234</p>
              </div>
            </div>
          </div>
          
          {/* 故障排除 */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-center text-white/70 text-sm mb-2">遇到連接問題？</p>
            <ul className="space-y-1 text-xs text-white/50">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500/50 rounded-full"></span>
                檢查網絡連接
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500/50 rounded-full"></span>
                確認後端伺服器運行中 (localhost:3002)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-500/50 rounded-full"></span>
                或使用本地測試模式
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}