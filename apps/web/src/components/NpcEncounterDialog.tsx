import { useState, useRef, useEffect } from "react";
import { npcAPI } from "../api/client";

interface NpcMeta {
  key: string;
  name: string;
  element: string;
  image: string;
  personality: string;
}

interface SpawnInfo {
  id: string;
  npcKey: string;
  distanceKm: number;
  meta?: NpcMeta;
}

interface Props {
  spawn: SpawnInfo;
  onClose: () => void;
  onEncountered: (spawnId: string) => void;
}

interface ChatMessage {
  role: "user" | "npc";
  text: string;
}

export default function NpcEncounterDialog({ spawn, onClose, onEncountered }: Props) {
  const meta = spawn.meta;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!meta) return null;

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setMessages((p) => [...p, { role: "user", text }]);
    setInput("");
    setSending(true);
    try {
      const res = await npcAPI.dialogue(meta.key, text);
      setMessages((p) => [...p, { role: "npc", text: res.data.message }]);
    } catch (err: any) {
      const errMsg = err?.response?.data?.error || "感應中斷了…";
      setMessages((p) => [...p, { role: "npc", text: `⚠️ ${errMsg}` }]);
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    // 關閉時上報 encounter，龍會重生到 10km 外
    onEncountered(spawn.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />

      {/* 對話框 */}
      <div className="relative w-full max-w-md bg-slate-950/95 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden">
        {/* 龍圖 + 名字 */}
        <div className="relative">
          <img
            src={meta.image}
            alt={meta.name}
            className="w-full h-48 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-teal-500 to-cyan-500 text-white">
                {meta.element}
              </span>
              <span className="text-xs text-white/60">
                距離 {spawn.distanceKm.toFixed(2)} km
              </span>
            </div>
            <h2 className="text-2xl font-black text-white mt-1">{meta.name}</h2>
            <p className="text-white/60 text-xs mt-0.5">{meta.personality}</p>
          </div>
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 text-white text-xl flex items-center justify-center"
            aria-label="關閉"
          >
            ✕
          </button>
        </div>

        {/* 對話區 */}
        <div className="max-h-64 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <p className="text-center text-white/30 text-sm py-6">
              遇見了 {meta.name}！說點什麼吧…
            </p>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words ${
                  m.role === "user"
                    ? "bg-teal-500/30 text-white"
                    : "bg-white/10 text-white/90"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="px-3 py-2 rounded-2xl bg-white/5 text-white/40 text-sm animate-pulse">
                {meta.name} 正在回應…
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* 輸入框 */}
        <div className="border-t border-white/10 p-3 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="對牠說點什麼…"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/30 outline-none focus:border-teal-400/50 text-sm"
            disabled={sending}
          />
          <button
            onClick={send}
            disabled={sending || !input.trim()}
            className="px-4 py-2 rounded-xl bg-teal-500/80 hover:bg-teal-500 disabled:opacity-40 text-white text-sm font-medium"
          >
            傳送
          </button>
        </div>
      </div>
    </div>
  );
}