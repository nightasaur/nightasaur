import { Link } from "react-router-dom";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useLanguage } from "../contexts/LanguageContext";

interface HomeCopy {
  hero: string;
  description: string;
  enterSpirit: string;
  createSpirit: string;
  exploreIelts: string;
  pillarsTitle: string;
  pillars: Array<{ title: string; description: string }>;
  cycleTitle: string;
  cycle: string[];
  languageTitle: string;
  languageDescription: string;
  languageSaved: string;
  featuresTitle: string;
  features: Array<{ title: string; description: string }>;
}

interface HomeMetadata {
  title: string;
  description: string;
}

export const HOME_METADATA: Record<string, HomeMetadata> = {
  "zh-TW": {
    title: "Nightasaur — 陪你學習、創作與現實成長的 AI Spirit",
    description: "讓 AI Spirit 陪你在真實世界一起成長，從學習、創作、職業技能到日常工作，建立專屬於你的成長歷程。",
  },
  "zh-CN": {
    title: "Nightasaur — 陪你学习、创作与现实成长的 AI Spirit",
    description: "让 AI Spirit 陪你在真实世界一起成长，从学习、创作、职业技能到日常工作，建立专属于你的成长历程。",
  },
  "en-US": {
    title: "Nightasaur — AI Spirit for Learning, Creation and Real-World Growth",
    description: "Grow in the real world with your AI Spirit across learning, creativity, professional skills, and daily work.",
  },
  "ja-JP": {
    title: "Nightasaur — 学習・創作・現実の成長を支える AI Spirit",
    description: "学習、創作、専門スキル、日々の仕事まで、AI Spirit と一緒に現実世界で成長しよう。",
  },
  "ko-KR": {
    title: "Nightasaur — 학습·창작·현실 성장을 함께하는 AI Spirit",
    description: "학습과 창작부터 직무 기술과 일상 업무까지, AI Spirit과 함께 현실 세계에서 성장하세요.",
  },
};

const COPY: Record<string, HomeCopy> = {
  "zh-TW": {
    hero: "讓 AI Spirit 陪你在真實世界一起成長。",
    description:
      "從學習、創作、職業技能到日常工作，Spirit 會記住你的歷程、理解你的習慣，並隨著你們共同完成的真實任務逐步成長。",
    enterSpirit: "進入我的 Spirit 世界 ✨",
    createSpirit: "建立我的 Spirit 🥚",
    exploreIelts: "探索 IELTS 深度沉浸體驗 🎓",
    pillarsTitle: "Nightasaur 核心支柱",
    pillars: [
      { title: "Agent — 能力", description: "AI 驅動的學習與創作能力" },
      { title: "Spirit — 關係", description: "專屬於你的成長夥伴關係" },
      { title: "Learning & Profession — 現實能力", description: "真實世界的學習與職業技能" },
      { title: "Social — 世界", description: "與社群共同成長的世界" },
    ],
    cycleTitle: "Human × Spirit 成長循環",
    cycle: ["學習", "練習", "協作", "創作", "分享", "成長"],
    languageTitle: "多語言支援系統",
    languageDescription: "支援 5 種語言，隨時切換",
    languageSaved: "語言設定會自動保存，並在整個應用中生效",
    featuresTitle: "技術特色",
    features: [
      { title: "PWA 支援", description: "可安裝到桌面，提供行動體驗" },
      { title: "夜間主題", description: "沉浸式深色設計，保護眼睛" },
      { title: "響應式設計", description: "支援所有裝置，完美適配" },
      { title: "即時同步", description: "跨裝置同步學習進度" },
    ],
  },
  "zh-CN": {
    hero: "让 AI Spirit 陪你在真实世界一起成长。",
    description:
      "从学习、创作、职业技能到日常工作，Spirit 会记住你的历程、理解你的习惯，并随着你们共同完成的真实任务逐步成长。",
    enterSpirit: "进入我的 Spirit 世界 ✨",
    createSpirit: "创建我的 Spirit 🥚",
    exploreIelts: "探索 IELTS 深度沉浸体验 🎓",
    pillarsTitle: "Nightasaur 核心支柱",
    pillars: [
      { title: "Agent — 能力", description: "AI 驱动的学习与创作能力" },
      { title: "Spirit — 关系", description: "专属于你的成长伙伴关系" },
      { title: "Learning & Profession — 现实能力", description: "真实世界的学习与职业技能" },
      { title: "Social — 世界", description: "与社群共同成长的世界" },
    ],
    cycleTitle: "Human × Spirit 成长循环",
    cycle: ["学习", "练习", "协作", "创作", "分享", "成长"],
    languageTitle: "多语言支持系统",
    languageDescription: "支持 5 种语言，随时切换",
    languageSaved: "语言设置会自动保存，并在整个应用中生效",
    featuresTitle: "技术特色",
    features: [
      { title: "PWA 支持", description: "可安装到桌面，提供移动体验" },
      { title: "夜间主题", description: "沉浸式深色设计，保护眼睛" },
      { title: "响应式设计", description: "支持所有设备，完美适配" },
      { title: "实时同步", description: "跨设备同步学习进度" },
    ],
  },
  "en-US": {
    hero: "Grow in the real world with your AI Spirit.",
    description:
      "From learning and creativity to professional skills and daily work, your Spirit remembers your journey, understands your habits, and grows as you complete real-world missions together.",
    enterSpirit: "Enter My Spirit World ✨",
    createSpirit: "Create My Spirit 🥚",
    exploreIelts: "Explore IELTS Deep Immersion 🎓",
    pillarsTitle: "Nightasaur Core Pillars",
    pillars: [
      { title: "Agent — Capability", description: "AI-powered learning and creative capabilities" },
      { title: "Spirit — Relationship", description: "A personal growth partnership that belongs to you" },
      { title: "Learning & Profession — Real Skills", description: "Learning and professional skills for the real world" },
      { title: "Social — World", description: "A world that grows together with its community" },
    ],
    cycleTitle: "Human × Spirit Growth Loop",
    cycle: ["Learn", "Practice", "Collaborate", "Create", "Share", "Grow"],
    languageTitle: "Multilingual System",
    languageDescription: "Switch between 5 languages at any time",
    languageSaved: "Your language setting is saved automatically and applied across the app",
    featuresTitle: "Technical Features",
    features: [
      { title: "PWA Support", description: "Install on desktop for a mobile-like experience" },
      { title: "Night Theme", description: "An immersive dark design that is easy on the eyes" },
      { title: "Responsive Design", description: "Optimized for every device" },
      { title: "Real-time Sync", description: "Sync learning progress across devices" },
    ],
  },
  "ja-JP": {
    hero: "AI Spirit と一緒に、現実世界で成長しよう。",
    description:
      "学習、創作、専門スキル、日々の仕事まで。Spirit はあなたの歩みと習慣を理解し、現実のミッションを共に達成しながら成長します。",
    enterSpirit: "Spirit の世界へ ✨",
    createSpirit: "Spirit を作る 🥚",
    exploreIelts: "IELTS 深度イマージョンを体験 🎓",
    pillarsTitle: "Nightasaur の中核",
    pillars: [
      { title: "Agent — 能力", description: "AI による学習と創作の能力" },
      { title: "Spirit — 関係", description: "あなただけの成長パートナー" },
      { title: "Learning & Profession — 実践力", description: "現実世界で役立つ学習と専門スキル" },
      { title: "Social — 世界", description: "コミュニティと共に成長する世界" },
    ],
    cycleTitle: "Human × Spirit 成長サイクル",
    cycle: ["学ぶ", "練習", "協力", "創作", "共有", "成長"],
    languageTitle: "多言語対応システム",
    languageDescription: "5 言語をいつでも切り替え",
    languageSaved: "言語設定は自動保存され、アプリ全体に反映されます",
    featuresTitle: "技術的な特長",
    features: [
      { title: "PWA 対応", description: "デスクトップにインストールして利用可能" },
      { title: "ナイトテーマ", description: "目に優しい没入型ダークデザイン" },
      { title: "レスポンシブ設計", description: "あらゆる端末に最適化" },
      { title: "リアルタイム同期", description: "端末間で学習進捗を同期" },
    ],
  },
  "ko-KR": {
    hero: "AI Spirit과 함께 현실 세계에서 성장하세요.",
    description:
      "학습과 창작부터 직무 기술과 일상 업무까지, Spirit은 당신의 여정과 습관을 이해하고 실제 과제를 함께 완수하며 성장합니다.",
    enterSpirit: "나의 Spirit 세계로 ✨",
    createSpirit: "나의 Spirit 만들기 🥚",
    exploreIelts: "IELTS 심층 몰입 체험하기 🎓",
    pillarsTitle: "Nightasaur 핵심 축",
    pillars: [
      { title: "Agent — 역량", description: "AI 기반 학습 및 창작 역량" },
      { title: "Spirit — 관계", description: "당신만의 성장 파트너십" },
      { title: "Learning & Profession — 실전 역량", description: "현실 세계의 학습 및 직무 기술" },
      { title: "Social — 세계", description: "커뮤니티와 함께 성장하는 세계" },
    ],
    cycleTitle: "Human × Spirit 성장 순환",
    cycle: ["학습", "연습", "협업", "창작", "공유", "성장"],
    languageTitle: "다국어 지원 시스템",
    languageDescription: "5개 언어를 언제든지 전환",
    languageSaved: "언어 설정은 자동 저장되어 앱 전체에 적용됩니다",
    featuresTitle: "기술 특징",
    features: [
      { title: "PWA 지원", description: "데스크톱에 설치해 모바일처럼 사용" },
      { title: "야간 테마", description: "눈이 편안한 몰입형 다크 디자인" },
      { title: "반응형 디자인", description: "모든 기기에 최적화" },
      { title: "실시간 동기화", description: "기기 간 학습 진행 상황 동기화" },
    ],
  },
};

const PILLAR_ICONS = ["🤖", "💞", "📚", "🌍"];
const CYCLE_ICONS = ["📖", "💪", "🤝", "✨", "🌐", "📈"];
const CYCLE_COLORS = [
  "bg-blue-500/20",
  "bg-green-500/20",
  "bg-purple-500/20",
  "bg-yellow-500/20",
  "bg-pink-500/20",
  "bg-teal-500/20",
];
const LANGUAGES = [
  { flag: "🇹🇼", name: "繁體中文", code: "zh-TW" },
  { flag: "🇨🇳", name: "简体中文", code: "zh-CN" },
  { flag: "🇺🇸", name: "English", code: "en-US" },
  { flag: "🇯🇵", name: "日本語", code: "ja-JP" },
  { flag: "🇰🇷", name: "한국어", code: "ko-KR" },
];

export default function Home() {
  const token = localStorage.getItem("nightasaur_token");
  const { currentLanguage } = useLanguage();
  const copy = COPY[currentLanguage] ?? COPY["zh-TW"];

  return (
    <div className="min-h-[90vh] flex flex-col items-center justify-center text-center px-6 relative z-10">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-4 h-4 bg-purple-500/20 rounded-full"></div>
        <div className="absolute bottom-40 right-20 w-6 h-6 bg-green-500/10 rounded-full"></div>
        <div className="absolute top-1/2 left-1/4 w-8 h-8 bg-blue-500/10 rounded-full"></div>
        <div className="absolute top-1/3 right-1/3 w-10 h-10 bg-purple-500/5 rounded-full"></div>
      </div>

      <div className="absolute top-6 right-6 z-30">
        <LanguageSwitcher compact={true} />
      </div>

      <div className="animate-float mb-8">
        <span className="text-8xl">🌙🦕</span>
      </div>

      <h1 className="text-5xl md:text-7xl font-black mb-4">
        <span className="neon-text">Nightasaur</span>
      </h1>

      <p className="text-xl md:text-2xl text-white/60 mb-2 max-w-2xl">{copy.hero}</p>
      <p className="text-lg text-white/40 mb-10 max-w-xl">{copy.description}</p>

      <div className="flex flex-wrap gap-4 justify-center mb-12">
        {token ? (
          <Link to="/dashboard" className="btn-primary text-lg py-4 px-8 animate-pulse">
            {copy.enterSpirit}
          </Link>
        ) : (
          <>
            <Link to="/register" className="btn-primary text-lg py-4 px-8">
              {copy.createSpirit}
            </Link>
            <Link to="/products/ielts-immersion" className="btn-secondary text-lg py-4 px-8">
              {copy.exploreIelts}
            </Link>
          </>
        )}
      </div>

      <div className="mb-16 max-w-4xl w-full">
        <h2 className="text-2xl font-bold mb-8 gradient-text">{copy.pillarsTitle}</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {copy.pillars.map((pillar, index) => (
            <div key={pillar.title} className="glass-card text-center hover:scale-105 transition-transform duration-300">
              <div className="text-5xl mb-4">{PILLAR_ICONS[index]}</div>
              <h3 className="text-lg font-bold mb-2">{pillar.title}</h3>
              <p className="text-white/50 text-sm">{pillar.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-16 max-w-4xl w-full">
        <h2 className="text-2xl font-bold mb-8 gradient-text">{copy.cycleTitle}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {copy.cycle.map((label, index) => (
            <div key={CYCLE_ICONS[index]} className="flex flex-col items-center">
              <div className={`w-16 h-16 rounded-full ${CYCLE_COLORS[index]} flex items-center justify-center mb-2`}>
                <span className="text-2xl">{CYCLE_ICONS[index]}</span>
              </div>
              <span className="text-sm font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12 w-full max-w-2xl">
        <div className="glass-card border border-purple-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                <span className="text-xl">🌐</span>
              </div>
              <div className="text-left">
                <h3 className="font-bold text-white">{copy.languageTitle}</h3>
                <p className="text-sm text-white/50">{copy.languageDescription}</p>
              </div>
            </div>
            <LanguageSwitcher compact={true} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-4">
            {LANGUAGES.map((language) => (
              <div
                key={language.code}
                className="flex flex-col items-center justify-center p-3 rounded-lg bg-white/5 hover:bg-purple-500/10 transition-colors"
              >
                <span className="text-2xl mb-1">{language.flag}</span>
                <span className="text-xs text-white/70">{language.name}</span>
                <span className="text-xs text-white/30 mt-1">{language.code}</span>
              </div>
            ))}
          </div>

          <p className="text-sm text-white/40 mt-4 text-center">{copy.languageSaved}</p>
        </div>
      </div>

      <div className="mt-12 w-full max-w-2xl">
        <div className="glass-card">
          <h3 className="text-lg font-bold gradient-text mb-4">{copy.featuresTitle}</h3>
          <div className="grid grid-cols-2 gap-4">
            {copy.features.map((feature) => (
              <div key={feature.title} className="bg-white/5 rounded-lg p-3">
                <p className="text-sm font-medium text-white/80 mb-1">{feature.title}</p>
                <p className="text-xs text-white/50">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-12 text-white/30 text-sm">
        <p>© 2026 Nightasaur. All rights reserved.</p>
        <p className="mt-1 text-xs">AI Spirit for Learning, Creation and Real-World Growth</p>
      </div>
    </div>
  );
}
