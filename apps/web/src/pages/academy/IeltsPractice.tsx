import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SPIRIT_CHARACTERS, type SpiritCharacter } from "../../config/spirits";

type Feedback = {
  grammar?: string;
  vocabulary?: string;
  score?: number;
  correctedText?: string;
  truthScore?: number;
  translation?: string;
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
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [ttsSupported, setTtsSupported] = useState(true);
  const [autoSpeak, setAutoSpeak] = useState(true);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const finalTextRef = useRef("");
  const autoSendRef = useRef(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("nightasaur_token") : null;
  const base = import.meta.env.VITE_API_URL || "http://localhost:3002/api";

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ===== 檢查瀏覽器支援 =====
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) setVoiceSupported(false);

    if (!("speechSynthesis" in window)) {
      setTtsSupported(false);
    }
  }, []);

  // ===== 精靈 TTS 朗讀 =====
  const speak = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // 挑選英文聲音（優先美式，其次英式，最後任意英文）
    const voices = window.speechSynthesis.getVoices();
    const enVoice =
      voices.find((v) => v.lang === "en-US" && v.localService) ||
      voices.find((v) => v.lang === "en-US") ||
      voices.find((v) => v.lang === "en-GB") ||
      voices.find((v) => v.lang.startsWith("en"));
    if (enVoice) utterance.voice = enVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  // 有新的精靈訊息 → 自動朗讀
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last && last.role === "spirit" && last.text && autoSpeak) {
      speak(last.text);
    }
  }, [messages]);

  // ===== 語音辨識 =====
  const startListening = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert("您的瀏覽器不支援語音輸入，請使用 Chrome 或 Edge");
      return;
    }

    // 停止 TTS 避免錄到精靈聲音
    stopSpeaking();

    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    finalTextRef.current = "";
    autoSendRef.current = false;
    setInterimText("");

    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }
      if (final) {
        finalTextRef.current += " " + final;
      }
      setInput((finalTextRef.current + " " + interim).trim());
      setInterimText(interim);

      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        const text = (finalTextRef.current + " " + interim).trim();
        if (text.length > 2 && !autoSendRef.current) {
          autoSendRef.current = true;
          stopListening();
          sendMessage(text);
        }
      }, 1500);
    };

    recognition.onerror = (event: any) => {
      console.warn("Speech error:", event.error);
      if (event.error === "not-allowed") {
        alert("請允許麥克風權限");
      }
      stopListening();
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  };

  const stopListening = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimText("");
  };

  const toggleMic = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // ===== 送出訊息 =====
  const sendMessage = async (text: string) => {
    if (!text.trim() || !spirit || !topic || loading) return;
    const userText = text.trim();
    setMessages((p) => [...p, { role: "user", text: userText }]);
    setInput("");
    setLoading(true);

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
            feedback: { ...data.feedback, translation: data.translation },
          },
        ]);
      } else {
        setMessages((p) => [...p, { role: "spirit", text: "(No response)" }]);
      }
    } catch (e: any) {
      setMessages((p) => [...p, { role: "spirit", text: "Connection failed: " + e.message }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => {
    sendMessage(input);
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
                spirit?.id === s.id
                  ? "border-purple-400 ring-2 ring-purple-500/50"
                  : "border-white/10 hover:border-white/30"
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
                topic === t.id
                  ? "border-emerald-400 ring-2 ring-emerald-500/50"
                  : "border-white/10 hover:border-white/30"
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
          onClick={() => {
            stopListening();
            stopSpeaking();
            setSpirit(null);
            setTopic("");
            setMessages([]);
          }}
          className="text-sm text-white/55 hover:text-white"
        >
          ← 重選精靈 / 主題
        </button>
        <div className="text-sm text-white/50">主題：{topic}</div>
      </div>

      {/* 精靈區 */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative">
          <div
            className="absolute inset-0 rounded-full blur-2xl transition-opacity"
            style={{ background: spirit.color, opacity: isSpeaking ? 0.5 : 0.15 }}
          />
          <img
            src={spirit.image}
            alt={spirit.name}
            className={`relative w-48 h-48 rounded-full object-cover transition-all duration-300 ${
              isSpeaking ? "animate-bounce scale-110" : "scale-100"
            }`}
            style={{ filter: isSpeaking ? `drop-shadow(0 0 25px ${spirit.color})` : "none" }}
          />
        </div>
        <div className="mt-3 text-white font-bold text-xl">{spirit.name}</div>
        <div className="text-sm text-white/50">
          {isSpeaking ? "🔊 說話中..." : isListening ? "🎤 正在聽你說..." : "🎧 傾聽中..."}
        </div>

        {/* 喇叭控制 */}
        {ttsSupported && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setAutoSpeak(!autoSpeak)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                autoSpeak
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40"
                  : "bg-white/10 text-white/50 border border-white/20"
              }`}
            >
              {autoSpeak ? "🔊 自動朗讀 ON" : "🔇 自動朗讀 OFF"}
            </button>
            {isSpeaking && (
              <button
                onClick={stopSpeaking}
                className="px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-300 border border-red-400/40"
              >
                ⏹ 停止
              </button>
            )}
          </div>
        )}
      </div>

      {/* 對話記錄 */}
      <div className="bg-white/5 rounded-2xl p-5 mb-5 h-96 overflow-y-auto">
        {messages.length === 0 && (
          <div className="text-white/40 text-center py-12">
            開始跟 {spirit.name} 練習英文吧！
            <br />
            <span className="text-xs mt-2 inline-block">
              💡 點麥克風說話，或直接打字
            </span>
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
            {m.role === "spirit" && ttsSupported && (
              <button
                onClick={() => speak(m.text)}
                title="重播精靈的英文"
                className="ml-2 text-xs text-white/40 hover:text-emerald-300 transition-colors align-middle"
              >
                🔊
              </button>
            )}
            {m.feedback && (
              <div className="mt-2 text-xs text-white/60 space-y-1 max-w-[80%] inline-block text-left">
                {m.feedback.translation && (
                  <div className="text-emerald-300">🌏 {m.feedback.translation}</div>
                )}
                {m.feedback.grammar && <div>📝 {m.feedback.grammar}</div>}
                {m.feedback.vocabulary && <div>💡 {m.feedback.vocabulary}</div>}
                {m.feedback.score !== undefined && <div>⭐ 分數：{m.feedback.score}/100</div>}
              </div>
            )}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* 輸入區 */}
      <div className="flex gap-2 items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder={isListening ? "🎤 Listening..." : "Type in English..."}
          className={`flex-1 px-4 py-3 rounded-xl bg-white/10 border text-white placeholder-white/40 focus:outline-none transition-colors ${
            isListening ? "border-red-400 ring-2 ring-red-500/50" : "border-white/10 focus:border-purple-500"
          }`}
          disabled={loading}
        />
        {voiceSupported && (
          <button
            onClick={toggleMic}
            disabled={loading}
            title={isListening ? "點擊停止錄音" : "點擊開始語音輸入"}
            className={`relative w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all disabled:opacity-50 ${
              isListening
                ? "bg-red-500 hover:bg-red-600 animate-pulse"
                : "bg-white/10 hover:bg-white/20 border border-white/20"
            }`}
          >
            {isListening ? "⏹" : "🎤"}
            {isListening && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full animate-ping" />
            )}
          </button>
        )}
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium disabled:opacity-50"
        >
          {loading ? "..." : "Send"}
        </button>
      </div>

      {isListening && (
        <div className="mt-3 text-center text-sm text-red-300 animate-pulse">
          🎤 正在辨識語音中... 停止說話 1.5 秒後自動送出
        </div>
      )}
      {isSpeaking && (
        <div className="mt-3 text-center text-sm text-emerald-300 animate-pulse">
          🔊 精靈正在朗讀英文...
        </div>
      )}
      {!voiceSupported && (
        <div className="mt-3 text-center text-xs text-yellow-300/70">
          您的瀏覽器不支援語音輸入，建議使用 Chrome 或 Edge
        </div>
      )}
    </div>
  );
}