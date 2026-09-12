import { Link } from "react-router-dom";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function Home() {
  const token = localStorage.getItem("nightasaur_token");

  return (
    <div className="min-h-[90vh] flex flex-col items-center justify-center text-center px-6 relative z-10">
      {/* 背景裝飾 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-4 h-4 bg-purple-500/20 rounded-full"></div>
        <div className="absolute bottom-40 right-20 w-6 h-6 bg-green-500/10 rounded-full"></div>
        <div className="absolute top-1/2 left-1/4 w-8 h-8 bg-blue-500/10 rounded-full"></div>
        <div className="absolute top-1/3 right-1/3 w-10 h-10 bg-purple-500/5 rounded-full"></div>
      </div>

      {/* 語言切換區域 */}
      <div className="absolute top-6 right-6 z-30">
        <LanguageSwitcher compact={true} />
      </div>

      {/* 主視覺 */}
      <div className="animate-float mb-8">
        <span className="text-8xl">🌙🦕</span>
      </div>

      <h1 className="text-5xl md:text-7xl font-black mb-4">
        <span className="neon-text">
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

      {/* 奈奈引導語 */}
      <div className="night-night-guide mb-10 max-w-xl">
        <div className="flex items-center gap-4">
          <div className="night-night-avatar">
            <span className="text-white">🌌</span>
          </div>
          <div>
            <h3 className="text-lg font-bold gradient-text mb-1">Night Night (奈奈)</h3>
            <p className="text-sm text-white/70">你的冒險嚮導</p>
          </div>
        </div>
        
        <div className="night-night-speech mt-4">
          <p className="text-white/90">
            歡迎來到 Nightasaur 的奇幻世界！<br/>
            我是奈奈，讓我帶你探索這個充滿魔法與 AI 精靈的夜間冒險！
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 justify-center">
        {token ? (
          <Link to="/dashboard" className="btn-primary text-lg py-4 px-8 animate-pulse">
            進入我的精靈世界 ✨
          </Link>
        ) : (
          <>
            <Link to="/register" className="btn-primary text-lg py-4 px-8">
              開始孵化你的精靈 🥚
            </Link>
            <Link
              to="/login"
              className="btn-secondary text-lg py-4 px-8"
            >
              我已經有精靈了
            </Link>
          </>
        )}
      </div>

      {/* 語言系統介紹卡片 */}
      <div className="mt-12 w-full max-w-2xl">
        <div className="glass-card border border-purple-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="night-night-avatar">
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
                className="flex flex-col items-center justify-center p-3 rounded-lg bg-white/5 hover:bg-purple-500/10 transition-colors"
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
          <div key={i} className="glass-card text-center hover:scale-105 transition-transform duration-300">
            <div className="text-5xl mb-4">{f.icon}</div>
            <h3 className="text-lg font-bold mb-2 gradient-text">{f.title}</h3>
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
              <span key={i} className="glass px-4 py-2 rounded-full text-sm text-white/60 hover:bg-purple-500/20 transition-colors">
                {el}
              </span>
            )
          )}
        </div>
      </div>

      {/* 技術特色 */}
      <div className="mt-12 w-full max-w-2xl">
        <div className="glass-card">
          <h3 className="text-lg font-bold gradient-text mb-4">技術特色</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-sm font-medium text-white/80 mb-1">PWA 支援</p>
              <p className="text-xs text-white/50">可安裝到桌面，離線使用</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-sm font-medium text-white/80 mb-1">夜間主題</p>
              <p className="text-xs text-white/50">沉浸式深色設計，保護眼睛</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-sm font-medium text-white/80 mb-1">離線模式</p>
              <p className="text-xs text-white/50">網絡異常時自動切換本地模式</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-sm font-medium text-white/80 mb-1">響應式設計</p>
              <p className="text-xs text-white/50">支援所有裝置，完美適配</p>
            </div>
          </div>
        </div>
      </div>

      {/* 頁尾 */}
      <div className="mt-12 text-white/30 text-sm">
        <p>© 2024 Nightasaur. All rights reserved.</p>
        <p className="mt-1 text-xs">一個關於夢想、AI 與奇幻冒險的專案</p>
      </div>
    </div>
  );
}