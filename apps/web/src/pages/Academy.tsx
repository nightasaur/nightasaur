import { useEffect, useState } from "react";
import { VoiceChat, useVoiceOutput } from "../components/VoiceChat";

async function translateToEnglishLocal(text: string): Promise<string> {
  const clean = (text || "").trim();
  if (!clean || !/[\u4e00-\u9fff]/.test(clean)) return clean;
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-TW&tl=en&dt=t&q=${encodeURIComponent(clean)}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const tr = data[0].map((part: any) => part?.[0] || "").join(" ").trim();
        if (tr) return tr;
      }
    }
  } catch {}
  return "Your spirit companion is cheering you on!";
}

const FALLBACK_COURSES = [
  {
    id: "literature-basics",
    title: "文學基礎與雙語口說",
    icon: "📚",
    difficulty: "初級",
    description: "與伴隨精靈進行中英雙語閱讀與口語發音演練，提升語感與親密度。",
    categories: ["文學", "英語口說"],
    estimatedTime: "10 分鐘",
    reward: { xp: 50, coins: 25 },
    unlocked: true,
  },
  {
    id: "physics-foundation",
    title: "自然物理與科學探索",
    icon: "⚛️",
    difficulty: "初級",
    description: "透過生活實例理解力學與能量，精靈將以英語發音輔助科學詞彙記憶。",
    categories: ["物理", "科學英語"],
    estimatedTime: "12 分鐘",
    reward: { xp: 60, coins: 30 },
    unlocked: true,
  },
  {
    id: "chemistry-intro",
    title: "元素化學與精靈屬性",
    icon: "🧪",
    difficulty: "初級",
    description: "認識水、火、雷、冰等自然元素反應，同步解鎖精靈英語語音詞庫。",
    categories: ["化學", "元素共鳴"],
    estimatedTime: "10 分鐘",
    reward: { xp: 55, coins: 25 },
    unlocked: true,
  },
  {
    id: "medical-basics",
    title: "健康醫學與生命守護",
    icon: "🏥",
    difficulty: "中級",
    description: "學習人體生理與日常保健知識，提升水系與光系精靈的治癒共鳴。",
    categories: ["醫學", "生命科學"],
    estimatedTime: "15 分鐘",
    reward: { xp: 80, coins: 40 },
    unlocked: true,
  },
  {
    id: "mathematics-fundamentals",
    title: "邏輯數學與對戰策略",
    icon: "🧮",
    difficulty: "初級",
    description: "訓練邏輯推演與心算速度，強化精靈在對戰中的反應力與專注力。",
    categories: ["數學", "邏輯思維"],
    estimatedTime: "10 分鐘",
    reward: { xp: 50, coins: 25 },
    unlocked: true,
  },
];

export default function Academy() {
  const [courses, setCourses] = useState<any[]>(FALLBACK_COURSES);
  const [loading, setLoading] = useState(true);
  const [practiceInput, setPracticeInput] = useState("你好！我們一起練習英文發音吧！");
  const [englishOutput, setEnglishOutput] = useState("Hello! Let's practice English pronunciation together!");
  const [bondPoints, setBondPoints] = useState(35);
  const { speak, isSpeaking } = useVoiceOutput({ lang: "en-US" });

  useEffect(() => {
    loadAcademyData();
  }, []);

  const loadAcademyData = async () => {
    try {
      const response = await fetch("/api/academy/courses", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("nightasaur_token")}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data?.courses) && data.courses.length > 0) {
          const normalized = data.courses.map((c: any, idx: number) => ({
            ...FALLBACK_COURSES[idx % FALLBACK_COURSES.length],
            ...c,
            description: c.description || FALLBACK_COURSES[idx % FALLBACK_COURSES.length].description,
            categories: Array.isArray(c.categories) ? c.categories : FALLBACK_COURSES[idx % FALLBACK_COURSES.length].categories,
            estimatedTime: c.estimatedTime || "10 分鐘",
            reward: c.reward && typeof c.reward.xp === "number" ? c.reward : { xp: 50, coins: 25 },
            unlocked: c.unlocked ?? true,
          }));
          setCourses(normalized);
        }
      }
    } catch (error) {
      console.error("加載學院數據失敗，使用預設課程:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVoicePractice = async (text: string) => {
    setPracticeInput(text);
    const en = await translateToEnglishLocal(text);
    setEnglishOutput(en);
    setBondPoints((prev) => Math.min(100, prev + 5));
    speak(en);
  };

  const startCourse = async (courseId: string) => {
    try {
      const response = await fetch(`/api/academy/courses/${courseId}/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("nightasaur_token")}`,
        },
        body: JSON.stringify({ spiritId: null }),
      });

      if (response.ok) {
        const data = await response.json();
        window.location.href = `/academy/learn/${data.sessionId}`;
      } else {
        handleVoicePractice("Let's start this lesson together and level up our spirit!");
      }
    } catch (error) {
      console.error("開始課程失敗:", error);
      handleVoicePractice("Let's start this lesson together and level up our spirit!");
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
          <p className="mt-4 text-white/50">加載學院數據中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-black mb-2">🦉 夜龍學院 · 語音與伴隨親密實驗室</h1>
        <p className="text-white/60">透過雙語語音對話與學科挑戰，提升精靈親密度與全英語發音能力！</p>
      </div>

      {/* 🎙️ 雙語語音與中翻英發音實驗室 */}
      <div className="glass-card p-6 mb-8 border border-teal-400/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold text-teal-300">🎤 精靈全英文發音 & 語音互動練習室</h2>
            <p className="text-sm text-white/60 mt-1">
              輸入或用麥克風說出中文/英文，精靈會自動將中文翻譯為英文並以純英語語音朗讀！
            </p>
          </div>
          <div className="px-4 py-2 rounded-2xl bg-teal-500/20 border border-teal-400/40 text-teal-200 text-sm font-bold">
            💖 伴隨親密度：{bondPoints}%
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          <VoiceChat onSendText={handleVoicePractice} lang="zh-TW" />
          <input
            type="text"
            value={practiceInput}
            onChange={(e) => setPracticeInput(e.target.value)}
            placeholder="輸入中文或英文句子，測試精靈全英文發聲..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white outline-none"
          />
          <button
            onClick={() => handleVoicePractice(practiceInput)}
            className="btn-primary px-6 py-2.5 rounded-xl font-bold"
          >
            {isSpeaking ? "🔊 英語朗讀中..." : "🔊 翻譯並英語發聲"}
          </button>
        </div>

        {englishOutput && (
          <div className="mt-4 p-4 rounded-xl bg-slate-900/70 border border-cyan-400/30 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs text-white/40 mb-1">🇬🇧 精靈英語發音字幕 (English Voice Output)</div>
              <div className="text-cyan-300 font-semibold">{englishOutput}</div>
            </div>
            <button
              onClick={() => speak(englishOutput)}
              className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 text-xs font-bold shrink-0"
            >
              🔊 重播英語
            </button>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div key={course.id} className="glass-card p-6 hover:scale-[1.02] transition-transform">
            <div className="flex items-start justify-between mb-4">
              <div className="text-4xl">{course.icon || "📚"}</div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                course.difficulty === "初級" ? "bg-green-500/20 text-green-300" :
                course.difficulty === "中級" ? "bg-yellow-500/20 text-yellow-300" :
                "bg-red-500/20 text-red-300"
              }`}>
                {course.difficulty || "初級"}
              </span>
            </div>

            <h3 className="text-xl font-bold mb-2">{course.title}</h3>
            <p className="text-white/60 text-sm mb-4">{course.description || "與精靈一起完成互動學習挑戰！"}</p>

            <div className="space-y-2 mb-6">
              <div className="flex items-center text-sm text-white/50">
                <span className="w-20">分類:</span>
                <span className="text-white/80">
                  {Array.isArray(course.categories) ? course.categories.join(", ") : "綜合訓練"}
                </span>
              </div>
              <div className="flex items-center text-sm text-white/50">
                <span className="w-20">時間:</span>
                <span className="text-white/80">{course.estimatedTime || "10 分鐘"}</span>
              </div>
              <div className="flex items-center text-sm text-white/50">
                <span className="w-20">獎勵:</span>
                <span className="text-white/80">
                  🎯 {course.reward?.xp ?? 50} XP • 🪙 {course.reward?.coins ?? 25} 金幣
                </span>
              </div>
            </div>

            <button
              onClick={() => (course.unlocked ?? true) && startCourse(course.id)}
              disabled={!(course.unlocked ?? true)}
              className={`w-full py-3 rounded-xl font-medium transition-colors ${
                (course.unlocked ?? true)
                  ? "btn-primary bg-gradient-to-r from-teal-500 to-blue-500"
                  : "bg-white/10 text-white/30 cursor-not-allowed"
              }`}
            >
              {(course.unlocked ?? true) ? "開始學習 🚀" : "🔒 尚未解鎖"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
