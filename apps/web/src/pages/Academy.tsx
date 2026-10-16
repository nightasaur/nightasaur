import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SpiritWorldShell from "../components/SpiritWorldShell";
import VoiceChat, { useVoiceOutput, translateChineseToEnglish } from "../components/VoiceChat";

const DEFAULT_COURSES = [
  {
    id: "ielts-speaking-lab",
    title: "精靈雙語口語與雅思實戰",
    description: "透過麥克風與伴隨精靈進行中英雙語對話，即時翻譯並聆聽純正英語發音",
    icon: "🎙️🌍",
    difficulty: "初級",
    estimatedTime: "15分鐘",
    categories: ["IELTS", "SPEAKING", "VOICE"],
    reward: { xp: 100, coins: 50 },
    unlocked: true,
    route: "/academy/category/ielts",
  },
  {
    id: "literature-basics",
    title: "雙語文學與故事閱讀",
    description: "探索夜幕王國傳說與世界文學經典，培養英語語感與詞彙量",
    icon: "📚✨",
    difficulty: "初級",
    estimatedTime: "20分鐘",
    categories: ["LITERATURE", "ENGLISH"],
    reward: { xp: 80, coins: 40 },
    unlocked: true,
  },
  {
    id: "physics-foundation",
    title: "十全元素與自然物理學",
    description: "解析雷、火、水、冰、光、暗等元素背後的物理能量與戰鬥相剋法則",
    icon: "⚡⚛️",
    difficulty: "初級",
    estimatedTime: "25分鐘",
    categories: ["PHYSICS", "ELEMENT"],
    reward: { xp: 80, coins: 40 },
    unlocked: true,
  },
  {
    id: "chemistry-intro",
    title: "精靈演化與鍊金化學",
    description: "了解精靈孵化、進化階段與記憶結晶提煉的分子奧秘",
    icon: "🧪🥚",
    difficulty: "中級",
    estimatedTime: "30分鐘",
    categories: ["CHEMISTRY", "SPIRIT"],
    reward: { xp: 90, coins: 45 },
    unlocked: true,
  },
  {
    id: "medical-basics",
    title: "生命治癒與伴隨羈絆學",
    description: "掌握水系與木系精靈的治癒頻率、情緒識別與親密度提升技巧",
    icon: "💖🌿",
    difficulty: "初級",
    estimatedTime: "20分鐘",
    categories: ["MEDICINE", "BOND"],
    reward: { xp: 75, coins: 35 },
    unlocked: true,
  },
  {
    id: "mathematics-fundamentals",
    title: "戰鬥傷害倍率與邏輯數學",
    description: "計算爆擊期望值、屬性克制加成與 QLoRA 矩陣秩次推理",
    icon: "🧮🧠",
    difficulty: "中級",
    estimatedTime: "30分鐘",
    categories: ["MATHEMATICS", "LOGIC"],
    reward: { xp: 100, coins: 50 },
    unlocked: true,
  },
];

const SPIRIT_VOICE_SAMPLES = [
  {
    name: "雷霆幼龍 (Thunder Drake)",
    element: "THUNDER",
    zh: "雷霆萬鈞，聽從我的號令，與指揮官並肩作戰！",
    en: "Thunderous wrath, heed my command and fight alongside the Commander!",
    badge: "⚡ 雷系 · 高頻迅猛",
  },
  {
    name: "滄海靈鯤 (Ocean Leviathan)",
    element: "WATER",
    zh: "如海般包容，如水般流轉，用英語傾聽世界的心聲。",
    en: "As vast as the ocean and fluid as water, listening to the voice of the world in English.",
    badge: "💧 水系 · 溫潤治癒",
  },
  {
    name: "熾火鳳凰 (Flame Phoenix)",
    element: "FIRE",
    zh: "每一次開口練習，都是點燃靈魂覺醒的熾熱火花！",
    en: "Every spoken word of practice is a blazing spark that awakens your soul!",
    badge: "🔥 火系 · 熱血激昂",
  },
];

export default function Academy() {
  const [courses, setCourses] = useState<any[]>(DEFAULT_COURSES);
  const [loading, setLoading] = useState(true);
  const [userSpeech, setUserSpeech] = useState("你好精靈，今天我們一起練習英文對話吧！");
  const [translatedEn, setTranslatedEn] = useState("Hello Spirit, let us practice English conversation together today!");
  const [translating, setTranslating] = useState(false);

  const { speak, isSpeaking } = useVoiceOutput({ lang: "en-US" });

  useEffect(() => {
    loadAcademyData();
  }, []);

  const loadAcademyData = async () => {
    try {
      const token = localStorage.getItem("nightasaur_token");
      const response = await fetch("/api/academy/courses", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data?.courses) && data.courses.length > 0) {
          // 補齊後端可能省略的欄位，徹底防止 undefined.join 或 undefined.xp 崩潰
          const normalized = data.courses.map((c: any, idx: number) => {
            const fallback = DEFAULT_COURSES[idx % DEFAULT_COURSES.length];
            return {
              ...fallback,
              ...c,
              description: c.description || fallback.description,
              estimatedTime: c.estimatedTime || fallback.estimatedTime,
              categories: Array.isArray(c.categories) && c.categories.length > 0 ? c.categories : fallback.categories,
              reward: {
                xp: c.reward?.xp ?? fallback.reward.xp,
                coins: c.reward?.coins ?? fallback.reward.coins,
              },
              unlocked: c.unlocked ?? true,
            };
          });
          setCourses(normalized);
        }
      }
    } catch (error) {
      console.warn("使用內建學院課程清單:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVoicePractice = async (text: string) => {
    const clean = text.trim();
    if (!clean) return;
    setUserSpeech(clean);
    setTranslating(true);
    try {
      const en = await translateChineseToEnglish(clean);
      setTranslatedEn(en);
      speak(en);
    } finally {
      setTranslating(false);
    }
  };

  const startCourse = async (course: any) => {
    if (course.route) {
      window.location.href = course.route;
      return;
    }
    try {
      const token = localStorage.getItem("nightasaur_token");
      const response = await fetch(`/api/academy/courses/${course.id}/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ spiritId: null }),
      });

      if (response.ok) {
        const data = await response.json();
        window.location.href = `/academy/learn/${data.sessionId}`;
      } else {
        window.location.href = "/academy/category/ielts";
      }
    } catch {
      window.location.href = "/academy/category/ielts";
    }
  };

  return (
    <SpiritWorldShell
      background="gradient"
      onSend={handleVoicePractice}
      beforeInput={<VoiceChat onSendText={handleVoicePractice} lang="zh-TW" />}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 text-white">
        {/* 頂部標題與導航 */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/40 text-teal-200 text-xs font-bold mb-2">
              🎙️ 語言能力核心 · 雙向語音與伴隨羈絆實驗室
            </div>
            <h1 className="text-3xl sm:text-4xl font-black">🦉 夜幕精靈學習中心 (Learning Academy)</h1>
            <p className="text-white/60 text-sm sm:text-base mt-1">
              以雙語口語能力為核心：對精靈說中文或英文，即時翻譯為道地英語並由精靈以純英文語音朗讀互動！
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/academy/category/ielts"
              className="px-4 py-2.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 text-sm font-bold transition"
            >
              🎓 IELTS 英語專區
            </Link>
            <Link
              to="/spirits"
              className="px-4 py-2.5 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-sm font-black transition"
            >
              🔮 前往精靈大廳實戰
            </Link>
          </div>
        </div>

        {/* 核心模組一：雙向語音與伴隨羈絆實驗室 (STT + 中翻英 + 英語 TTS) */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <div className="glass-card p-6 border border-teal-400/30 bg-slate-900/70 rounded-3xl">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-extrabold flex items-center gap-2">
                <span>🎤</span> 雙向語音中翻英即時實驗室
              </h2>
              {isSpeaking && (
                <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-bold animate-pulse">
                  🔊 英語發聲中…
                </span>
              )}
            </div>
            <p className="text-white/60 text-xs sm:text-sm mb-4">
              點擊下方語音按鈕或底部輸入框說話，系統自動將中文轉譯為英文並以純英語音訊輸出：
            </p>

            <div className="bg-black/40 border border-white/10 rounded-2xl p-4 mb-4 space-y-3">
              <div>
                <div className="text-xs text-white/40 mb-1">💬 您的輸入 / 精靈中文原話：</div>
                <div className="text-sm sm:text-base font-medium text-white/90">{userSpeech}</div>
              </div>
              <div className="pt-3 border-t border-white/10">
                <div className="text-xs text-amber-300/80 mb-1">🇬🇧 自動英文翻譯與英語語音輸出 (English Audio Output)：</div>
                <div className="text-base sm:text-lg font-bold text-amber-200 italic">
                  {translating ? "Translating to English..." : `"${translatedEn}"`}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <VoiceChat onSendText={handleVoicePractice} lang="zh-TW" />
              <button
                onClick={() => speak(translatedEn)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-sm hover:opacity-95 transition"
              >
                🔊 播放英文音訊 (Speak English)
              </button>
            </div>
          </div>

          {/* 核心模組二：精靈聲線示範與好感度羈絆指引 */}
          <div className="glass-card p-6 border border-purple-400/30 bg-slate-900/70 rounded-3xl">
            <h2 className="text-xl font-extrabold mb-3 flex items-center gap-2">
              <span>💖</span> 伴隨精靈英語聲線與好感度指引
            </h2>
            <div className="space-y-2.5 mb-4">
              {SPIRIT_VOICE_SAMPLES.map((sp, i) => (
                <div
                  key={i}
                  className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{sp.name}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300">
                        {sp.badge}
                      </span>
                    </div>
                    <div className="text-xs text-white/60 truncate mt-0.5">{sp.zh}</div>
                    <div className="text-xs text-amber-300 italic truncate">🇬🇧 "{sp.en}"</div>
                  </div>
                  <button
                    onClick={() => {
                      setUserSpeech(sp.zh);
                      setTranslatedEn(sp.en);
                      speak(sp.en);
                    }}
                    className="shrink-0 px-3 py-1.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/40 border border-teal-400/40 text-teal-200 text-xs font-bold transition"
                  >
                    🔊 試聽英語
                  </button>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                <div className="font-black text-teal-300">Lv.1 初識</div>
                <div className="text-white/50 mt-0.5">解鎖中英雙語字幕</div>
              </div>
              <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                <div className="font-black text-amber-300">Lv.5 心意相通</div>
                <div className="text-white/50 mt-0.5">口語練習親密 +25</div>
              </div>
              <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                <div className="font-black text-rose-300">Lv.10 魂契覺醒</div>
                <div className="text-white/50 mt-0.5">全服出戰屬性 +15%</div>
              </div>
            </div>
          </div>
        </div>

        {/* 核心模組三：學院課程與能力檢定 */}
        <h2 className="text-2xl font-black mb-4">📚 主題修煉課程</h2>
        {loading ? (
          <div className="text-center py-8 text-white/50">載入課程中…</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => {
              const cats = Array.isArray(course.categories) ? course.categories : ["SPIRIT", "LEARNING"];
              const xp = course.reward?.xp ?? 80;
              const coins = course.reward?.coins ?? 40;
              return (
                <div key={course.id} className="glass-card p-6 rounded-3xl bg-slate-900/60 border border-white/10 hover:border-teal-400/40 transition">
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-4xl">{course.icon || "📘"}</div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      course.difficulty === "初級" ? "bg-green-500/20 text-green-300" :
                      course.difficulty === "中級" ? "bg-yellow-500/20 text-yellow-300" :
                      "bg-red-500/20 text-red-300"
                    }`}>
                      {course.difficulty || "初級"}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold mb-2">{course.title}</h3>
                  <p className="text-white/60 text-sm mb-4">{course.description || "完成課程測驗以提升精靈親密度與英語戰力"}</p>

                  <div className="space-y-1.5 mb-5 text-xs">
                    <div className="flex items-center text-white/50">
                      <span className="w-16">分類:</span>
                      <span className="text-white/80 font-medium">{cats.join(", ")}</span>
                    </div>
                    <div className="flex items-center text-white/50">
                      <span className="w-16">時間:</span>
                      <span className="text-white/80">{course.estimatedTime || "20分鐘"}</span>
                    </div>
                    <div className="flex items-center text-white/50">
                      <span className="w-16">獎勵:</span>
                      <span className="text-amber-300 font-bold">
                        🎯 {xp} XP • 🪙 {coins} 金幣
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => startCourse(course)}
                    className="w-full py-3 rounded-2xl font-bold text-sm bg-gradient-to-r from-teal-500 to-blue-500 hover:opacity-95 text-white transition"
                  >
                    開始修煉 🚀
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SpiritWorldShell>
  );
}
