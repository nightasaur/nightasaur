import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import * as tf from "@tensorflow/tfjs";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import { spiritsAPI, dialogueAPI } from "../api/client";
import SpiritSprite from "../components/SpiritSprite";
import SpiritWorldShell from "../components/SpiritWorldShell";
import VoiceChat, { useVoiceOutput, translateChineseToEnglish } from "../components/VoiceChat";
import { spiritText } from "../utils/spiritCopy";
import { useLanguage } from "../contexts/LanguageContext";

interface ChatMessage {
  role: "user" | "spirit";
  text: string;
  enText?: string;
  imageUrl?: string;
  detectedTags?: string[];
}

const OBJECT_ZH: Record<string, string> = {
  person: "人物 (Person)", bicycle: "腳踏車 (Bicycle)", car: "汽車 (Car)", motorcycle: "機車 (Motorcycle)",
  airplane: "飛機 (Airplane)", bus: "公車 (Bus)", train: "火車 (Train)", truck: "卡車 (Truck)",
  boat: "船隻 (Boat)", "traffic light": "紅綠燈 (Traffic Light)", "fire hydrant": "消防栓 (Fire Hydrant)",
  "stop sign": "停止標誌 (Stop Sign)", "parking meter": "停車計時器 (Parking Meter)", bench: "長椅 (Bench)",
  bird: "飛鳥 (Bird)", cat: "貓咪 (Cat)", dog: "狗狗 (Dog)", horse: "駿馬 (Horse)", sheep: "綿羊 (Sheep)",
  cow: "乳牛 (Cow)", elephant: "大象 (Elephant)", bear: "熊 (Bear)", zebra: "斑馬 (Zebra)",
  giraffe: "長頸鹿 (Giraffe)", backpack: "背包 (Backpack)", umbrella: "雨傘 (Umbrella)",
  handbag: "手提包 (Handbag)", tie: "領帶 (Tie)", suitcase: "行李箱 (Suitcase)",
  frisbee: "飛盤 (Frisbee)", skis: "滑雪板 (Skis)", snowboard: "單板滑雪 (Snowboard)",
  "sports ball": "運動球 (Sports Ball)", kite: "風箏 (Kite)", "baseball bat": "球棒 (Baseball Bat)",
  "baseball glove": "棒球手套 (Glove)", skateboard: "滑板 (Skateboard)", surfboard: "衝浪板 (Surfboard)",
  "tennis racket": "網球拍 (Tennis Racket)", bottle: "水瓶 (Bottle)", "wine glass": "酒杯 (Wine Glass)",
  cup: "杯子 (Cup)", fork: "叉子 (Fork)", knife: "刀子 (Knife)", spoon: "湯匙 (Spoon)",
  bowl: "碗 (Bowl)", banana: "香蕉 (Banana)", apple: "蘋果 (Apple)", sandwich: "三明治 (Sandwich)",
  orange: "柳橙 (Orange)", broccoli: "花椰菜 (Broccoli)", carrot: "紅蘿蔔 (Carrot)",
  "hot dog": "熱狗 (Hot Dog)", pizza: "披薩 (Pizza)", donut: "甜甜圈 (Donut)", cake: "蛋糕 (Cake)",
  chair: "椅子 (Chair)", couch: "沙發 (Couch)", "potted plant": "盆栽植物 (Potted Plant)", bed: "床鋪 (Bed)",
  "dining table": "餐桌 (Dining Table)", toilet: "衛浴 (Toilet)", tv: "螢幕/電視 (TV/Monitor)",
  laptop: "筆記型電腦 (Laptop)", mouse: "滑鼠 (Mouse)", remote: "遙控器 (Remote)", keyboard: "鍵盤 (Keyboard)",
  "cell phone": "智慧型手機 (Cell Phone)", microwave: "微波爐 (Microwave)", oven: "烤箱 (Oven)",
  toaster: "烤麵包機 (Toaster)", sink: "水槽 (Sink)", refrigerator: "冰箱 (Refrigerator)",
  book: "書籍 (Book)", clock: "時鐘 (Clock)", vase: "花瓶 (Vase)", scissors: "剪刀 (Scissors)",
  "teddy bear": "泰迪熊 (Teddy Bear)", "hair drier": "吹風機 (Hair Drier)", toothbrush: "牙刷 (Toothbrush)",
};

export default function Spirits() {
  const { currentLanguage } = useLanguage();
  const t = (key: string) => spiritText(currentLanguage, key);

  const [spirits, setSpirits] = useState<any[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // AI 視覺辨識
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);
  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);
  const [detections, setDetections] = useState<any[]>([]);
  const [modelLoading, setModelLoading] = useState(true);
  const animationRef = useRef<number | null>(null);
  const lastDetectRef = useRef<number>(0);
  const spokenObjectsRef = useRef<Set<string>>(new Set());

  // 強制以英文輸出精靈語音
  const { speak, stopSpeaking, isSpeaking } = useVoiceOutput({
    lang: "en-US",
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

  // 載入 TensorFlow COCO-SSD 模型
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
  }, [messages, sending]);

  const currentSpirit = spirits.find(s => s.id === currentId);

  // 發送文字訊息
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
      const enText = await translateChineseToEnglish(reply);
      setMessages(prev => [...prev, { role: "spirit", text: reply, enText }]);
      speak(enText);
    } catch (err: any) {
      console.error("[Dialogue]", err);
      const errMsg = err?.response?.data?.error || err?.message || "連線失敗";
      setMessages(prev => [...prev, { role: "spirit", text: `⚠️ ${errMsg}` }]);
    } finally {
      setSending(false);
    }
  }, [currentId, sending, speak, stopSpeaking]);

  // 圖片上傳與 AI 視覺辨識功能
  const handleImageUpload = useCallback(async (file: File, dataUrl: string) => {
    if (!currentId) return;
    stopSpeaking();

    // 1. 載入圖片元素並執行 AI 物件與視覺特徵辨識
    const analyzeUploadedImage = (): Promise<{ tags: string[]; summaryPrompt: string }> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = async () => {
          const tags: string[] = [];
          try {
            let activeModel = model;
            if (!activeModel) {
              await tf.ready();
              activeModel = await cocoSsd.load({ base: "lite_mobilenet_v2" });
              setModel(activeModel);
            }
            if (activeModel) {
              const preds = await activeModel.detect(img);
              for (const p of preds.slice(0, 4)) {
                const label = OBJECT_ZH[p.class] || p.class;
                tags.push(`🔍 ${label} · ${Math.round(p.score * 100)}%`);
              }
            }
          } catch (e) {
            console.warn("[ImageDetect] fallback analysis:", e);
          }

          // 若未偵測到特定 COCO 類別，分析影像色彩與構圖特徵
          if (tags.length === 0) {
            try {
              const canvas = document.createElement("canvas");
              canvas.width = 64;
              canvas.height = 64;
              const ctx = canvas.getContext("2d");
              if (ctx) {
                ctx.drawImage(img, 0, 0, 64, 64);
                const data = ctx.getImageData(0, 0, 64, 64).data;
                let r = 0, g = 0, b = 0;
                for (let i = 0; i < data.length; i += 4) {
                  r += data[i]; g += data[i + 1]; b += data[i + 2];
                }
                const count = data.length / 4;
                r = Math.round(r / count); g = Math.round(g / count); b = Math.round(b / count);
                const tone = r > b + 25 ? "暖色調 (Warm Tone)" : b > r + 25 ? "冷色調 (Cool Tone)" : "自然色調 (Balanced Tone)";
                tags.push(`🎨 ${tone}`);
                tags.push(`📐 ${img.naturalWidth}×${img.naturalHeight}px`);
              }
            } catch {}
          }

          const cleanFileName = file.name.replace(/\.[^.]+$/, "").replace(/[_-]/g, " ");
          const detectedDesc = tags.join("、") || cleanFileName;
          const prompt = `我上傳了一張圖片（檔名：${cleanFileName}，AI 視覺辨識結果：${detectedDesc}）。請告訴我你看到了什麼，並教我相關的英文單字與一句實用例句！`;
          resolve({ tags, summaryPrompt: prompt });
        };
        img.onerror = () => {
          resolve({
            tags: [`📄 ${file.name}`],
            summaryPrompt: `我分享了一張圖片「${file.name}」，請與我互動並教我相關的英文表達！`
          });
        };
        img.src = dataUrl;
      });
    };

    const { tags, summaryPrompt } = await analyzeUploadedImage();

    setMessages(prev => [
      ...prev,
      {
        role: "user",
        text: `🖼️ 已上傳圖片：${file.name}`,
        imageUrl: dataUrl,
        detectedTags: tags,
      }
    ]);

    setSending(true);
    try {
      const res = await dialogueAPI.chat(currentId, summaryPrompt);
      const reply =
        res.data?.reply || res.data?.message || res.data?.content ||
        res.data?.response || `我看到了你分享的圖片（${tags.join(", ")}）！這張圖片很有趣，我們一起用英文形容它吧！`;
      const enText = await translateChineseToEnglish(reply);
      setMessages(prev => [...prev, { role: "spirit", text: reply, enText }]);
      speak(enText);
    } catch {
      const fallbackReply = `我看到了你上傳的圖片（辨識特徵：${tags.join("、")}）！這真是一張很棒的照片！`;
      const enText = await translateChineseToEnglish(fallbackReply);
      setMessages(prev => [...prev, { role: "spirit", text: fallbackReply, enText }]);
      speak(enText);
    } finally {
      setSending(false);
    }
  }, [currentId, model, speak, stopSpeaking]);

  // 相機即時物件識別循環
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
      onSend={handleSend}
      onImageUpload={handleImageUpload}
      background="map"
      onCameraReady={handleCameraReady}
      beforeInput={<VoiceChat onSendText={handleSend} lang="zh-TW" />}
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-black">{t("我的精灵小队")}</h1>
          <div className="flex gap-2 items-center">
            {isSpeaking && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40 animate-pulse">
                🔊 EN 英語發音中…
              </span>
            )}
            {modelLoading && (
              <span className="text-xs text-white/40 animate-pulse">AI 視覺載入中…</span>
            )}
            <Link to="/spirits/new" className="btn-primary text-sm px-4 py-2">
              {t("+ 孵化精灵")}
            </Link>
          </div>
        </div>

        {/* AI 相機識別結果標籤 */}
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
                <div className="text-center py-10 text-white/40 text-sm">
                  對 {currentSpirit.name} 說點什麼吧…（支援下方 🎤 語音聽寫、🖼️ 圖片上傳辨識，精靈將自動以英文翻譯與英語發音回應）
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[82%] px-4 py-3 rounded-2xl whitespace-pre-wrap break-words backdrop-blur-md ${
                      m.role === "user" ? "bg-teal-500/30 text-white" : "bg-slate-900/85 border border-white/15 text-white/95"
                    }`}
                  >
                    {m.imageUrl && (
                      <div className="mb-2">
                        <img
                          src={m.imageUrl}
                          alt="Uploaded"
                          className="max-h-56 rounded-xl object-contain border border-white/20"
                        />
                        {m.detectedTags && m.detectedTags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {m.detectedTags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-2.5 py-0.5 rounded-full bg-purple-500/30 border border-purple-400/50 text-purple-100 text-xs font-bold"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    <div>{m.text}</div>
                    {m.role === "spirit" && m.enText && m.enText !== m.text && (
                      <div className="mt-2 pt-2 border-t border-white/15 text-amber-300 text-xs italic flex items-center justify-between gap-2">
                        <span>🇬🇧 {m.enText}</span>
                      </div>
                    )}
                    {m.role === "spirit" && (
                      <div className="mt-1.5 flex justify-end">
                        <button
                          onClick={() => speak(m.enText || m.text)}
                          className="px-2.5 py-0.5 rounded-full bg-amber-500/20 hover:bg-amber-500/40 text-amber-200 border border-amber-400/30 text-xs font-bold transition"
                          title="播放英文語音 (Play English Audio)"
                        >
                          🔊 英文發音 (EN)
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {sending && (
                <div className="flex justify-start">
                  <div className="px-4 py-3 rounded-2xl bg-white/5 text-white/50 text-sm animate-pulse">
                    {currentSpirit?.name || "精靈"} 正在辨識並準備雙語語音回應…
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
