import { ReactNode, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import SpiritWorldMap from "./SpiritWorldMap";
import VoiceChat from "./VoiceChat";
import { authAPI } from "../api/client";
import { isAuthorizedAdminUser } from "../utils/adminAccess";

interface SpiritWorldShellProps {
  children: ReactNode;
  onSend?: (text: string) => void;
  onImageUpload?: (file: File, dataUrl: string) => void;
  hideInput?: boolean;
  beforeInput?: ReactNode;
  background?: "gradient" | "map" | "none";
  cameraOn?: boolean;
  onCameraToggle?: () => void;
  onCameraReady?: (video: HTMLVideoElement | null) => void;
}

export default function SpiritWorldShell({
  children,
  onSend,
  onImageUpload,
  hideInput = false,
  beforeInput,
  background: initialBackground = "gradient",
  cameraOn: externalCameraOn,
  onCameraToggle: externalCameraToggle,
  onCameraReady,
}: SpiritWorldShellProps) {
  const [input, setInput] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [internalCameraOn, setInternalCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let active = true;
    authAPI.me()
      .then(({ data }) => { if (active) setIsAdmin(isAuthorizedAdminUser(data)); })
      .catch(() => { if (active) setIsAdmin(false); });
    return () => { active = false; };
  }, []);

  const useExternalCamera = typeof externalCameraToggle === "function";
  const cameraOn = useExternalCamera ? !!externalCameraOn : internalCameraOn;

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const lineHeight = 24;
    const maxLines = window.innerWidth < 768 ? 4 : 7;
    el.style.height = Math.min(el.scrollHeight, lineHeight * maxLines) + "px";
  }, [input]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    onCameraReady?.(cameraOn ? videoRef.current : null);
  }, [cameraOn, onCameraReady]);

  const handleCameraToggle = async () => {
    if (useExternalCamera) {
      externalCameraToggle?.();
      return;
    }
    setCameraError("");
    if (internalCameraOn && streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      setInternalCameraOn(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: 640, height: 480 },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try { await videoRef.current.play(); } catch {}
      }
      setInternalCameraOn(true);
    } catch (e: any) {
      setCameraError("相機啟動失敗：" + e.message);
      setInternalCameraOn(false);
    }
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    onSend?.(text);
    setInput("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      if (onImageUpload) {
        onImageUpload(file, dataUrl);
      } else if (onSend) {
        onSend(`[上傳圖片: ${file.name}] 請幫我辨識這張圖片並用英文介紹！`);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = typeof reader.result === "string" ? reader.result : "";
            if (onImageUpload) {
              onImageUpload(file, dataUrl);
            }
          };
          reader.readAsDataURL(file);
          break;
        }
      }
    }
  };

  const closeMenu = () => setMenuOpen(false);
  const showCameraButton = initialBackground !== "none" || useExternalCamera;

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* ① 背景層 */}
      {initialBackground !== "none" && (
        <div className="fixed inset-0 z-0">
          {initialBackground === "map" && !cameraOn && (
            <div
              className="absolute inset-0"
              style={{ height: "100vh", width: "100vw" }}
            >
              <SpiritWorldMap />
            </div>
          )}

          {initialBackground === "gradient" && (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-black" />
          )}

          {!useExternalCamera && (
            <video
              ref={videoRef}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                cameraOn ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
              playsInline
              muted
            />
          )}
        </div>
      )}

      {/* ② 相機切換按鈕 */}
      {showCameraButton && (
        <button
          onClick={handleCameraToggle}
          aria-label={cameraOn ? "關閉相機" : "開啟相機"}
          className={`fixed top-4 left-4 z-40 w-12 h-12 rounded-2xl backdrop-blur-md border text-xl flex items-center justify-center transition ${
            cameraOn
              ? "bg-teal-500/40 border-teal-400/60 text-white"
              : "bg-white/10 border-white/20 text-white"
          }`}
        >
          {cameraOn ? "🌙" : "📷"}
        </button>
      )}

      {cameraError && (
        <div className="fixed top-20 left-4 right-4 z-40 bg-red-500/20 border border-red-400/40 text-red-200 px-4 py-2 rounded-xl text-sm">
          {cameraError}
        </div>
      )}

      {/* ③ 漢堡按鈕 */}
      <button
        onClick={() => setMenuOpen(true)}
        aria-label="開啟選單"
        className="fixed top-4 right-4 z-40 w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white text-2xl flex items-center justify-center"
      >
        ☰
      </button>

      {/* ④ 主內容 */}
      <main className={`relative z-10 pt-20 ${hideInput ? "pb-6" : "pb-44"}`}>
        {children}
      </main>

      {/* ⑤ 底部對話框（整合 🎤 即時語音輸入 + 🖼️ 圖片上傳辨識） */}
      {!hideInput && (
        <div className="fixed bottom-0 left-0 right-0 z-30 px-4 pb-4">
          <div className="max-w-3xl mx-auto bg-slate-950/80 backdrop-blur-xl border border-white/20 rounded-3xl p-3 shadow-2xl">
            <div className="flex items-end gap-2">
              <div className="shrink-0 flex items-center gap-1.5">
                <VoiceChat
                  onSendText={(txt) => {
                    setInput("");
                    onSend?.(txt);
                  }}
                  onInterimChange={(liveTxt) => {
                    if (liveTxt) setInput(liveTxt);
                  }}
                  lang="zh-TW"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-10 px-3 rounded-full bg-purple-500/30 hover:bg-purple-500/50 text-purple-100 border border-purple-400/40 flex items-center justify-center gap-1.5 text-sm font-bold transition-all shadow-md"
                  title="上傳圖片進行 AI 視覺辨識與精靈雙語對話"
                >
                  <span>🖼️</span>
                  <span className="hidden sm:inline">圖片辨識</span>
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onPaste={handlePaste}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="對精靈說點什麼…（支援 🎤 語音聽寫、🖼️ 圖片上傳辨識，精靈將以英語發聲回應）"
                  rows={1}
                  className="w-full bg-transparent text-white placeholder-white/40 outline-none resize-none leading-6"
                  style={{ maxHeight: "168px" }}
                />
                <div className="flex justify-end mt-1">
                  <button
                    onClick={handleSend}
                    className="px-4 py-1.5 rounded-xl bg-teal-500/80 hover:bg-teal-500 text-white text-sm font-bold transition"
                  >
                    傳送
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ⑥ 漢堡菜單 */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={closeMenu} />
          <aside className="fixed top-0 right-0 bottom-0 z-50 w-80 max-w-[85vw] bg-slate-950/95 backdrop-blur-xl border-l border-white/10 overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <span className="text-white font-bold text-lg">🌙 Nightasaur</span>
              <button onClick={closeMenu} className="text-white/60 hover:text-white text-2xl">✕</button>
            </div>
            <nav className="flex flex-col p-4 gap-1">
              <Link to="/spirits" onClick={closeMenu} className="px-4 py-3 rounded-xl text-white/80 hover:bg-white/5 transition">🔮 精靈</Link>
              <Link to="/academy/category/ielts" onClick={closeMenu} className="px-4 py-3 rounded-xl text-white/80 hover:bg-white/5 transition">🎓 IELTS 訓練</Link>
              <Link to="/academy" onClick={closeMenu} className="px-4 py-3 rounded-xl text-white/80 hover:bg-white/5 transition">📚 學習中心</Link>
              <Link to="/assistant" onClick={closeMenu} className="px-4 py-3 rounded-xl text-white/80 hover:bg-white/5 transition">🤖 助手</Link>
              <Link to="/social" onClick={closeMenu} className="px-4 py-3 rounded-xl text-white/80 hover:bg-white/5 transition">🌍 社群</Link>
              <Link to="/dashboard" onClick={closeMenu} className="px-4 py-3 rounded-xl text-white/80 hover:bg-white/5 transition">📊 總覽</Link>
              <Link to="/account" onClick={closeMenu} className="px-4 py-3 rounded-xl text-white/80 hover:bg-white/5 transition">👤 帳號</Link>
              <Link to="/my/invoices" onClick={closeMenu} className="px-4 py-3 rounded-xl text-white/80 hover:bg-white/5 transition">🧾 我的發票</Link>
              <Link to="/pricing" onClick={closeMenu} className="px-4 py-3 rounded-xl text-amber-300 hover:bg-amber-500/10 transition">💎 升級方案</Link>
              {isAdmin && (
                <div className="mt-4 pt-4 border-t border-amber-500/20">
                  <div className="px-4 py-1 text-xs text-amber-400/70 mb-1">CEO · 管理員</div>
                  <Link to="/admin/accounts" onClick={closeMenu} className="px-4 py-3 rounded-xl text-amber-300 hover:bg-amber-500/10 transition">🛡️ 帳號管理</Link>
                  <Link to="/admin/payments" onClick={closeMenu} className="px-4 py-3 rounded-xl text-amber-300 hover:bg-amber-500/10 transition">💳 付款審核</Link>
                </div>
              )}
            </nav>
          </aside>
        </>
      )}
    </div>
  );
}
