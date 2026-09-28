import { useState, useRef, useCallback, useEffect } from "react";

// ============================================
// VoiceChat - 語音輸入（Web Speech API）
// ============================================
export default function VoiceChat({
  onSendText,
  onSpeechResult,
}: {
  onSendText: (text: string) => void;
  onSpeechResult?: (text: string) => void;
}) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startListening = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("您的瀏覽器不支援語音輸入");
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang = "en-US";
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
  }, [onSendText, onSpeechResult]);

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  return (
    <div className="flex gap-2 items-center">
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
      {isListening && (
        <span className="text-teal-300 text-sm animate-pulse">錄音中...</span>
      )}
    </div>
  );
}

export { VoiceChat };

// ============================================
// useVoiceOutput - 使用後端 Piper TTS
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

  // 清理舊的 audio 和 blob URL
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

  // 卸載時清理
  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  const speak = useCallback(async (text: string) => {
    if (!text || !ttsEnabled) return;

    cleanup();

    try {
      setIsSpeaking(true);

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

      if (!response.ok) {
        throw new Error("TTS failed: " + response.status);
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

    } catch (err) {
      console.warn("[TTS] Piper failed, fallback to browser TTS:", err);
      setIsSpeaking(false);
      // Fallback：用瀏覽器內建 TTS
      try {
        if (!("speechSynthesis" in window)) return;
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = config?.lang || "zh-TW";
        u.rate = config?.rate ?? 0.9;
        u.pitch = config?.pitch ?? 1.0;
        u.onstart = () => setIsSpeaking(true);
        u.onend = () => setIsSpeaking(false);
        u.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(u);
      } catch {}
    }
  }, [config?.lang, config?.rate, config?.pitch, ttsEnabled, cleanup]);

  const stopSpeaking = useCallback(() => {
    cleanup();
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, [cleanup]);

  return { speak, stopSpeaking, isSpeaking, ttsEnabled, setTtsEnabled };
}