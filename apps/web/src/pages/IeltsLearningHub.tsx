import { useNavigate } from "react-router-dom";

const skills = [
  {
    id: "listening",
    icon: "🎧",
    title: "Listening",
    zh: "聽力",
    description: "建立題型辨識、關鍵字捕捉與長段落理解能力。",
    status: "準備中",
  },
  {
    id: "reading",
    icon: "📖",
    title: "Reading",
    zh: "閱讀",
    description: "訓練定位資訊、同義替換、段落主旨與時間管理。",
    status: "準備中",
  },
  {
    id: "writing",
    icon: "✍️",
    title: "Writing",
    zh: "寫作",
    description: "從任務理解、架構規劃到逐段回饋與重寫。",
    status: "準備中",
  },
  {
    id: "speaking",
    icon: "🎙️",
    title: "Speaking",
    zh: "口說",
    description: "建立即時表達、延伸回答、流暢度與發音回饋流程。",
    status: "準備中",
  },
];

export default function IeltsLearningHub() {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="glass-card p-6 sm:p-8 mb-8 border border-emerald-400/20">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-200 text-sm mb-4">
              🌙 Authenticated Early Access
            </div>
            <h1 className="text-3xl sm:text-4xl font-black mb-3">Nightasaur 英語訓練對話</h1>
            <p className="text-white/65 max-w-3xl leading-relaxed">
              從日常生活、工作與旅行話題出發，練習用英語分享想法、提問與討論。你可以前往精靈頁開始文字對話；聽力、閱讀、寫作與口說專項仍在準備中。
            </p>
          </div>
          <button
            onClick={() => navigate("/spirits")}
            className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 transition-colors text-sm whitespace-nowrap"
          >
            前往精靈開始對話
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="glass-card p-6 lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
            <div>
              <h2 className="text-2xl font-bold mb-2">🎯 選用：IELTS 目標設定</h2>
              <p className="text-white/60">若你也有 IELTS 備考需求，可以設定目標分數與每日可投入時間。此設定不是測驗成績，也不是開始英語對話的必要條件。</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-sky-500/15 text-sky-200 text-xs whitespace-nowrap w-fit">設定已開放</span>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            <div className="rounded-xl bg-white/5 p-4">
              <div className="text-white/40 text-xs mb-1">目前 Band</div>
              <div className="text-xl font-bold">—</div>
            </div>
            <div className="rounded-xl bg-white/5 p-4">
              <div className="text-white/40 text-xs mb-1">目標 Band</div>
              <div className="text-xl font-bold">待設定</div>
            </div>
            <div className="rounded-xl bg-white/5 p-4">
              <div className="text-white/40 text-xs mb-1">今日任務</div>
              <div className="text-xl font-bold">等待評量</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate("/academy/category/ielts/assessment")}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-medium transition-colors"
          >
            開始起始評量設定
          </button>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-xl font-bold mb-4">🦕 Spirit 陪伴模式</h2>
          <div className="space-y-4 text-sm text-white/65">
            <p>• 練習前：確認目標與今天的學習負荷</p>
            <p>• 練習中：協助拆解題目，不直接代替你作答</p>
            <p>• 練習後：整理錯誤、策略與下一次要改善的項目</p>
            <p>• 長期：把真實學習結果累積為 Learning Event（學習事件）</p>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <h2 className="text-2xl font-bold mb-1">英語專項練習</h2>
        <p className="text-white/50">先建立清楚入口，後續逐科接入真實題目、AI 回饋與進度紀錄。</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {skills.map((skill) => (
          <div key={skill.id} className="glass-card p-6">
            <div className="text-4xl mb-4">{skill.icon}</div>
            <div className="flex items-center justify-between gap-3 mb-2">
              <h3 className="text-xl font-bold">{skill.title}</h3>
              <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-white/50">{skill.status}</span>
            </div>
            <div className="text-emerald-300 text-sm mb-3">{skill.zh}</div>
            <p className="text-sm text-white/55 leading-relaxed">{skill.description}</p>
          </div>
        ))}
      </div>

      <div className="glass-card p-6 border border-sky-400/15">
        <h2 className="text-xl font-bold mb-3">開發順序</h2>
        <div className="grid md:grid-cols-4 gap-4 text-sm">
          <div className="rounded-xl bg-white/5 p-4"><div className="text-sky-300 font-medium mb-1">1. Assessment</div><div className="text-white/50">起始評量</div></div>
          <div className="rounded-xl bg-white/5 p-4"><div className="text-sky-300 font-medium mb-1">2. Daily Plan</div><div className="text-white/50">每日學習計畫</div></div>
          <div className="rounded-xl bg-white/5 p-4"><div className="text-sky-300 font-medium mb-1">3. Practice</div><div className="text-white/50">四科練習與 AI 回饋</div></div>
          <div className="rounded-xl bg-white/5 p-4"><div className="text-sky-300 font-medium mb-1">4. Memory</div><div className="text-white/50">進度與 Spirit 長期記憶</div></div>
        </div>
      </div>
    </div>
  );
}
