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
// VoiceChat - 語音輸入按鍵組件（支援即時落字 interimResults 與防丟字保護）
// ============================================
export default function VoiceChat({
  onSendText,
  onSpeechResult,
  onInterimChange,
  lang = "zh-TW",
}: {
  onSendText: (text: string) => void;
  onSpeechResult?: (text: string) => void;
  onInterimChange?: (text: string) => void;
  lang?: string;
}) {
  const [isListening, setIsListening] = useState(false);
  const [currentLang, setCurrentLang] = useState(lang);
  const [livePreview, setLivePreview] = useState("");
  const recognitionRef = useRef<any>(null);
  const transcriptBufferRef = useRef<string>("");
  const submittedRef = useRef<boolean>(false);

  useEffect(() => {
    setCurrentLang(lang);
  }, [lang]);

  const finalizeAndSend = useCallback((textToSend: string) => {
    const finalClean = textToSend.trim();
    if (!finalClean || submittedRef.current) return;
    submittedRef.current = true;
    setLivePreview("");
    onInterimChange?.("");
    onSendText(finalClean);
    onSpeechResult?.(finalClean);
  }, [onSendText, onSpeechResult, onInterimChange]);

  const startListening = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("您的瀏覽器不支援麥克風語音輸入，請使用 Chrome 或 Edge 瀏覽器。");
      return;
    }

    try {
      recognitionRef.current?.abort();
    } catch {}

    const rec = new SpeechRecognition();
    rec.lang = currentLang;
    rec.continuous = false;
    rec.interimResults = true; // 開啟即時聽寫，邊講邊顯示
    rec.maxAlternatives = 1;

    transcriptBufferRef.current = "";
    submittedRef.current = false;

    rec.onstart = () => {
      setIsListening(true);
      setLivePreview("請開始說話…");
    };

    rec.onresult = (e: any) => {
      let fullText = "";
      let isFinal = false;
      for (let i = 0; i < e.results.length; i++) {
        fullText += e.results[i][0].transcript;
        if (e.results[i].isFinal) isFinal = true;
      }
      transcriptBufferRef.current = fullText;
      setLivePreview(fullText);
      onInterimChange?.(fullText);

      if (isFinal && fullText.trim()) {
        setIsListening(false);
        finalizeAndSend(fullText);
      }
    };

    rec.onerror = (err: any) => {
      console.warn("[VoiceChat] speech recognition warning:", err?.error);
      setIsListening(false);
      setLivePreview("");
      if (transcriptBufferRef.current.trim()) {
        finalizeAndSend(transcriptBufferRef.current);
      }
    };

    rec.onend = () => {
      setIsListening(false);
      setLivePreview("");
      // 若使用者說話後手動點擊停止或自動結束，確保已辨識的緩衝文字 100% 送出不丟失
      if (transcriptBufferRef.current.trim() && !submittedRef.current) {
        finalizeAndSend(transcriptBufferRef.current);
      }
    };

    try {
      rec.start();
      recognitionRef.current = rec;
    } catch (e) {
      console.error("[VoiceChat] start error:", e);
      setIsListening(false);
    }
  }, [currentLang, finalizeAndSend, onInterimChange]);

  const stopListening = () => {
    try {
      recognitionRef.current?.stop();
    } catch {}
    setIsListening(false);
    if (transcriptBufferRef.current.trim() && !submittedRef.current) {
      finalizeAndSend(transcriptBufferRef.current);
    }
  };

  const toggleLang = () => {
    if (isListening) return;
    setCurrentLang((prev) => (prev === "zh-TW" ? "en-US" : "zh-TW"));
  };

  return (
    <div className="flex gap-1.5 items-center relative">
      <button
        type="button"
        onClick={isListening ? stopListening : startListening}
        className={`h-10 px-3 rounded-full flex items-center justify-center gap-1.5 text-sm font-bold transition-all ${
          isListening
            ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/50"
            : "bg-teal-500/30 hover:bg-teal-500/50 text-teal-100 border border-teal-400/40 shadow-md shadow-teal-500/10"
        }`}
        title={isListening ? "點擊完成並送出語音" : "點擊開始語音輸入"}
      >
        <span className="text-base">{isListening ? "🔴" : "🎤"}</span>
        <span className="hidden sm:inline">{isListening ? "完成送出" : "語音"}</span>
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
      {isListening && livePreview && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-slate-900/95 border border-teal-400/50 text-teal-200 text-sm font-bold shadow-xl">
          🎙️ 聽寫中：{livePreview}
        </div>
      )}
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
      const englishText = await translateChineseToEnglish(rawText);
      const targetLang = config?.lang?.startsWith("en") ? config.lang : "en-US";

      if ("speechSynthesis" in window && window.speechSynthesis.getVoices().some(v => v.lang.startsWith("en"))) {
        speakWithBrowserEnglish(englishText, targetLang);
        return;
      }

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
