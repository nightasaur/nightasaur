import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
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

export default function Spirits() {
  const { currentLanguage } = useLanguage();
  const t = (key: string) => spiritText(currentLanguage, key);

  const [spirits, setSpirits] = useState<any[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 👇 TTS hook（中文走 Piper、英文走浏览器）
  const { speak, stopSpeaking, isSpeaking } = useVoiceOutput({
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

  // 對話自動滾到底
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const currentSpirit = spirits.find(s => s.id === currentId);

  // 發送訊息
  const handleSend = async (text: string) => {
    if (!currentId || sending) return;
    stopSpeaking(); // 打斷上一段語音
    setMessages(prev => [...prev, { role: "user", text }]);
    setSending(true);
    try {
      const res = await dialogueAPI.chat(currentId, text);
      const reply =
        res.data?.reply ||
        res.data?.message ||
        res.data?.content ||
        res.data?.response ||
        "（精靈沉默不語）";
      setMessages(prev => [...prev, { role: "spirit", text: reply }]);

      // 👇 精靈回覆後自動朗讀
      speak(reply);
    } catch (err: any) {
      console.error("[Dialogue]", err);
      const errMsg = err?.response?.data?.error || err?.message || "連線失敗，請稍後再試";
      setMessages(prev => [...prev, { role: "spirit", text: `⚠️ ${errMsg}` }]);
    } finally {
      setSending(false);
    }
  };

  // 切換精靈 → 清空對話 + 停止朗讀
  const switchSpirit = (id: string) => {
    if (id === currentId) return;
    stopSpeaking();
    setCurrentId(id);
    setMessages([]);
  };

  return (
    <SpiritWorldShell onSend={handleSend} background="map">
      <div className="max-w-4xl mx-auto">
        {/* 標題列 */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-black">{t("我的精灵小队")}</h1>
          <Link to="/spirits/new" className="btn-primary text-sm px-4 py-2">
            {t("+ 孵化精灵")}
          </Link>
        </div>

        {spirits.length === 0 ? (
          <div className="glass-card text-center py-12">
            <p className="text-6xl mb-4">🥚</p>
            <p className="text-white/50">{t("还没有精灵喔～")}</p>
          </div>
        ) : (
          <>
            {/* 精靈橫向選擇列 */}
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

            {/* 對話歷史 */}
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
                      m.role === "user"
                        ? "bg-teal-500/30 text-white"
                        : "bg-white/10 text-white/90"
                    }`}
                  >
                    {m.text}
                    {/* 精靈泡泡右下角加 🔊 按鈕，可重播 */}
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