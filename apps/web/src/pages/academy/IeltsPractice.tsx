import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SPIRIT_CHARACTERS, type SpiritCharacter } from "../../config/spirits";

type Feedback = {
  grammar?: string;
  vocabulary?: string;
  score?: number;
  correctedText?: string;
  truthScore?: number;
};

type Message = {
  role: "user" | "spirit";
  text: string;
  feedback?: Feedback;
};

const TOPICS = [
  { id: "daily-coffee", name: "Ordering Coffee", zh: "點咖啡" },
  { id: "daily-directions", name: "Asking Directions", zh: "問路" },
  { id: "daily-smalltalk", name: "Small Talk", zh: "閒聊" },
  { id: "work-interview", name: "Job Interview", zh: "工作面試" },
  { id: "work-meeting", name: "Office Meeting", zh: "開會" },
  { id: "travel-airport", name: "Airport Check-in", zh: "機場報到" },
  { id: "travel-hotel", name: "Hotel Booking", zh: "訂房" },
  { id: "ielts-part1", name: "IELTS Speaking Part 1", zh: "雅思考試 Part 1" },
];

export default function IeltsPractice() {
  const navigate = useNavigate();
  const [spirit, setSpirit] = useState<SpiritCharacter | null>(null);
  const [topic, setTopic] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("nightasaur_token") : null;
  const base = import.meta.env.VITE_API_URL || "http://localhost:3002/api";

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !spirit || !topic || loading) return;
    const userText = input.trim();
    setMessages((p) => [...p, { role: "user", text: userText }]);
    setInput("");
    setLoading(true);
    setIsSpeaking(true);

    try {
      const res = await fetch(`${base}/english-training/conversation/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          spiritId: spirit.id,
          spiritName: spirit.name,
          spiritElement: spirit.element,
          spiritPersonality: spirit.personality,
          topicId: topic,
          message: userText,
          userLocale: "zh-TW",
        }),
      });
      const data = await res.json();
      if (data.response) {
        setMessages((p) => [
          ...p,
          {
            role: "spirit",
            text: data.response,
            feedback: data.feedback,
          },
        ]);
      } else {
        setMessages((p) => [...p, { role: "spirit", text: "(No response)" }]);
      }
    } catch (e: any) {
      setMessages((p) => [...p, { role: "spirit", text: "Connection failed: " + e.message }]);
    } finally {
      setLoading(false);
      setTimeout(() => setIsSpeaking(false), 1500);
    }
  };

  // ===== 選精靈畫面 =====
  if (!spirit || !topic) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4 max-w-5xl mx-auto">
        <button
          onClick={() => navigate("/academy/category/ielts")}
          className="text-sm text-white/55 hover:text-white mb-6"
        >
          ← 回 IELTS 學習中心
        </button>
        <h1 className="text-3xl font-bold text-white mb-2">精靈英語練習</h1>
        <p className="text-white/50 mb-8">選一隻精靈陪你練英文</p>

        <h2 className="text-white font-medium mb-4">1. 選精靈</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {SPIRIT_CHARACTERS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSpirit(s)}
              className={`rounded-2xl p-4 bg-white/5 border transition-all ${
                spirit?.id === s.id ? "border-purple-400 ring-2 ring-purple-500/50" : "border-white/10 hover:border-white/30"
              }`}
            >
              <img src={s.image} alt={s.name} className="w-full aspect-square rounded-xl mb-3 object-cover" />
              <div className="text-white font-medium text-sm">{s.name}</div>
              <div className="text-xs text-white/50">{s.elementZh}屬性</div>
            </button>
          ))}
        </div>

        <h2 className="text-white font-medium mb-4">2. 選主題</h2>
        <div className="grid sm:grid-cols-2 gap-3 mb-8">
          {TOPICS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTopic(t.id)}
              className={`text-left rounded-xl p-4 bg-white/5 border transition-all ${
                topic === t.id ? "border-emerald-400 ring-2 ring-emerald-500/50" : "border-white/10 hover:border-white/30"
              }`}
            >
              <div className="text-white font-medium">{t.name}</div>
              <div className="text-white/50 text-sm">{t.zh}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ===== 對話畫面 =====
  return (
    <div className="min-h-screen pt-24 pb-12 px-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => { setSpirit(null); setTopic(""); setMessages([]); }}
          className="text-sm text-white/55 hover:text-white"
        >
          ← 重選精靈 / 主題
        </button>
        <div className="text-sm text-white/50">主題：{topic}</div>
      </div>

      <div className="flex flex-col items-center mb-6">
        <div className="relative">
          <div
            className="absolute inset-0 rounded-full blur-2xl transition-opacity"
            style={{ background: spirit.color, opacity: isSpeaking ? 0.4 : 0.15 }}
          />
          <img
            src={spirit.image}
            alt={spirit.name}
            className={`relative w-48 h-48 rounded-full object-cover transition-all duration-300 ${
              isSpeaking ? "animate-bounce scale-110" : "scale-100"
            }`}
            style={{ filter: isSpeaking ? `drop-shadow(0 0 20px ${spirit.color})` : "none" }}
          />
        </div>
        <div className="mt-3 text-white font-bold text-xl">{spirit.name}</div>
        <div className="text-sm text-white/50">
          {isSpeaking ? "💬 說話中..." : "🎧 傾聽中..."}
        </div>
      </div>

      <div className="bg-white/5 rounded-2xl p-5 mb-5 h-96 overflow-y-auto">
        {messages.length === 0 && (
          <div className="text-white/40 text-center py-12">
            開始跟 {spirit.name} 練習英文吧！
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`mb-4 ${m.role === "user" ? "text-right" : "text-left"}`}>
            <div
              className={`inline-block max-w-[80%] rounded-2xl px-4 py-2 ${
                m.role === "user" ? "bg-purple-600 text-white" : "bg-white/10 text-white/90"
              }`}
            >
              {m.text}
            </div>
            {m.feedback && (
              <div className="mt-2 text-xs text-white/60 space-y-1 max-w-[80%] inline-block text-left">
                {m.feedback.grammar && <div>📝 {m.feedback.grammar}</div>}
                {m.feedback.vocabulary && <div>💡 {m.feedback.vocabulary}</div>}
                {m.feedback.score !== undefined && <div>⭐ 分數：{m.feedback.score}/100</div>}
              </div>
            )}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type in English..."
          className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
          disabled={loading}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium disabled:opacity-50"
        >
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}