import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import * as tf from "@tensorflow/tfjs";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import { spiritsAPI, dialogueAPI } from "../api/client";
import SpiritSprite from "../components/SpiritSprite";
import SpiritWorldShell from "../components/SpiritWorldShell";
import { useVoiceOutput } from "../components/VoiceChat";
import { spiritText } from "../utils/spiritCopy";
import { useLanguage } from "../contexts/LanguageContext";

interface ChatMessage {
  role: "user" | "spirit";
  text: string;
}

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

export default function Spirits() {
  const { currentLanguage } = useLanguage();
  const t = (key: string) => spiritText(currentLanguage, key);

  const [spirits, setSpirits] = useState<any[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // AI 識別
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);
  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);
  const [detections, setDetections] = useState<any[]>([]);
  const [modelLoading, setModelLoading] = useState(true);
  const animationRef = useRef<number | null>(null);
  const lastDetectRef = useRef<number>(0);
  const spokenObjectsRef = useRef<Set<string>>(new Set());

  const { speak, stopSpeaking } = useVoiceOutput({
    lang: currentLanguage === "en-US" ? "en-US" : "zh-TW",
  });

  // 載入精靈列表
  useEffect(() => {
    spiritsAPI.list()
      .then(r => {
        setSpirits(r.data);
        if (r.data.length > 0) setCurrentId(r.data[0].id);
      })
      .catch(console.error);
  }, []);

  // 載入 TensorFlow 模型
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        console.log("[Spirits] 開始載入 TensorFlow 模型…");
        await tf.ready();
        const m = await cocoSsd.load({ base: "lite_mobilenet_v2" });
        if (!cancelled) {
          console.log("[Spirits] 模型載入成功");
          setModel(m);
          setModelLoading(false);
        }
      } catch (e) {
        console.error("[Spirits] 模型載入失敗", e);
        setModelLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // 對話自動滾到底
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const currentSpirit = spirits.find(s => s.id === currentId);

  // 發送訊息
  const handleSend = useCallback(async (text: string) => {
    if (!currentId || sending) return;
    stopSpeaking();
    setMessages(prev => [...prev, { role: "user", text }]);
    setSending(true);
    try {
      const res = await dialogueAPI.chat(currentId, text);
      const reply =
        res.data?.reply || res.data?.message || res.data?.content ||
        res.data?.response || "（精靈沉默不語）";
      setMessages(prev => [...prev, { role: "spirit", text: reply }]);
      speak(reply);
    } catch (err: any) {
      console.error("[Dialogue]", err);
      const errMsg = err?.response?.data?.error || err?.message || "連線失敗";
      setMessages(prev => [...prev, { role: "spirit", text: `⚠️ ${errMsg}` }]);
    } finally {
      setSending(false);
    }
  }, [currentId, sending, speak, stopSpeaking]);

  // 物件識別循環
  useEffect(() => {
    if (!videoEl || !model) return;

    console.log("[Spirits] 開始識別循環");

    const detect = async () => {
      const now = Date.now();
      if (now - lastDetectRef.current < 800) {
        animationRef.current = requestAnimationFrame(detect);
        return;
      }
      lastDetectRef.current = now;

      try {
        const results = await model.detect(videoEl);
        const filtered = results.filter(r => r.score > 0.6);
        setDetections(filtered);

        if (filtered.length > 0 && !sending && currentId) {
          const top = filtered.find(d => d.class !== "person") || filtered[0];
          if (!spokenObjectsRef.current.has(top.class)) {
            spokenObjectsRef.current.add(top.class);
            const zh = OBJECT_ZH[top.class] || top.class;
            console.log("[Spirits] 發現新物體:", top.class, zh);
            handleSend(`I see a ${top.class} (${zh}). Teach me this word.`);
          }
        }
      } catch (e) {
        console.warn("[Spirits] detect error", e);
      }
      animationRef.current = requestAnimationFrame(detect);
    };

    detect();
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [videoEl, model, sending, currentId, handleSend]);

  // 相機 ready 回調
  const handleCameraReady = useCallback((video: HTMLVideoElement | null) => {
    console.log("[Spirits] camera ready:", !!video);
    setVideoEl(video);
    if (!video) {
      setDetections([]);
      spokenObjectsRef.current.clear();
    }
  }, []);

  const switchSpirit = (id: string) => {
    if (id === currentId) return;
    stopSpeaking();
    setCurrentId(id);
    setMessages([]);
    spokenObjectsRef.current.clear();
  };

  return (
    <SpiritWorldShell
      onSend={handleSend}
      background="map"
      onCameraReady={handleCameraReady}
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-black">{t("我的精灵小队")}</h1>
          <div className="flex gap-2 items-center">
            {modelLoading && (
              <span className="text-xs text-white/40 animate-pulse">AI 載入中…</span>
            )}
            <Link to="/spirits/new" className="btn-primary text-sm px-4 py-2">
              {t("+ 孵化精灵")}
            </Link>
          </div>
        </div>

        {/* AI 識別結果標籤 */}
        {videoEl && detections.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {detections.slice(0, 5).map((d, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded-full text-xs font-bold"
                style={{
                  background: "#22d3ee33",
                  border: "1px solid #22d3ee66",
                  color: "#a5f3fc",
                }}
              >
                {d.class} · {Math.round(d.score * 100)}%
              </span>
            ))}
          </div>
        )}

        {spirits.length === 0 ? (
          <div className="glass-card text-center py-12">
            <p className="text-6xl mb-4">🥚</p>
            <p className="text-white/50">{t("还没有精灵喔～")}</p>
          </div>
        ) : (
          <>
            <div className="flex gap-3 overflow-x-auto pb-3 mb-6">
              {spirits.map((sp: any) => (
                <button
                  key={sp.id}
                  onClick={() => switchSpirit(sp.id)}
                  className={`shrink-0 flex items-center gap-3 px-3 py-2 rounded-2xl border transition ${
                    sp.id === currentId
                      ? "bg-teal-500/20 border-teal-400/40"
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                    <SpiritSprite species={sp.species} element={sp.element} stage={sp.stage} size={36} animate={false} />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold">{sp.name}</div>
                    <div className="text-[10px] text-white/40">Lv.{sp.level}</div>
                  </div>
                </button>
              ))}
            </div>

            <div className="space-y-3 pb-2">
              {messages.length === 0 && currentSpirit && (
                <div className="text-center py-10 text-white/30 text-sm">
                  對 {currentSpirit.name} 說點什麼吧…
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] px-4 py-3 rounded-2xl whitespace-pre-wrap break-words ${
                      m.role === "user" ? "bg-teal-500/30 text-white" : "bg-white/10 text-white/90"
                    }`}
                  >
                    {m.text}
                    {m.role === "spirit" && (
                      <button
                        onClick={() => speak(m.text)}
                        className="ml-2 text-white/40 hover:text-white/80 text-xs"
                        title="重播語音"
                      >
                        🔊
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {sending && (
                <div className="flex justify-start">
                  <div className="px-4 py-3 rounded-2xl bg-white/5 text-white/50 text-sm animate-pulse">
                    {currentSpirit?.name || "精靈"} 正在思考…
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          </>
        )}
      </div>
    </SpiritWorldShell>
  );
}