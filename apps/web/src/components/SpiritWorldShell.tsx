import { ReactNode, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

interface SpiritWorldShellProps {
  children: ReactNode;
  onSend?: (text: string) => void;
  hideInput?: boolean;
  background?: "gradient" | "none";
}

export default function SpiritWorldShell({
  children,
  onSend,
  hideInput = false,
  background: initialBackground = "gradient",
}: SpiritWorldShellProps) {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [background, setBackground] = useState<"ar" | "night">(
    initialBackground === "none" ? "night" : "night"
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const lineHeight = 24;
    const maxLines = window.innerWidth < 768 ? 4 : 7;
    el.style.height = Math.min(el.scrollHeight, lineHeight * maxLines) + "px";
  }, [input]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    onSend?.(text);
    setInput("");
  };

  const toggleBackground = () => {
    setBackground((b) => (b === "ar" ? "night" : "ar"));
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* ① 背景层（background=none 时由子组件自己渲染背景） */}
      {initialBackground !== "none" && (
        <div className="fixed inset-0 -z-10">
          {background === "ar" ? (
            <div className="w-full h-full bg-black flex items-center justify-center text-white/40 text-sm">
              [AR 相機畫面 — 待接 WebRTC]
            </div>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-950 via-slate-900 to-black" />
          )}
        </div>
      )}

      {/* ② 顶部按钮 */}
      {initialBackground !== "none" && (
        <button
          onClick={toggleBackground}
          aria-label="切換背景"
          className="fixed top-4 left-4 z-40 w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white text-xl flex items-center justify-center"
        >
          {background === "ar" ? "🌙" : "📷"}
        </button>
      )}

      <button
        onClick={() => setMenuOpen(true)}
        aria-label="開啟選單"
        className="fixed top-4 right-4 z-40 w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white text-2xl flex items-center justify-center"
      >
        ☰
      </button>

      {/* ③ 主内容区 */}
      <main className={`relative z-10 pt-20 ${hideInput ? "pb-6" : "pb-40"}`}>
        {children}
      </main>

      {/* ④ 底部半透明对话框（hideInput 时隐藏） */}
      {!hideInput && (
        <div className="fixed bottom-0 left-0 right-0 z-30 px-4 pb-4">
          <div className="max-w-3xl mx-auto bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-3 shadow-2xl">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="對精靈說點什麼…"
              rows={1}
              className="w-full bg-transparent text-white placeholder-white/40 outline-none resize-none leading-6"
              style={{ maxHeight: "168px" }}
            />
            <div className="flex justify-end mt-1">
              <button
                onClick={handleSend}
                className="px-4 py-1.5 rounded-xl bg-teal-500/80 hover:bg-teal-500 text-white text-sm transition"
              >
                傳送
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ⑤ 汉堡菜单 */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={closeMenu}
          />
          <aside className="fixed top-0 right-0 bottom-0 z-50 w-80 max-w-[85vw] bg-slate-950/95 backdrop-blur-xl border-l border-white/10 overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <span className="text-white font-bold text-lg">🌙 Nightasaur</span>
              <button onClick={closeMenu} className="text-white/60 hover:text-white text-2xl">✕</button>
            </div>
            <nav className="flex flex-col p-4 gap-1">
              <Link to="/spirits" onClick={closeMenu} className="px-4 py-3 rounded-xl text-white/80 hover:bg-white/5 transition">🔮 精靈</Link>
              <Link to="/ar" onClick={closeMenu} className="px-4 py-3 rounded-xl text-white/80 hover:bg-white/5 transition">🌍 AR 情境英語</Link>
              <Link to="/academy/category/ielts" onClick={closeMenu} className="px-4 py-3 rounded-xl text-white/80 hover:bg-white/5 transition">🎓 IELTS 訓練</Link>
              <Link to="/academy" onClick={closeMenu} className="px-4 py-3 rounded-xl text-white/80 hover:bg-white/5 transition">📚 學習中心</Link>
              <Link to="/assistant" onClick={closeMenu} className="px-4 py-3 rounded-xl text-white/80 hover:bg-white/5 transition">🤖 助手</Link>
              <Link to="/social" onClick={closeMenu} className="px-4 py-3 rounded-xl text-white/80 hover:bg-white/5 transition">🌍 社群</Link>
              <Link to="/dashboard" onClick={closeMenu} className="px-4 py-3 rounded-xl text-white/80 hover:bg-white/5 transition">📊 總覽</Link>
              <Link to="/account" onClick={closeMenu} className="px-4 py-3 rounded-xl text-white/80 hover:bg-white/5 transition">👤 帳號</Link>
              <Link to="/my/invoices" onClick={closeMenu} className="px-4 py-3 rounded-xl text-white/80 hover:bg-white/5 transition">🧾 我的發票</Link>

              <div className="mt-4 pt-4 border-t border-amber-500/20">
                <div className="px-4 py-1 text-xs text-amber-400/70 mb-1">管理員</div>
                <Link to="/admin/accounts" onClick={closeMenu} className="px-4 py-3 rounded-xl text-amber-300 hover:bg-amber-500/10 transition">🛡️ 帳號管理</Link>
                <Link to="/admin/payments" onClick={closeMenu} className="px-4 py-3 rounded-xl text-amber-300 hover:bg-amber-500/10 transition">💳 付款審核</Link>
              </div>
            </nav>
          </aside>
        </>
      )}
    </div>
  );
}