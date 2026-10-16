import { useState, useRef, useCallback, useEffect } from "react";

// ============================================
// 中翻英免費即時翻譯輔助函式 (供精靈全英文發聲與雙語字幕使用)
// ============================================
const OFFLINE_ZH_EN_MAP: Array<[RegExp, string]> = [
  [/你好|嗨|哈囉|早安|午安|晚安/, "Hello my friend! I am right here with you."],
  [/感應中斷|連線中斷|失敗|錯誤/, "Connection interrupted, please try again shortly."],
  [/進化成功/, "Evolution succeeded! My power has grown stronger!"],
  [/開心|高興|快樂/, "I feel so happy and full of energy today!"],
  [/謝謝|感謝/, "You are very welcome! Let us keep learning together."],
  [/圖片|照片|看到|拍/, "What a wonderful picture! Let us explore this together."],
];

export function hasChinese(text: string): boolean {
  return /[\u4e00-\u9fff]/.test(text || "");
}

export async function translateChineseToEnglish(text: string): Promise<string> {
  const clean = (text || "").trim();
  if (!clean) return "";
  if (!hasChinese(clean)) return clean;

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-TW&tl=en&dt=t&q=${encodeURIComponent(clean)}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translated = data[0].map((part: any) => part?.[0] || "").join(" ").trim();
        if (translated) return translated;
      }
    }
  } catch {
    // ignore network failure and use fallback
  }

  for (const [pattern, en] of OFFLINE_ZH_EN_MAP) {
    if (pattern.test(clean)) return en;
  }
  return "Your spirit companion is cheering you on! Keep going!";
}

// ============================================
// VoiceChat - 語音輸入（Web Speech API 實時語音轉文字 STT）
// ============================================
export function VoiceChat({
  onSendText,
  onSpeechResult,
  onInterimChange,
  lang = "zh-TW",
  autoSend = true,
}: {
  onSendText: (text: string) => void;
  onSpeechResult?: (text: string) => void;
  onInterimChange?: (text: string) => void;
  lang?: string;
  autoSend?: boolean;
}) {
  const [isListening, setIsListening] = useState(false);
  const [currentLang, setCurrentLang] = useState(lang);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [micHint, setMicHint] = useState("");
  const recognitionRef = useRef<any>(null);
  const latestTranscriptRef = useRef<string>("");
  const hasSentRef = useRef<boolean>(false);

  useEffect(() => {
    setCurrentLang(lang);
  }, [lang]);

  const startListening = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicHint("瀏覽器不支援語音辨識 (建議使用 Chrome / Edge)");
      return;
    }

    try {
      recognitionRef.current?.abort?.();
    } catch {}

    setMicHint("");
    setLiveTranscript("");
    latestTranscriptRef.current = "";
    hasSentRef.current = false;

    const rec = new SpeechRecognition();
    rec.lang = currentLang;
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setIsListening(true);
      setMicHint(currentLang === "zh-TW" ? "請開始說話..." : "Listening...");
    };

    rec.onresult = (e: any) => {
      let interimText = "";
      let finalText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const piece = e.results[i][0]?.transcript || "";
        if (e.results[i].isFinal) {
          finalText += piece;
        } else {
          interimText += piece;
        }
      }

      const combined = (finalText || interimText).trim();
      if (combined) {
        latestTranscriptRef.current = combined;
        setLiveTranscript(combined);
        onInterimChange?.(combined);
      }

      if (finalText.trim() && !hasSentRef.current) {
        hasSentRef.current = true;
        const cleaned = finalText.trim();
        setIsListening(false);
        setLiveTranscript("");
        setMicHint("");
        onSpeechResult?.(cleaned);
        if (autoSend) {
          onSendText(cleaned);
        }
      }
    };

    rec.onerror = (e: any) => {
      setIsListening(false);
      if (e?.error === "not-allowed") {
        setMicHint("請允許麥克風權限 🎤");
      } else if (e?.error === "no-speech") {
        setMicHint("未偵測到語音，請再試一次");
      } else {
        setMicHint("");
      }
    };

    rec.onend = () => {
      setIsListening(false);
      // 若瀏覽器只回傳 interim 結果就結束，保底送出已辨識到的文字
      if (!hasSentRef.current && latestTranscriptRef.current.trim()) {
        hasSentRef.current = true;
        const fallbackText = latestTranscriptRef.current.trim();
        setLiveTranscript("");
        setMicHint("");
        onSpeechResult?.(fallbackText);
        if (autoSend) {
          onSendText(fallbackText);
        }
      }
    };

    try {
      rec.start();
      recognitionRef.current = rec;
    } catch {
      setIsListening(false);
    }
  }, [onSendText, onSpeechResult, onInterimChange, currentLang, autoSend]);

  const stopListening = () => {
    try {
      recognitionRef.current?.stop();
    } catch {}
    setIsListening(false);
  };

  const toggleLang = () => {
    if (isListening) return;
    setCurrentLang((prev) => (prev === "zh-TW" ? "en-US" : "zh-TW"));
  };

  return (
    <div className="flex gap-1.5 items-center flex-wrap">
      <button
        type="button"
        onClick={isListening ? stopListening : startListening}
        aria-label={isListening ? "停止語音輸入" : "語音輸入"}
        className={`px-3 h-10 rounded-2xl flex items-center justify-center gap-1.5 text-sm font-bold transition-all ${
          isListening
            ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/50"
            : "bg-teal-500/30 hover:bg-teal-500/50 text-teal-200 border border-teal-400/40"
        }`}
        title={isListening ? "點擊結束並送出語音" : "點擊開始語音輸入 (支援中/英)"}
      >
        <span>🎤</span>
        <span className="text-xs">{isListening ? "停止" : "語音"}</span>
      </button>
      <button
        type="button"
        onClick={toggleLang}
        disabled={isListening}
        className="px-2.5 h-10 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white/80 border border-white/20 disabled:opacity-40"
        title="切換語音辨識語言 (中文 / English)"
      >
        {currentLang === "zh-TW" ? "中" : "EN"}
      </button>
      {(isListening || liveTranscript || micHint) && (
        <span className="text-teal-300 text-xs animate-pulse max-w-[180px] truncate">
          {liveTranscript ? `🗣️ ${liveTranscript}` : micHint}
        </span>
      )}
    </div>
  );
}

export default VoiceChat;

// ============================================
// useVoiceOutput - 精靈全英文語音發聲 (中文自動翻成英文後以 en-US 朗讀)
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

  const speakWithBrowser = useCallback((text: string, lang: string = "en-US") => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setIsSpeaking(false);
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const targetLang = lang.startsWith("en") ? lang : "en-US";
      const u = new SpeechSynthesisUtterance(text);
      u.lang = targetLang;
      u.rate = config?.rate ?? 0.92;
      u.pitch = config?.pitch ?? 1.05;

      const voices = window.speechSynthesis.getVoices();
      const voice =
        voices.find((v) => v.lang === targetLang && v.localService) ||
        voices.find((v) => v.lang === targetLang) ||
        voices.find((v) => v.lang.startsWith("en"));
      if (voice) u.voice = voice;

      u.onstart = () => setIsSpeaking(true);
      u.onend = () => setIsSpeaking(false);
      u.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(u);
    } catch {
      setIsSpeaking(false);
    }
  }, [config?.rate, config?.pitch]);

  const speak = useCallback(async (text: string) => {
    if (!text || !ttsEnabled) return;

    cleanup();
    setIsSpeaking(true);

    try {
      const englishText = hasChinese(text)
        ? await translateChineseToEnglish(text)
        : text;

      const token = localStorage.getItem("nightasaur_token");
      const base = import.meta.env.VITE_API_URL || "http://localhost:3002/api";

      const response = await fetch(`${base}/tts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text: englishText, lang: "en-US" }),
      });

      if (!response.ok) throw new Error("TTS failed: " + response.status);

      const contentType = response.headers.get("Content-Type") || "";

      if (contentType.includes("application/json")) {
        const data = await response.json();
        if (data.useBrowserTTS) {
          speakWithBrowser(data.text || englishText, "en-US");
          return;
        }
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      urlRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        cleanup();
      };
      audio.onerror = () => {
        setIsSpeaking(false);
        cleanup();
      };

      await audio.play();
    } catch {
      const fallbackEn = hasChinese(text)
        ? await translateChineseToEnglish(text)
        : text;
      speakWithBrowser(fallbackEn, "en-US");
    }
  }, [ttsEnabled, cleanup, speakWithBrowser]);

  const stopSpeaking = useCallback(() => {
    cleanup();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, [cleanup]);

  return { speak, stopSpeaking, isSpeaking, ttsEnabled, setTtsEnabled };
}
