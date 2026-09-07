import { useState, useRef, useCallback } from "react";

export default function VoiceChat({
  onSendText,
  onSpeechResult,
}: {
  onSendText: (text: string) => void;
  onSpeechResult?: (text: string) => void;
}) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  const startListening = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("你的瀏覽器不支援語音輸入");
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang = "zh-TW";
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

  const speak = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "zh-TW";
    u.rate = 1.0;
    u.pitch = 1.1;
    u.onstart = () => setIsSpeaking(true);
    u.onend = () => setIsSpeaking(false);
    u.onerror = () => setIsSpeaking(false);
    synthRef.current = u;
    window.speechSynthesis.speak(u);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
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
        title={isListening ? "停止聆聽" : "語音輸入"}
      >
        🎤
      </button>
      {isListening && (
        <span className="text-teal-300 text-sm animate-pulse">聆聽中...</span>
      )}
    </div>
  );
}

export { VoiceChat };
export function useVoiceOutput() {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "zh-TW";
    u.rate = 1.0;
    u.pitch = 1.1;
    u.onstart = () => setIsSpeaking(true);
    u.onend = () => setIsSpeaking(false);
    u.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(u);
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return { speak, stopSpeaking, isSpeaking };
}