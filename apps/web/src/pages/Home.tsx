import { Link } from "react-router-dom";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function Home() {
  const token = localStorage.getItem("nightasaur_token");

  return (
    <div className="min-h-[90vh] flex flex-col items-center justify-center text-center px-6">
      {/* 語言切換區域 - 紅色醒目設計 */}
      <div className="absolute top-6 right-6 z-30">
        <LanguageSwitcher compact={true} />
      </div>

      {/* 主視覺 */}
      <div className="animate-float mb-8">
        <span className="text-8xl">🌙🦕</span>
      </div>

      <h1 className="text-5xl md:text-7xl font-black mb-4">
        <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
          Nightasaur
        </span>
      </h1>

      <p className="text-xl md:text-2xl text-white/60 mb-2 max-w-2xl">
        你的 AI 數位精靈夥伴
      </p>
      <p className="text-lg text-white/40 mb-10 max-w-xl">
        每人註冊即可生成一隻專屬 AI 精靈 🐉
        像數碼寶貝一樣成長進化，陪你對話冒險
      </p>

      <div className="flex gap-4">
        {token ? (
          <Link to="/dashboard" className="btn-primary text-lg animate-pulse-glow">
            進入我的精靈世界 ✨
          </Link>
        ) : (
          <>
            <Link to="/register" className="btn-primary text-lg">
              開始孵化你的精靈 🥚
            </Link>
            <Link
              to="/login"
              className="glass-card text-white font-bold py-3 px-6 rounded-xl hover:scale-105 transition-all"
            >
              我已經有精靈了
            </Link>
          </>
        )}
      </div>

      {/* 語言系統介紹卡片 */}
      <div className="mt-12 w-full max-w-2xl">
        <div className="glass-card border border-red-500/30 bg-gradient-to-r from-red-900/10 to-red-800/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <span className="text-xl">🌐</span>
              </div>
              <div className="text-left">
                <h3 className="font-bold text-white">多語言支援系統</h3>
                <p className="text-sm text-white/50">支援 5 種語言，隨時切換</p>
              </div>
            </div>
            <LanguageSwitcher compact={true} />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-4">
            {[
              { flag: "🇹🇼", name: "繁體中文", code: "zh-TW" },
              { flag: "🇨🇳", name: "簡體中文", code: "zh-CN" },
              { flag: "🇺🇸", name: "English", code: "en-US" },
              { flag: "🇯🇵", name: "日本語", code: "ja-JP" },
              { flag: "🇰🇷", name: "한국어", code: "ko-KR" }
            ].map((lang) => (
              <div 
                key={lang.code}
                className="flex flex-col items-center justify-center p-3 rounded-lg bg-white/5 hover:bg-red-500/10 transition-colors"
              >
                <span className="text-2xl mb-1">{lang.flag}</span>
                <span className="text-xs text-white/70">{lang.name}</span>
                <span className="text-xs text-white/30 mt-1">{lang.code}</span>
              </div>
            ))}
          </div>
          
          <p className="text-sm text-white/40 mt-4 text-center">
            語言設定會自動保存，並在整個遊戲中生效
          </p>
        </div>
      </div>

      {/* 特性 */}
      <div className="grid md:grid-cols-3 gap-6 mt-20 max-w-4xl w-full">
        {[
          { icon: "🥚", title: "AI 生成專屬精靈", desc: "選擇屬性與性格，AI 為你創造獨一無二的精靈" },
          { icon: "🦎", title: "5 階段進化養成", desc: "從蛋到傳說體，互動越多進化越快" },
          { icon: "💬", title: "陪伴你的精靈對話", desc: "精靈記得住你，用繁體中文跟你聊天冒險，還能語音通話" },
        ].map((f, i) => (
          <div key={i} className="glass-card text-center">
            <div className="text-5xl mb-4">{f.icon}</div>
            <h3 className="text-lg font-bold mb-2">{f.title}</h3>
            <p className="text-white/50 text-sm">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* 屬性展示 */}
      <div className="mt-16 mb-10">
        <p className="text-white/30 text-sm mb-4">十大元素屬性</p>
        <div className="flex flex-wrap justify-center gap-3">
          {["🔥 火", "💧 水", "✨ 光", "🌑 暗", "⭐ 星", "🦊 幻", "🌙 月", "🌿 自然", "⚡ 雷", "❄️ 冰"].map(
            (el, i) => (
              <span key={i} className="glass px-4 py-2 rounded-full text-sm text-white/60">
                {el}
              </span>
            )
          )}
        </div>
      </div>
    </div>
  );
}