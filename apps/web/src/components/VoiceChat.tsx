import { useState, useRef, useCallback, useEffect } from "react";

// ============================================
// VoiceChat - 語音輸入（Web Speech API）
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

  // 同步外部 lang 變更
  useEffect(() => {
    setCurrentLang(lang);
  }, [lang]);

  const startListening = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("您的瀏覽器不支援語音輸入");
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
    <div className="flex gap-1 items-center">
      <button
        type="button"
        onClick={isListening ? stopListening : startListening}
        className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all ${
          isListening
            ? "bg-red-500 animate-pulse shadow-lg shadow-red-500/50"
            : "bg-teal-500/30 hover:bg-teal-500/50 border border-teal-400/30"
        }`}
        title={isListening ? "停止錄音" : "語音輸入"}
      >
        🎤
      </button>
      <button
        type="button"
        onClick={toggleLang}
        disabled={isListening}
        className="px-2 h-8 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 text-white/70 border border-white/20 disabled:opacity-40"
        title="切換語音辨識語言"
      >
        {currentLang === "zh-TW" ? "中" : "EN"}
      </button>
      {isListening && (
        <span className="text-teal-300 text-sm animate-pulse">錄音中...</span>
      )}
    </div>
  );
}

export { VoiceChat };

// ============================================
// useVoiceOutput - 英文用瀏覽器、中文用 Piper
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

  // 瀏覽器內建 TTS（英文用）
  const speakWithBrowser = useCallback((text: string, lang: string) => {
    if (!("speechSynthesis" in window)) {
      setIsSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = config?.rate ?? 0.9;
    u.pitch = config?.pitch ?? 1.0;

    // 挑選對應語言的聲音
    const voices = window.speechSynthesis.getVoices();
    const voice =
      voices.find((v) => v.lang === lang && v.localService) ||
      voices.find((v) => v.lang === lang) ||
      voices.find((v) => v.lang.startsWith(lang.split("-")[0]));
    if (voice) u.voice = voice;

    u.onstart = () => setIsSpeaking(true);
    u.onend = () => setIsSpeaking(false);
    u.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(u);
  }, [config?.rate, config?.pitch]);

  const speak = useCallback(async (text: string) => {
    if (!text || !ttsEnabled) return;

    cleanup();
    setIsSpeaking(true);

    try {
      const token = localStorage.getItem("nightasaur_token");
      const base = import.meta.env.VITE_API_URL || "http://localhost:3002/api";

      const response = await fetch(`${base}/tts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) throw new Error("TTS failed: " + response.status);

      const contentType = response.headers.get("Content-Type") || "";

      // 後端回傳 JSON → 用瀏覽器內建 TTS（英文）
      if (contentType.includes("application/json")) {
        const data = await response.json();
        if (data.useBrowserTTS) {
          speakWithBrowser(data.text || text, data.lang || "en-US");
          return;
        }
      }

      // 後端回傳 WAV → 播放 Piper 音檔（中文）
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

    } catch (err) {
      console.warn("[TTS] failed, fallback to browser TTS:", err);
      speakWithBrowser(text, config?.lang || "zh-TW");
    }
  }, [config?.lang, ttsEnabled, cleanup, speakWithBrowser]);

  const stopSpeaking = useCallback(() => {
    cleanup();
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, [cleanup]);

  return { speak, stopSpeaking, isSpeaking, ttsEnabled, setTtsEnabled };
}