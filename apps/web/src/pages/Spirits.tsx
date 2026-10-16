import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import * as tf from "@tensorflow/tfjs";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import { spiritsAPI, dialogueAPI } from "../api/client";
import SpiritSprite from "../components/SpiritSprite";
import SpiritWorldShell from "../components/SpiritWorldShell";
import { VoiceChat, useVoiceOutput } from "../components/VoiceChat";
import { spiritText } from "../utils/spiritCopy";
import { useLanguage } from "../contexts/LanguageContext";

async function translateToEnglishLocal(text: string): Promise<string> {
  const clean = (text || "").trim();
  if (!clean || !/[\u4e00-\u9fff]/.test(clean)) return clean;
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-TW&tl=en&dt=t&q=${encodeURIComponent(clean)}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const tr = data[0].map((part: any) => part?.[0] || "").join(" ").trim();
        if (tr) return tr;
      }
    }
  } catch {}
  return "Your spirit companion is cheering you on!";
}

interface ChatMessage {
  role: "user" | "spirit";
  text: string;
  enText?: string;
  imageUrl?: string;
  detectedItems?: string[];
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

function analyzeImageScene(img: HTMLImageElement): { zhDesc: string; enDesc: string } {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d");
    if (!ctx) return { zhDesc: "日常物品與場景", enDesc: "an interesting everyday object" };
    ctx.drawImage(img, 0, 0, 32, 32);
    const data = ctx.getImageData(0, 0, 32, 32).data;
    let rSum = 0, gSum = 0, bSum = 0;
    const count = data.length / 4;
    for (let i = 0; i < data.length; i += 4) {
      rSum += data[i];
      gSum += data[i + 1];
      bSum += data[i + 2];
    }
    const r = rSum / count, g = gSum / count, b = bSum / count;
    const brightness = (r + g + b) / 3;
    if (brightness < 65) return { zhDesc: "神祕夜色場景", enDesc: "a mysterious night scene" };
    if (g > r * 1.15 && g > b * 1.1) return { zhDesc: "自然綠意植物或戶外風景", enDesc: "nature greenery and outdoor scenery" };
    if (b > r * 1.15 && b > g * 1.05) return { zhDesc: "晴朗天空或海洋藍色調物件", enDesc: "sky, water, or cool blue object" };
    if (r > g * 1.18 && r > b * 1.18) return { zhDesc: "暖色系美食或活力物件", enDesc: "warm-colored food or vibrant item" };
    return { zhDesc: "明亮室內物件與生活場景", enDesc: "a bright indoor object and daily scene" };
  } catch {
    return { zhDesc: "精選照片場景", enDesc: "a featured photo scene" };
  }
}

export default function Spirits() {
  const { currentLanguage } = useLanguage();
  const t = (key: string) => spiritText(currentLanguage, key);

  const [spirits, setSpirits] = useState<any[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [recognizingImage, setRecognizingImage] = useState(false);
  const [liveInput, setLiveInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // AI 識別
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);
  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);
  const [detections, setDetections] = useState<any[]>([]);
  const [modelLoading, setModelLoading] = useState(true);
  const animationRef = useRef<number | null>(null);
  const lastDetectRef = useRef<number>(0);
  const spokenObjectsRef = useRef<Set<string>>(new Set());

  const { speak, stopSpeaking, isSpeaking } = useVoiceOutput({
    lang: "en-US",
  });

  useEffect(() => {
    spiritsAPI.list()
      .then(r => {
        setSpirits(r.data);
        if (r.data.length > 0) setCurrentId(r.data[0].id);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        await tf.ready();
        const m = await cocoSsd.load({ base: "lite_mobilenet_v2" });
        if (!cancelled) {
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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending, recognizingImage]);

  const currentSpirit = spirits.find(s => s.id === currentId);

  const handleSend = useCallback(async (text: string, extra?: { imageUrl?: string; detectedItems?: string[] }) => {
    if (!currentId || sending) return;
    stopSpeaking();
    setLiveInput("");
    setMessages(prev => [
      ...prev,
      {
        role: "user",
        text,
        imageUrl: extra?.imageUrl,
        detectedItems: extra?.detectedItems,
      },
    ]);
    setSending(true);
    try {
      const res = await dialogueAPI.chat(currentId, text);
      const reply =
        res.data?.reply || res.data?.message || res.data?.content ||
        res.data?.response || "（精靈開心地對你點點頭！）";
      const enReply = await translateToEnglishLocal(reply);
      setMessages(prev => [...prev, { role: "spirit", text: reply, enText: enReply }]);
      speak(enReply);
    } catch (err: any) {
      console.error("[Dialogue]", err);
      const errMsg = err?.response?.data?.error || err?.message || "連線失敗";
      setMessages(prev => [...prev, { role: "spirit", text: `⚠️ ${errMsg}` }]);
    } finally {
      setSending(false);
    }
  }, [currentId, sending, speak, stopSpeaking]);

  // 圖片上傳 + AI 物件與場景雙重辨識
  const handleImageUpload = useCallback(async (file: File, dataUrl: string) => {
    if (!currentId) return;
    setRecognizingImage(true);
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("圖片讀取失敗"));
        img.src = dataUrl;
      });

      let detectedList: Array<{ en: string; zh: string; score: number }> = [];
      let activeModel = model;
      if (!activeModel) {
        try {
          await tf.ready();
          activeModel = await cocoSsd.load({ base: "lite_mobilenet_v2" });
          setModel(activeModel);
          setModelLoading(false);
        } catch {}
      }

      if (activeModel) {
        try {
          const preds = await activeModel.detect(img);
          detectedList = preds
            .filter(p => p.score >= 0.35)
            .map(p => ({
              en: p.class,
              zh: OBJECT_ZH[p.class] || p.class,
              score: Math.round(p.score * 100),
            }));
        } catch (e) {
          console.warn("[ImageDetect] coco-ssd detect failed", e);
        }
      }

      const scene = analyzeImageScene(img);
      setRecognizingImage(false);

      if (detectedList.length > 0) {
        const labels = detectedList.map(d => `${d.zh} (${d.en} ${d.score}%)`);
        const top = detectedList[0];
        const promptText = `📷 [AI 圖片辨識結果：${labels.join("、")}] 我剛上傳了一張圖片，裡面有 ${top.zh} (${top.en})！請用繁體中文與英文教我「${top.en}」的單字發音與實用英文例句。`;
        await handleSend(promptText, { imageUrl: dataUrl, detectedItems: labels });
      } else {
        const cleanFileName = file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
        const badge = `${scene.zhDesc} (${scene.enDesc})`;
        const promptText = `📷 [AI 視覺場景分析：${badge}] 我上傳了一張圖片（${cleanFileName || scene.enDesc}），請結合「${scene.enDesc}」的意境跟我互動並教我兩個相關的實用英文單字與例句！`;
        await handleSend(promptText, { imageUrl: dataUrl, detectedItems: [badge] });
      }
    } catch (e) {
      setRecognizingImage(false);
      await handleSend(`📷 我上傳了一張圖片 (${file.name})，請教我如何用英文描述這張圖片！`, { imageUrl: dataUrl });
    }
  }, [currentId, model, handleSend]);

  // 攝影機即時物件識別循環
  useEffect(() => {
    if (!videoEl || !model) return;

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

  const handleCameraReady = useCallback((video: HTMLVideoElement | null) => {
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
      onSend={(txt) => handleSend(txt)}
      onImageUpload={handleImageUpload}
      externalInput={liveInput}
      onInputChange={setLiveInput}
      beforeInput={
        <VoiceChat
          onSendText={(txt) => handleSend(txt)}
          onInterimChange={(liveTxt) => setLiveInput(liveTxt)}
          lang={currentLanguage === "en-US" ? "en-US" : "zh-TW"}
        />
      }
      background="map"
      onCameraReady={handleCameraReady}
    >
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <h1 className="text-2xl font-black text-white">{t("我的精灵小队")}</h1>
          <div className="flex gap-2 items-center flex-wrap">
            {modelLoading ? (
              <span className="text-xs text-white/40 animate-pulse">🧠 AI 視覺載入中…</span>
            ) : (
              <span className="text-xs text-emerald-300/80 bg-emerald-500/10 border border-emerald-400/30 px-2.5 py-1 rounded-full">
                📷 AI 影像辨識就緒
              </span>
            )}
            {isSpeaking && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-400/40 animate-pulse">
                🔊 英語發音朗讀中...
              </span>
            )}
            <Link to="/spirits/new" className="btn-primary text-sm px-4 py-2">
              {t("+ 孵化精灵")}
            </Link>
          </div>
        </div>

        {/* AI 鏡頭即時識別結果標籤 */}
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
                {OBJECT_ZH[d.class] || d.class} ({d.class}) · {Math.round(d.score * 100)}%
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
                <div
                  key={sp.id}
                  className={`shrink-0 flex items-center gap-3 px-3 py-2 rounded-2xl border transition ${
                    sp.id === currentId
                      ? "bg-teal-500/20 border-teal-400/40"
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => switchSpirit(sp.id)}
                    className="flex items-center gap-3 text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                      <SpiritSprite species={sp.species} element={sp.element} stage={sp.stage} size={36} animate={false} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{sp.name}</div>
                      <div className="text-[10px] text-white/40">Lv.{sp.level}</div>
                    </div>
                  </button>
                  <Link
                    to={`/spirits/${sp.id}`}
                    className="text-xs px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-teal-200"
                    title="進入精靈詳情與裝扮"
                  >
                    詳情
                  </Link>
                </div>
              ))}
            </div>

            <div className="space-y-3 pb-2">
              {messages.length === 0 && currentSpirit && (
                <div className="text-center py-10 text-white/40 text-sm space-y-2">
                  <p>對 {currentSpirit.name} 說點什麼吧…</p>
                  <p className="text-xs text-teal-300/70">
                    💡 點擊下方 🎤 即可語音輸入對話，或點擊 🖼️ 上傳照片讓精靈進行 AI 影像辨識與英語教學！
                  </p>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] px-4 py-3 rounded-2xl whitespace-pre-wrap break-words ${
                      m.role === "user" ? "bg-teal-500/30 text-white" : "bg-white/10 text-white/90"
                    }`}
                  >
                    {m.imageUrl && (
                      <div className="mb-2">
                        <img
                          src={m.imageUrl}
                          alt="使用者上傳圖片"
                          className="max-h-48 rounded-xl border border-white/20 object-cover"
                        />
                        {m.detectedItems && m.detectedItems.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {m.detectedItems.map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/40 border border-indigo-300/40 text-indigo-100"
                              >
                                🔍 {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    <div>{m.text}</div>
                    {m.role === "spirit" && m.enText && m.enText !== m.text && (
                      <div className="mt-1.5 pt-1.5 border-t border-white/10 text-xs text-cyan-300/90">
                        🇬🇧 {m.enText}
                      </div>
                    )}
                    {m.role === "spirit" && (
                      <button
                        onClick={() => speak(m.enText || m.text)}
                        className="mt-1 inline-flex items-center gap-1 text-teal-300 hover:text-teal-200 text-xs font-medium"
                        title="以英文語音重播"
                      >
                        🔊 英語發音
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {recognizingImage && (
                <div className="flex justify-start">
                  <div className="px-4 py-3 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-sm animate-pulse">
                    🔍 AI 正在分析上傳圖片中的物體與場景…
                  </div>
                </div>
              )}

              {sending && (
                <div className="flex justify-start">
                  <div className="px-4 py-3 rounded-2xl bg-white/5 text-white/50 text-sm animate-pulse">
                    {currentSpirit?.name || "精靈"} 正在思考並準備英文發音…
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
