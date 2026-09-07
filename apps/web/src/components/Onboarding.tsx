import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const STEPS = [
  {
    title: "🌙 歡迎來到 Nightasaur！",
    desc: "這裡是數位精靈的世界。每位訓練家都能孵化屬於自己的 AI 精靈夥伴。",
    emoji: "🌙🦕",
  },
  {
    title: "🥚 孵化你的第一隻精靈",
    desc: "選擇屬性與性格，AI 將為你生成獨一無二的精靈。從蛋開始，一路進化到傳說體！",
    emoji: "🥚→🦕",
  },
  {
    title: "💬 與精靈對話",
    desc: "每隻精靈都有獨特個性，像賈維斯一樣記得住你。聊天越多，經驗越多！",
    emoji: "💬✨",
  },
  {
    title: "⬆️ 進化養成",
    desc: "達到指定等級即可進化！從蛋→幼體→少年體→成年體→究極體→傳說體。",
    emoji: "🦕👑",
  },
  {
    title: "📱 分享到社群",
    desc: "一鍵將精靈故事發布到 Facebook 粉專 + Instagram，讓全世界看到你的精靈！",
    emoji: "📱🌍",
  },
];

export default function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(true);

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else { setVisible(false); setTimeout(onDone, 400); }
  };

  const skip = () => { setVisible(false); setTimeout(onDone, 400); };

  if (!visible) return null;

  const s = STEPS[step];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm transition-all">
      <div className="glass-card max-w-md w-full mx-4 text-center animate-in zoom-in">
        <div className="text-6xl mb-6 animate-float">{s.emoji}</div>
        <h2 className="text-2xl font-black mb-3">{s.title}</h2>
        <p className="text-white/60 mb-8 leading-relaxed">{s.desc}</p>

        {/* 進度點 */}
        <div className="flex justify-center gap-2 mb-6">
          {STEPS.map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === step ? "bg-purple-500 w-6" : i < step ? "bg-purple-500/50" : "bg-white/20"}`} />
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={skip} className="flex-1 py-3 rounded-xl text-white/40 hover:text-white/70 transition text-sm">跳過</button>
          <button onClick={next} className="flex-1 btn-primary text-sm">
            {step === STEPS.length - 1 ? "🚀 開始冒險！" : "下一步 →"}
          </button>
        </div>
      </div>
    </div>
  );
}