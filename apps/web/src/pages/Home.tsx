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
        讓 AI Spirit 陪你在真實世界一起成長。
      </p>
      <p className="text-lg text-white/40 mb-10 max-w-xl">
        從學習、創作、職業技能到日常工作，
        Spirit 會記住你的歷程、理解你的習慣，
        並隨著你們共同完成的真實任務逐步成長。
      </p>

      {/* 主要行動按鈕 */}
      <div className="flex flex-wrap gap-4 justify-center mb-12">
        {token ? (
          <Link to="/dashboard" className="btn-primary text-lg py-4 px-8 animate-pulse">
            進入我的 Spirit 世界 ✨
          </Link>
        ) : (
          <>
            <Link to="/register" className="btn-primary text-lg py-4 px-8">
              建立我的 Spirit 🥚
            </Link>
            <Link
              to="/products/ielts-immersion"
              className="btn-secondary text-lg py-4 px-8"
            >
              探索 IELTS 深度沉浸體驗 🎓
            </Link>
          </>
        )}
      </div>

      {/* 四大產品支柱 */}
      <div className="mb-16 max-w-4xl w-full">
        <h2 className="text-2xl font-bold mb-8 gradient-text">Nightasaur 核心支柱</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-card text-center hover:scale-105 transition-transform duration-300">
            <div className="text-5xl mb-4">🤖</div>
            <h3 className="text-lg font-bold mb-2">Agent — 能力</h3>
            <p className="text-white/50 text-sm">AI 驅動的學習與創作能力</p>
          </div>
          <div className="glass-card text-center hover:scale-105 transition-transform duration-300">
            <div className="text-5xl mb-4">💞</div>
            <h3 className="text-lg font-bold mb-2">Spirit — 關係</h3>
            <p className="text-white/50 text-sm">專屬於你的成長夥伴關係</p>
          </div>
          <div className="glass-card text-center hover:scale-105 transition-transform duration-300">
            <div className="text-5xl mb-4">📚</div>
            <h3 className="text-lg font-bold mb-2">Learning & Profession — 現實能力</h3>
            <p className="text-white/50 text-sm">真實世界的學習與職業技能</p>
          </div>
          <div className="glass-card text-center hover:scale-105 transition-transform duration-300">
            <div className="text-5xl mb-4">🌍</div>
            <h3 className="text-lg font-bold mb-2">Social — 世界</h3>
            <p className="text-white/50 text-sm">與社群共同成長的世界</p>
          </div>
        </div>
      </div>

      {/* 成長循環 */}
      <div className="mb-16 max-w-4xl w-full">
        <h2 className="text-2xl font-bold mb-8 gradient-text">Human × Spirit 成長循環</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { icon: "📖", label: "學習", color: "bg-blue-500/20" },
            { icon: "💪", label: "練習", color: "bg-green-500/20" },
            { icon: "🤝", label: "協作", color: "bg-purple-500/20" },
            { icon: "✨", label: "創作", color: "bg-yellow-500/20" },
            { icon: "🌐", label: "分享", color: "bg-pink-500/20" },
            { icon: "📈", label: "成長", color: "bg-teal-500/20" },
          ].map((item, index) => (
            <div key={index} className="flex flex-col items-center">
              <div className={`w-16 h-16 rounded-full ${item.color} flex items-center justify-center mb-2`}>
                <span className="text-2xl">{item.icon}</span>
              </div>
              <span className="text-sm font-medium">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 語言系統介紹卡片 */}
      <div className="mt-12 w-full max-w-2xl">
        <div className="glass-card border border-purple-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
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
            語言設定會自動保存，並在整個應用中生效
          </p>
        </div>
      </div>

      {/* 技術特色 */}
      <div className="mt-12 w-full max-w-2xl">
        <div className="glass-card">
          <h3 className="text-lg font-bold gradient-text mb-4">技術特色</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-sm font-medium text-white/80 mb-1">PWA 支援</p>
              <p className="text-xs text-white/50">可安裝到桌面，行動體驗</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-sm font-medium text-white/80 mb-1">夜間主題</p>
              <p className="text-xs text-white/50">沉浸式深色設計，保護眼睛</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-sm font-medium text-white/80 mb-1">響應式設計</p>
              <p className="text-xs text-white/50">支援所有裝置，完美適配</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-sm font-medium text-white/80 mb-1">即時同步</p>
              <p className="text-xs text-white/50">跨裝置同步學習進度</p>
            </div>
          </div>
        </div>
      </div>

      {/* 頁尾 */}
      <div className="mt-12 text-white/30 text-sm">
        <p>© 2026 Nightasaur. All rights reserved.</p>
        <p className="mt-1 text-xs">AI Spirit for Learning, Creation and Real-World Growth</p>
      </div>
    </div>
  );
}