import { useState, useRef, useCallback, useEffect } from "react";

// ============================================
// 中翻英即時翻譯工具 (將精靈所有中文輸出轉為英文)
// ============================================
const PRESET_EN_MAP: Record<string, string> = {
  "（精靈沉默不語）": "The spirit listens quietly in silence.",
  "進化成功！🎉": "Evolution complete! Congratulations!",
  "進化成功！": "Evolution complete!",
  "進化失敗": "Evolution failed. Let us try again later.",
  "感應中斷了🦕": "Connection interrupted. Please try again.",
  "連線中斷，請稍後重試 🦕": "Connection failed. Please retry shortly.",
};

export async function translateChineseToEnglish(text: string): Promise<string> {
  const clean = (text || "").trim();
  if (!clean) return "";
  if (PRESET_EN_MAP[clean]) return PRESET_EN_MAP[clean];

  // 若已經不含中文字元，直接回傳英文原文
  if (!/[\u4e00-\u9fff]/.test(clean)) {
    return clean;
  }

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(clean)}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translated = data[0].map((item: any) => item?.[0] || "").join(" ").trim();
        if (translated) return translated;
      }
    }
  } catch (err) {
    console.warn("[Translate] fallback to local phrasing:", err);
  }

  return clean;
}

// ============================================
// VoiceChat - 語音輸入按鍵組件（Web Speech API）
// ============================================
export default function VoiceChat({
  onSendText,
  onSpeechResult,
  lang = "zh-TW",
}: {
  onSendText: (text: string) => void;
  onSpeechResult?: (text: string) => void;
  lang?: string;
}) {
  const [isListening, setIsListening] = useState(false);
  const [currentLang, setCurrentLang] = useState(lang);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    setCurrentLang(lang);
  }, [lang]);

  const startListening = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("您的瀏覽器不支援語音輸入，請使用 Chrome 或 Edge 瀏覽器。");
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang = currentLang;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      setIsListening(false);
      onSendText(text);
      onSpeechResult?.(text);
    };
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);
    rec.start();
    setIsListening(true);
    recognitionRef.current = rec;
  }, [onSendText, onSpeechResult, currentLang]);

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const toggleLang = () => {
    if (isListening) return;
    setCurrentLang((prev) => (prev === "zh-TW" ? "en-US" : "zh-TW"));
  };

  return (
    <div className="flex gap-1.5 items-center">
      <button
        type="button"
        onClick={isListening ? stopListening : startListening}
        className={`h-10 px-3 rounded-full flex items-center justify-center gap-1.5 text-sm font-bold transition-all ${
          isListening
            ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/50"
            : "bg-teal-500/30 hover:bg-teal-500/50 text-teal-100 border border-teal-400/40 shadow-md shadow-teal-500/10"
        }`}
        title={isListening ? "停止語音輸入" : "點擊與精靈語音聊天"}
      >
        <span className="text-base">{isListening ? "🔴" : "🎤"}</span>
        <span className="hidden sm:inline">{isListening ? "聆聽中" : "語音"}</span>
      </button>
      <button
        type="button"
        onClick={toggleLang}
        disabled={isListening}
        className="px-2 h-8 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 text-white/80 border border-white/20 disabled:opacity-40"
        title="切換麥克風辨識語言 (中文 / 英文)"
      >
        {currentLang === "zh-TW" ? "中" : "EN"}
      </button>
    </div>
  );
}

export { VoiceChat };

// ============================================
// useVoiceOutput - 強制將精靈中文輸出翻譯為英文並輸出英文音訊
// ============================================
export interface VoiceConfig {
  pitch?: number;
  rate?: number;
  lang?: string;
}

export function useVoiceOutput(config?: VoiceConfig) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const [ttsEnabled, setTtsEnabled] = useState(true);

  const cleanup = useCallback(() => {
    if (audioRef.current) {
      try { audioRef.current.pause(); } catch {}
      audioRef.current = null;
    }
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  // 使用瀏覽器高自然度英文 TTS 朗讀
  const speakWithBrowserEnglish = useCallback((englishText: string, lang = "en-US") => {
    if (!("speechSynthesis" in window)) {
      setIsSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(englishText);
    const targetLang = lang.startsWith("en") ? lang : "en-US";
    u.lang = targetLang;
    u.rate = config?.rate ?? 0.95;
    u.pitch = config?.pitch ?? 1.05;

    const voices = window.speechSynthesis.getVoices();
    const enVoice =
      voices.find((v) => v.lang.startsWith("en") && (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Aria") || v.name.includes("Zira"))) ||
      voices.find((v) => v.lang === targetLang) ||
      voices.find((v) => v.lang.startsWith("en"));
    if (enVoice) u.voice = enVoice;

    u.onstart = () => setIsSpeaking(true);
    u.onend = () => setIsSpeaking(false);
    u.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(u);
  }, [config?.rate, config?.pitch]);

  const speak = useCallback(async (rawText: string) => {
    if (!rawText || !ttsEnabled) return;

    cleanup();
    setIsSpeaking(true);

    try {
      // 1. 將所有精靈輸出的中文內容翻譯為英文
      const englishText = await translateChineseToEnglish(rawText);
      const targetLang = config?.lang?.startsWith("en") ? config.lang : "en-US";

      // 2. 優先使用高自然度英文語音輸出
      if ("speechSynthesis" in window && window.speechSynthesis.getVoices().some(v => v.lang.startsWith("en"))) {
        speakWithBrowserEnglish(englishText, targetLang);
        return;
      }

      // 3. 備援：呼叫後端或本機 3070 Piper 英文語音合成
      const token = localStorage.getItem("nightasaur_token");
      const base = import.meta.env.VITE_API_URL || "/api";

      const response = await fetch(`${base}/tts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text: englishText, lang: "en-US" }),
      });

      if (response.ok) {
        const contentType = response.headers.get("Content-Type") || "";
        if (contentType.includes("application/json")) {
          const data = await response.json();
          speakWithBrowserEnglish(data.text || englishText, "en-US");
          return;
        }
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        urlRef.current = url;
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => { setIsSpeaking(false); cleanup(); };
        audio.onerror = () => { setIsSpeaking(false); cleanup(); };
        await audio.play();
        return;
      }

      speakWithBrowserEnglish(englishText, targetLang);
    } catch (err) {
      console.warn("[TTS] fallback to English browser TTS:", err);
      const englishText = await translateChineseToEnglish(rawText);
      speakWithBrowserEnglish(englishText, "en-US");
    }
  }, [config?.lang, ttsEnabled, cleanup, speakWithBrowserEnglish]);

  const stopSpeaking = useCallback(() => {
    cleanup();
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, [cleanup]);

  return { speak, stopSpeaking, isSpeaking, ttsEnabled, setTtsEnabled, translateChineseToEnglish };
}
