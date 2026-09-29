import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import * as tf from "@tensorflow/tfjs";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import { SPIRIT_CHARACTERS, type SpiritCharacter } from "../config/spirits";

type Mode = "intro" | "quiz" | "task";

type Detection = {
  bbox: [number, number, number, number];
  class: string;
  score: number;
};

type Feedback = {
  grammar?: string;
  vocabulary?: string;
  score?: number;
  translation?: string;
};

type LogMsg = {
  role: "user" | "spirit" | "system";
  text: string;
  feedback?: Feedback;
};

const OBJECT_ZH: Record<string, string> = {
  person: "人", bicycle: "腳踏車", car: "車子", motorcycle: "機車",
  airplane: "飛機", bus: "公車", train: "火車", truck: "卡車",
  boat: "船", "traffic light": "紅綠燈", "fire hydrant": "消防栓",
  "stop sign": "停止標誌", "parking meter": "停車計時器", bench: "長椅",
  bird: "鳥", cat: "貓", dog: "狗", horse: "馬", sheep: "羊",
  cow: "牛", elephant: "大象", bear: "熊", zebra: "斑馬",
  giraffe: "長頸鹿", backpack: "背包", umbrella: "雨傘",
  handbag: "手提包", tie: "領帶", suitcase: "行李箱",
  frisbee: "飛盤", skis: "滑雪板", snowboard: "單板滑雪",
  "sports ball": "球", kite: "風箏", "baseball bat": "棒球棒",
  "baseball glove": "棒球手套", skateboard: "滑板", surfboard: "衝浪板",
  "tennis racket": "網球拍", bottle: "瓶子", "wine glass": "酒杯",
  cup: "杯子", fork: "叉子", knife: "刀子", spoon: "湯匙",
  bowl: "碗", banana: "香蕉", apple: "蘋果", sandwich: "三明治",
  orange: "橘子", broccoli: "花椰菜", carrot: "紅蘿蔔",
  "hot dog": "熱狗", pizza: "披薩", donut: "甜甜圈", cake: "蛋糕",
  chair: "椅子", couch: "沙發", "potted plant": "盆栽", bed: "床",
  "dining table": "餐桌", toilet: "馬桶", tv: "電視",
  laptop: "筆電", mouse: "滑鼠", remote: "遙控器", keyboard: "鍵盤",
  "cell phone": "手機", microwave: "微波爐", oven: "烤箱",
  toaster: "烤麵包機", sink: "水槽", refrigerator: "冰箱",
  book: "書", clock: "時鐘", vase: "花瓶", scissors: "剪刀",
  "teddy bear": "泰迪熊", "hair drier": "吹風機", toothbrush: "牙刷",
};

const TASK_TARGETS = [
  { label: "cup", zh: "杯子" },
  { label: "book", zh: "書" },
  { label: "bottle", zh: "瓶子" },
  { label: "cell phone", zh: "手機" },
  { label: "chair", zh: "椅子" },
];

export default function ArLearning() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modelRef = useRef<cocoSsd.ObjectDetection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastDetectRef = useRef<number>(0);
  const spokenObjectsRef = useRef<Set<string>>(new Set());
  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const [spirit, setSpirit] = useState<SpiritCharacter | null>(null);
  const [mode, setMode] = useState<Mode>("intro");
  const [logs, setLogs] = useState<LogMsg[]>([]);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [cameraReady, setCameraReady] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentTask, setCurrentTask] = useState<typeof TASK_TARGETS[0] | null>(null);
  const [quizTarget, setQuizTarget] = useState<Detection | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("nightasaur_token") : null;
  const base = import.meta.env.VITE_API_URL || "http://localhost:3002/api";

  // ============================================
  // TTS 播放
  // ============================================
  const speak = useCallback(async (text: string) => {
    setIsSpeaking(true);
    try {
      const res = await fetch(`${base}/tts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("TTS failed");

      const contentType = res.headers.get("Content-Type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        if (data.useBrowserTTS) {
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(data.text);
          u.lang = data.lang || "en-US";
          u.rate = 0.9;
          const voices = window.speechSynthesis.getVoices();
          const v = voices.find((vv) => vv.lang === u.lang);
          if (v) u.voice = v;
          u.onend = () => setIsSpeaking(false);
          u.onerror = () => setIsSpeaking(false);
          window.speechSynthesis.speak(u);
          return;
        }
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(url); };
      audio.onerror = () => { setIsSpeaking(false); URL.revokeObjectURL(url); };
      await audio.play();
    } catch (e) {
      console.warn("TTS error:", e);
      setIsSpeaking(false);
    }
  }, [token, base]);

  // ============================================
  // 核心：走 englishTraining API
  // ============================================
  const sendToSpirit = useCallback(async (userText: string) => {
    if (!spirit || loading) return;

    setLogs((p) => [...p, { role: "user", text: userText }]);
    setLoading(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      const res = await fetch(`${base}/english-training/conversation/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          spiritId: spirit.id,
          spiritName: spirit.name,
          spiritElement: spirit.element,
          spiritPersonality: spirit.personality,
          topicId: "free-talk",
          message: userText,
          userLocale: "zh-TW",
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await res.json();

      if (data.response) {
        setLogs((p) => [
          ...p,
          {
            role: "spirit",
            text: data.response,
            feedback: { ...data.feedback, translation: data.translation },
          },
        ]);
        speak(data.response);
      } else {
        setLogs((p) => [...p, { role: "spirit", text: "(No response)" }]);
      }
    } catch (e: any) {
      const msg = e.name === "AbortError" ? "精靈回應逾時" : e.message;
      setLogs((p) => [...p, { role: "system", text: "連線失敗: " + msg }]);
    } finally {
      setLoading(false);
    }
  }, [spirit, loading, base, token, speak]);

  // ============================================
  // 自動滾到底
  // ============================================
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // ============================================
  // 載入模型
  // ============================================
  useEffect(() => {
    let cancelled = false;
    const loadModel = async () => {
      try {
        await tf.ready();
        const model = await cocoSsd.load({ base: "lite_mobilenet_v2" });
        if (!cancelled) {
          modelRef.current = model;
          setModelReady(true);
        }
      } catch (e: any) {
        if (!cancelled) setError("模型載入失敗：" + e.message);
      }
    };
    loadModel();
    return () => { cancelled = true; };
  }, []);

  // ============================================
  // 相機
  // ============================================
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: 640, height: 480 },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraReady(true);
      }
    } catch (e: any) {
      setError("相機啟動失敗：" + e.message);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setCameraReady(false);
  }, []);

  // ============================================
  // 偵測循環
  // ============================================
  useEffect(() => {
    if (!cameraReady || !modelReady || !spirit) return;

    const detect = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || !modelRef.current) return;

      const now = Date.now();
      if (now - lastDetectRef.current < 800) {
        animationRef.current = requestAnimationFrame(detect);
        return;
      }
      lastDetectRef.current = now;

      try {
        const results = await modelRef.current.detect(video);
        const filtered = results.filter((r) => r.score > 0.6);
        setDetections(filtered);

        const ctx = canvas.getContext("2d");
        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          filtered.forEach((d) => {
            const [x, y, w, h] = d.bbox;
            ctx.strokeStyle = spirit.color;
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, w, h);
            ctx.fillStyle = spirit.color;
            ctx.font = "bold 18px sans-serif";
            const label = `${d.class} (${Math.round(d.score * 100)}%)`;
            const tw = ctx.measureText(label).width;
            ctx.fillRect(x, y - 24, tw + 12, 24);
            ctx.fillStyle = "#fff";
            ctx.fillText(label, x + 6, y - 6);
          });
        }

        if (filtered.length > 0 && mode === "intro" && !loading) {
          const top = filtered.find((d) => d.class !== "person") || filtered[0];
          if (!spokenObjectsRef.current.has(top.class)) {
            spokenObjectsRef.current.add(top.class);
            const zh = OBJECT_ZH[top.class] || top.class;
            sendToSpirit(`I see a ${top.class} (${zh}). Please teach me this word.`);
          }
        }
      } catch (e) {
        console.warn("Detect error:", e);
      }

      animationRef.current = requestAnimationFrame(detect);
    };

    detect();
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [cameraReady, modelReady, spirit, mode, loading, sendToSpirit]);

  // ============================================
  // 問答模式
  // ============================================
  const startQuiz = useCallback(() => {
    const target = detections.find((d) => d.class !== "person");
    if (!target) {
      setLogs((p) => [...p, { role: "system", text: "請將鏡頭對準物體" }]);
      return;
    }
    setQuizTarget(target);
    const zh = OBJECT_ZH[target.class] || target.class;
    sendToSpirit(`Please quiz me. Ask "What is this?" about a ${target.class} (${zh}).`);
  }, [detections, sendToSpirit]);

  const checkQuizAnswer = useCallback(
    (answer: string) => {
      if (!quizTarget) return;
      sendToSpirit(`I think it's a ${answer}. Is that correct?`);
      setQuizTarget(null);
    },
    [quizTarget, sendToSpirit]
  );

  // ============================================
  // 任務模式
  // ============================================
  const startTask = useCallback(() => {
    const task = TASK_TARGETS[Math.floor(Math.random() * TASK_TARGETS.length)];
    setCurrentTask(task);
    spokenObjectsRef.current.clear();
    sendToSpirit(`I want to play a game. Ask me to find a ${task.label} (${task.zh}).`);
  }, [sendToSpirit]);

  // ============================================
  // 語音輸入
  // ============================================
  const handleVoiceInput = useCallback(
    (text: string) => {
      if (mode === "quiz" && quizTarget) {
        checkQuizAnswer(text);
      } else {
        sendToSpirit(text);
      }
    },
    [mode, quizTarget, checkQuizAnswer, sendToSpirit]
  );

  const startListening = useCallback(async () => {
    setError("");
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setError("此瀏覽器不支援語音辨識，請使用 Chrome 或 Edge");
      return;
    }

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e: any) {
      setError("麥克風權限被拒絕：" + e.message);
      return;
    }

    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      setIsListening(false);
      handleVoiceInput(text);
    };
    rec.onerror = (e: any) => {
      setIsListening(false);
      if (e.error === "not-allowed") setError("請允許麥克風權限");
      else if (e.error === "no-speech") setError("沒有偵測到語音，請再說一次");
      else setError("語音辨識錯誤：" + e.error);
    };
    rec.onend = () => setIsListening(false);
    rec.start();
    recognitionRef.current = rec;
    setIsListening(true);
  }, [handleVoiceInput]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  // ============================================
  // 清理
  // ============================================
  useEffect(() => {
    return () => {
      stopCamera();
      stopListening();
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, [stopCamera, stopListening]);

  // ============================================
  // 選精靈畫面
  // ============================================
  if (!spirit) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4 max-w-5xl mx-auto">
        <button
          onClick={() => navigate("/academy/category/ielts")}
          className="text-sm text-white/55 hover:text-white mb-6"
        >
          ← 回學習中心
        </button>
        <h1 className="text-3xl font-bold text-white mb-2">🌍 AR 情境英語</h1>
        <p className="text-white/50 mb-8">選一隻精靈，用手機鏡頭認識世界</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {SPIRIT_CHARACTERS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSpirit(s)}
              className="rounded-2xl p-4 bg-white/5 border border-white/10 hover:border-purple-400 hover:ring-2 hover:ring-purple-500/50 transition-all"
            >
              <img src={s.image} alt={s.name} className="w-full aspect-square rounded-xl mb-3 object-cover" />
              <div className="text-white font-medium text-sm">{s.name}</div>
              <div className="text-xs text-white/50">{s.elementZh}屬性</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ============================================
  // AR 主畫面
  // ============================================
  return (
    <div className="min-h-screen pt-24 pb-6 px-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => { stopCamera(); stopListening(); setSpirit(null); setLogs([]); }}
          className="text-sm text-white/55 hover:text-white"
        >
          ← 換精靈
        </button>
        <div className="text-sm text-white/50">
          {modelReady ? "🤖 模型就緒" : "⏳ 載入模型..."}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-400/40 text-red-200 p-3 rounded-xl mb-4 text-sm flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError("")} className="text-red-200 hover:text-white ml-2">✕</button>
        </div>
      )}

      <div className="flex flex-col items-center mb-4">
        <div className="relative">
          <div
            className="absolute inset-0 rounded-full blur-2xl transition-opacity"
            style={{ background: spirit.color, opacity: isSpeaking ? 0.5 : 0.15 }}
          />
          <img
            src={spirit.image}
            alt={spirit.name}
            className={`relative w-24 h-24 rounded-full object-cover transition-all duration-300 ${
              isSpeaking ? "animate-bounce scale-110" : "scale-100"
            }`}
            style={{ filter: isSpeaking ? `drop-shadow(0 0 20px ${spirit.color})` : "none" }}
          />
        </div>
        <div className="mt-2 text-white font-bold">{spirit.name}</div>
      </div>

      <div className="relative bg-black rounded-2xl overflow-hidden mb-4" style={{ aspectRatio: "4/3" }}>
        <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

        {!cameraReady && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white">
            <button
              onClick={startCamera}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 font-bold mb-3"
              disabled={!modelReady}
            >
              {modelReady ? "📷 開啟相機" : "⏳ 模型載入中..."}
            </button>
            <p className="text-white/50 text-sm">請允許相機權限</p>
          </div>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        {[
          { id: "intro", label: "📖 介紹" },
          { id: "quiz", label: "❓ 問答" },
          { id: "task", label: "🎯 任務" },
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => {
              setMode(m.id as Mode);
              spokenObjectsRef.current.clear();
              setQuizTarget(null);
              setCurrentTask(null);
            }}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
              mode === m.id
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                : "bg-white/10 text-white/60 hover:bg-white/20"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {cameraReady && mode === "quiz" && !quizTarget && (
        <button
          onClick={startQuiz}
          className="w-full mb-4 py-3 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold"
        >
          ❓ 出題（對著物體按）
        </button>
      )}

      {cameraReady && mode === "task" && !currentTask && (
        <button
          onClick={startTask}
          className="w-full mb-4 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold"
        >
          🎯 開始任務
        </button>
      )}

      <div className="bg-white/5 rounded-2xl p-4 mb-4 h-64 overflow-y-auto text-sm">
        {logs.length === 0 && (
          <div className="text-white/40 text-center py-8">
            {mode === "intro" && "鏡頭對準物體，精靈會介紹它"}
            {mode === "quiz" && "按「出題」讓精靈問你問題"}
            {mode === "task" && "按「開始任務」接受挑戰"}
          </div>
        )}
        {logs.map((m, i) => (
          <div key={i} className={`mb-3 ${m.role === "user" ? "text-right" : ""}`}>
            <div
              className={`inline-block max-w-[85%] rounded-2xl px-3 py-2 ${
                m.role === "user"
                  ? "bg-purple-600 text-white"
                  : m.role === "system"
                  ? "bg-yellow-500/20 text-yellow-200 text-xs"
                  : "bg-white/10 text-white/90"
              }`}
            >
              {m.text}
            </div>
            {m.feedback && (
              <div className="mt-1 text-xs text-white/60 space-y-0.5 max-w-[85%] inline-block text-left">
                {m.feedback.translation && <div className="text-emerald-300">🌏 {m.feedback.translation}</div>}
                {m.feedback.grammar && <div>📝 {m.feedback.grammar}</div>}
                {m.feedback.vocabulary && <div>💡 {m.feedback.vocabulary}</div>}
                {m.feedback.score !== undefined && <div>⭐ {m.feedback.score}/100</div>}
              </div>
            )}
          </div>
        ))}
        {loading && <div className="text-white/40 text-xs">精靈思考中...</div>}
        <div ref={chatEndRef} />
      </div>

      <button
        onClick={isListening ? stopListening : startListening}
        className={`w-full py-3 rounded-xl font-bold transition-colors ${
          isListening
            ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
            : "bg-teal-500 hover:bg-teal-600 active:bg-teal-700 text-white"
        }`}
      >
        {isListening ? "⏹ 停止錄音" : "🎤 說話"}
      </button>
    </div>
  );
}