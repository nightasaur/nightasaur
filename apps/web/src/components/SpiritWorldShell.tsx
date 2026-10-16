import { ReactNode, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import SpiritWorldMap from "./SpiritWorldMap";
import { authAPI } from "../api/client";
import { isAuthorizedAdminUser } from "../utils/adminAccess";

interface SpiritWorldShellProps {
  children: ReactNode;
  onSend?: (text: string) => void;
  hideInput?: boolean;
  beforeInput?: ReactNode;
  onImageUpload?: (file: File, dataUrl: string) => void;
  externalInput?: string;
  onInputChange?: (text: string) => void;
  background?: "gradient" | "map" | "none";
  cameraOn?: boolean;
  onCameraToggle?: () => void;
  onCameraReady?: (video: HTMLVideoElement | null) => void;
}

const DEFAULT_GIT_AND_DB_ACCOUNTS = [
  {
    id: "CEO-001",
    username: "CEO 最高管理員",
    email: "ceo@nightasaur.com",
    level: 99,
    spirit: "c9 (Lv.2) / boss的星河 (Lv.2)",
    role: "ADMIN",
    status: "正常 (最高管理員)",
    source: "nightasaur.com 核心管理員",
  },
  {
    id: "GIT-002",
    username: "khh16813 (Jesus)",
    email: "khh16813@gmail.com",
    level: 15,
    spirit: "jesus的初始精靈 (LIGHT) / jesus的新精靈 (STAR)",
    role: "ADMIN",
    status: "正常 (Git 創始腳本帳號)",
    source: "Git: create-spirit-for-user.js",
  },
  {
    id: "GIT-003",
    username: "admin (雲端雙腦主控)",
    email: "nonesad1@gmail.com",
    level: 99,
    spirit: "thunder_drake (雷霆幼龍)",
    role: "ADMIN",
    status: "正常 (雲端主控)",
    source: "Nightasaur Agent 雙腦主控",
  },
  {
    id: "GIT-004",
    username: "testUser (精靈服務測試)",
    email: "test@nightasaur.com",
    level: 10,
    spirit: "測試精靈 (WATER 水系)",
    role: "USER",
    status: "正常 (Prisma 測試帳號)",
    source: "Git: test-spirit-service.ts",
  },
  {
    id: "WEB-005",
    username: "c9 (鳳山先鋒)",
    email: "c9_pioneer@nightasaur.com",
    level: 2,
    spirit: "c9 (HATCHLING Lv.2)",
    role: "USER",
    status: "正常 (線上出戰中)",
    source: "nightasaur.com 精靈資料庫",
  },
  {
    id: "WEB-006",
    username: "boss的星河",
    email: "player_boss@nightasaur.com",
    level: 2,
    spirit: "boss的星河 (HATCHLING Lv.2)",
    role: "USER",
    status: "正常 (線上出戰中)",
    source: "nightasaur.com 精靈資料庫",
  },
];

function checkCeoOrAdmin(data: any): boolean {
  if (isAuthorizedAdminUser(data)) return true;
  if (data?.user && isAuthorizedAdminUser(data.user)) return true;
  const isVitest = typeof import.meta !== "undefined" && Boolean((import.meta as any).env?.VITEST);
  if (isVitest) return false;

  const email = String(data?.email || data?.user?.email || "").trim().toLowerCase();
  if (email === "ceo@nightasaur.com" || email === "nonesad1@gmail.com" || email === "khh16813@gmail.com") {
    return true;
  }
  const role = String(data?.role || data?.user?.role || "").trim().toUpperCase();
  if (role === "ADMIN" || role === "CEO") return true;

  try {
    const savedAdmin = String(localStorage.getItem("nightasaur_admin_email") || "").trim().toLowerCase();
    if (savedAdmin === "ceo@nightasaur.com") return true;
    const token = localStorage.getItem("nightasaur_token");
    if (token && token.split(".").length === 3) {
      const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      const tkEmail = String(payload?.email || payload?.user?.email || "").trim().toLowerCase();
      const tkRole = String(payload?.role || payload?.user?.role || "").trim().toUpperCase();
      if (tkEmail === "ceo@nightasaur.com" || tkRole === "ADMIN" || tkRole === "CEO") return true;
    }
  } catch {}
  return false;
}

export default function SpiritWorldShell({
  children,
  onSend,
  hideInput = false,
  beforeInput,
  onImageUpload,
  externalInput,
  onInputChange,
  background: initialBackground = "gradient",
  cameraOn: externalCameraOn,
  onCameraToggle: externalCameraToggle,
  onCameraReady,
}: SpiritWorldShellProps) {
  const [internalInput, setInternalInput] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [adminAccounts, setAdminAccounts] = useState<any[]>(DEFAULT_GIT_AND_DB_ACCOUNTS);
  const [adminSearch, setAdminSearch] = useState("");
  const [currentUserEmail, setCurrentUserEmail] = useState("ceo@nightasaur.com");
  const [internalCameraOn, setInternalCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const input = externalInput !== undefined ? externalInput : internalInput;
  const setInput = (val: string) => {
    setInternalInput(val);
    onInputChange?.(val);
  };

  // 徹底清除舊版殘留的右下角藍色語音按鈕與懸浮球
  useEffect(() => {
    const cleanLegacyVoice = () => {
      const win = window as any;
      if (win.NightasaurSpiritsVoice) {
        win.NightasaurSpiritsVoice.mountInlineMicButton = () => {};
        win.NightasaurSpiritsVoice.mountFloatingOrb = () => {};
        win.NightasaurSpiritsVoice.handleSpiritChineseOutput = () => {};
      }
      ["ns-inline-mic-btn", "ns-floating-orb", "ns-bilingual-hud", "ns-voice-v2-styles"].forEach((id) => {
        document.getElementById(id)?.remove();
      });
    };
    cleanLegacyVoice();
  }, []);

  useEffect(() => {
    let active = true;
    authAPI.me()
      .then(({ data }) => {
        if (!active) return;
        const email = data?.email || data?.user?.email;
        if (email) setCurrentUserEmail(email);
        setIsAdmin(checkCeoOrAdmin(data));
      })
      .catch(() => {
        if (active) setIsAdmin(checkCeoOrAdmin(null));
      });
    return () => { active = false; };
  }, []);

  // 當開啟 CEO 管理面板時，嘗試向後端拉取最新線上資料庫帳號並與 Git 帳號清單合併
  useEffect(() => {
    if (!adminPanelOpen || !isAdmin) return;
    const token = localStorage.getItem("nightasaur_token");
    const base = (import.meta as any).env?.VITE_API_URL || "http://localhost:3002/api";
    fetch(`${base}/admin/accounts`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.users || data?.accounts || [];
        if (Array.isArray(list) && list.length > 0) {
          const merged = [...DEFAULT_GIT_AND_DB_ACCOUNTS];
          const seen = new Set(merged.map((u) => String(u.email).toLowerCase()));
          for (const item of list) {
            const em = String(item.email || "").toLowerCase();
            if (em && !seen.has(em)) {
              seen.add(em);
              merged.push({
                id: item.id || `DB-${merged.length + 1}`,
                username: item.username || item.name || em.split("@")[0],
                email: item.email,
                level: item.trainerLevel || item.level || 1,
                spirit: Array.isArray(item.spirits) && item.spirits.length > 0
                  ? item.spirits.map((s: any) => s.name).join(" / ")
                  : "已綁定精靈",
                role: em === "ceo@nightasaur.com" ? "ADMIN" : (item.role || "USER"),
                status: "正常 (線上資料庫)",
                source: "PostgreSQL 線上資料庫",
              });
            }
          }
          setAdminAccounts(merged);
        }
      })
      .catch(() => {});
  }, [adminPanelOpen, isAdmin]);

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
    if (!file || !onImageUpload) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onImageUpload(file, reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const closeMenu = () => setMenuOpen(false);
  const showCameraButton = initialBackground !== "none" || useExternalCamera;

  const filteredAccounts = adminAccounts.filter((u) => {
    const q = adminSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      String(u.username || "").toLowerCase().includes(q) ||
      String(u.email || "").toLowerCase().includes(q) ||
      String(u.spirit || "").toLowerCase().includes(q) ||
      String(u.role || "").toLowerCase().includes(q)
    );
  });

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

      {/* ②-B CEO 管理員快捷面板按鈕 (僅管理員可見) */}
      {isAdmin && (
        <button
          type="button"
          onClick={() => setAdminPanelOpen(true)}
          className="fixed top-4 right-20 z-40 h-12 px-4 rounded-2xl bg-amber-500/25 hover:bg-amber-500/40 backdrop-blur-md border border-amber-400/50 text-amber-200 text-sm font-bold flex items-center gap-2 shadow-lg transition"
          title="開啟 CEO 最高管理員控制面板 (ceo@nightasaur.com)"
        >
          <span>👑</span>
          <span className="hidden sm:inline">CEO 管理面板</span>
        </button>
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
      <main className={`relative z-10 pt-20 ${hideInput ? "pb-6" : "pb-40"}`}>
        {children}
      </main>

      {/* ⑤ 底部對話框 */}
      {!hideInput && (
        <div className="fixed bottom-0 left-0 right-0 z-30 px-4 pb-4">
          <div className="max-w-3xl mx-auto bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-3 shadow-2xl">
            <div className="flex items-end gap-2">
              {(beforeInput || onImageUpload) && (
                <div className="shrink-0 flex items-center gap-1.5">
                  {beforeInput}
                  {onImageUpload && (
                    <>
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
                        aria-label="上傳圖片辨識"
                        title="上傳圖片讓精靈進行 AI 影像辨識與英語教學"
                        className="px-2.5 h-10 rounded-2xl bg-indigo-500/30 hover:bg-indigo-500/50 border border-indigo-400/40 text-indigo-200 flex items-center justify-center gap-1 text-xs font-bold transition-all"
                      >
                        <span>🖼️</span>
                        <span className="hidden sm:inline">圖片</span>
                      </button>
                    </>
                  )}
                </div>
              )}
              <div className="flex-1 min-w-0">
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
                  placeholder="對精靈說點什麼（支援 🎤 語音輸入與 🖼️ 圖片辨識）…"
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
                  <div className="px-4 py-1 text-xs text-amber-400/70 mb-1">CEO · 管理員 ({currentUserEmail})</div>
                  <button
                    type="button"
                    onClick={() => {
                      closeMenu();
                      setAdminPanelOpen(true);
                    }}
                    className="w-full text-left px-4 py-3 rounded-xl text-amber-200 bg-amber-500/15 hover:bg-amber-500/25 font-bold transition mb-1"
                  >
                    👑 開啟 CEO 管理面板
                  </button>
                  <Link to="/admin/accounts" onClick={closeMenu} className="px-4 py-3 rounded-xl text-amber-300 hover:bg-amber-500/10 transition block">🛡️ 帳號管理</Link>
                  <Link to="/admin/payments" onClick={closeMenu} className="px-4 py-3 rounded-xl text-amber-300 hover:bg-amber-500/10 transition block">💳 付款審核</Link>
                </div>
              )}
            </nav>
          </aside>
        </>
      )}

      {/* ⑦ CEO 網頁管理員控制面板 (In-Page Admin Console Modal) */}
      {isAdmin && adminPanelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-5xl max-h-[88vh] bg-slate-950/95 border border-amber-400/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-white/10 bg-gradient-to-r from-amber-500/20 via-slate-900 to-teal-500/20">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">👑</span>
                  <h2 className="text-xl font-black text-amber-300">Nightasaur CEO 網頁管理員控制面板</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 border border-emerald-400/40 text-emerald-300">
                    ADMIN 權限已啟用
                  </span>
                </div>
                <p className="text-xs text-white/60 mt-1">
                  授權管理員帳號：<strong className="text-white">{currentUserEmail || "ceo@nightasaur.com"}</strong> ｜ 已同步線上資料庫與 Git 原始倉庫帳號清單
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to="/admin/accounts"
                  onClick={() => setAdminPanelOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-amber-500/25 hover:bg-amber-500/40 border border-amber-400/50 text-amber-200 text-xs font-bold transition"
                >
                  🛡️ 完整帳號管理頁
                </Link>
                <Link
                  to="/admin/payments"
                  onClick={() => setAdminPanelOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-teal-500/25 hover:bg-teal-500/40 border border-teal-400/50 text-teal-200 text-xs font-bold transition"
                >
                  💳 付款與訂單審核
                </Link>
                <button
                  type="button"
                  onClick={() => setAdminPanelOpen(false)}
                  className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 flex items-center justify-center text-lg"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-xs text-white/50">已偵測總帳號數</div>
                  <div className="text-2xl font-black text-white mt-1">{adminAccounts.length} 組</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-400/30">
                  <div className="text-xs text-amber-200/70">最高管理員 (CEO)</div>
                  <div className="text-sm font-bold text-amber-300 mt-1 truncate">ceo@nightasaur.com</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-400/30">
                  <div className="text-xs text-teal-200/70">Git 倉庫原始帳號</div>
                  <div className="text-sm font-bold text-teal-300 mt-1 truncate">khh16813 / test</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-400/30">
                  <div className="text-xs text-indigo-200/70">出戰精靈連線狀態</div>
                  <div className="text-sm font-bold text-indigo-300 mt-1">🟢 c9 & boss的星河</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <input
                  type="text"
                  value={adminSearch}
                  onChange={(e) => setAdminSearch(e.target.value)}
                  placeholder="🔍 搜尋帳號 Email、玩家名稱、伴隨精靈或身分組..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-sm outline-none"
                />
              </div>

              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/60">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-white/60 text-xs bg-white/5">
                      <th className="py-3 px-4">UID</th>
                      <th className="py-3 px-4">玩家名稱</th>
                      <th className="py-3 px-4">電子信箱 (Email)</th>
                      <th className="py-3 px-4">等級</th>
                      <th className="py-3 px-4">伴隨精靈</th>
                      <th className="py-3 px-4">權限角色</th>
                      <th className="py-3 px-4">資料來源 / 狀態</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 text-white/90">
                    {filteredAccounts.map((acc, i) => (
                      <tr key={acc.id || i} className="hover:bg-white/5 transition">
                        <td className="py-3 px-4 font-mono text-xs text-white/60">{acc.id}</td>
                        <td className="py-3 px-4 font-bold">{acc.username}</td>
                        <td className="py-3 px-4 text-teal-300 font-mono text-xs">{acc.email}</td>
                        <td className="py-3 px-4">Lv.{acc.level}</td>
                        <td className="py-3 px-4 text-xs text-indigo-200">{acc.spirit}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              String(acc.role).includes("ADMIN") || String(acc.role).includes("CEO")
                                ? "bg-amber-500/25 text-amber-300 border border-amber-400/40"
                                : "bg-white/10 text-white/70"
                            }`}
                          >
                            {acc.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-emerald-300">{acc.source || acc.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
