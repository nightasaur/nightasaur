import { useState, useRef, useEffect } from "react";
import { assistantAPI } from "../api/client";

export default function Assistant() {
  const [tab, setTab] = useState<"chat" | "code" | "translate" | "document">("chat");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [codeLang, setCodeLang] = useState("python");
  const [codeTask, setCodeTask] = useState("explain");
  const [codeResult, setCodeResult] = useState("");
  const [transText, setTransText] = useState("");
  const [transTarget, setTransTarget] = useState("zh-TW");
  const [transResult, setTransResult] = useState("");
  const [docInput, setDocInput] = useState("");
  const [docTask, setDocTask] = useState("summarize");
  const [docResult, setDocResult] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendChat = async () => {
    if (!input.trim() || sending) return;
    const msg = input.trim();
    setMessages((p) => [...p, { role: "user", content: msg }]);
    setInput(""); setSending(true);
    try {
      const res = await assistantAPI.chat(msg, messages);
      setMessages((p) => [...p, { role: "assistant", content: res.data.response }]);
    } catch { setMessages((p) => [...p, { role: "assistant", content: "⚠️ 連線失敗，AI 引擎尚未啟動。" }]); }
    setSending(false);
  };

  const sendCode = async () => {
    if (!codeInput.trim()) return;
    setCodeResult("⏳ 分析中...");
    try { const res = await assistantAPI.code(codeInput, codeLang, codeTask); setCodeResult(res.data.result); }
    catch { setCodeResult("⚠️ 連線失敗，AI 引擎尚未啟動。"); }
  };

  const sendTranslate = async () => {
    if (!transText.trim()) return;
    setTransResult("⏳ 翻譯中...");
    try { const res = await assistantAPI.translate(transText, transTarget); setTransResult(res.data.translation); }
    catch { setTransResult("⚠️ 連線失敗，AI 引擎尚未啟動。"); }
  };

  const sendDocument = async () => {
    if (!docInput.trim()) return;
    setDocResult("⏳ 分析中...");
    try { const res = await assistantAPI.document(docInput, docTask); setDocResult(res.data.result); }
    catch { setDocResult("⚠️ 連線失敗，AI 引擎尚未啟動。"); }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-black mb-2">
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            🤖 AI 助手
          </span>
        </h1>
        <p className="text-white/50">通用 AI 助手 — 問答、程式碼、翻譯、文件分析</p>
      </div>

      <div className="flex gap-2 mb-8 justify-center flex-wrap">
        {(["chat", "code", "translate", "document"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              tab === t ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white" : "bg-white/5 text-white/60 hover:bg-white/10"
            }`}>
            {{ chat: "💬 對話", code: "💻 程式碼", translate: "🌐 翻譯", document: "📄 文件" }[t]}
          </button>
        ))}
{tab === "chat" && messages.length === 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[{ icon: "💡", title: "一般問答", tab: "chat" }, { icon: "💻", title: "程式碼協助", tab: "code" },
            { icon: "🌐", title: "多語言翻譯", tab: "translate" }, { icon: "📄", title: "文件分析", tab: "document" },
          ].map((a) => (
            <button key={a.tab} onClick={() => setTab(a.tab as any)}
              className="glass-card p-4 text-center hover:bg-white/10 transition-all group">
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{a.icon}</div>
              <div className="font-bold text-white text-sm">{a.title}</div>
              <div className="text-xs text-white/40 mt-1">點擊切換模式</div>
            </button>
          ))}
        </div>
      )}

      {tab === "chat" && (
        <div className="glass-card min-h-[400px] flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[500px]">
            {messages.length === 0 ? (
              <div className="text-center py-16 text-white/30">
                <div className="text-6xl mb-4">🤖</div>
                <p className="text-lg mb-2">開始對話</p>
                <p className="text-sm">問我任何問題，我會盡力回答</p>
              </div>
            ) : messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] p-4 rounded-2xl ${
                  m.role === "user" ? "bg-gradient-to-br from-purple-500/30 to-pink-500/30 text-white rounded-br-md"
                    : "bg-white/5 text-white/80 rounded-bl-md"}`}>
                  {m.role === "assistant" && <div className="text-xs text-white/30 mb-1">AI</div>}
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</div>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="border-t border-white/5 p-4">
            <div className="flex gap-2">
              <input value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendChat()}
                placeholder="輸入訊息..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50" />
              <button onClick={sendChat} disabled={sending || !input.trim()}
                className="btn-primary px-6 py-3 disabled:opacity-40">{sending ? "..." : "送出"}</button>
            </div>
          </div>
        </div>
      )}
      </div>
{tab === "code" && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="glass-card">
            <h3 className="text-lg font-bold text-white mb-4">📝 輸入程式碼</h3>
            <div className="flex gap-2 mb-4">
              <select value={codeLang} onChange={(e) => setCodeLang(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                <option>Python</option><option>JavaScript</option><option>TypeScript</option>
                <option>Java</option><option>C++</option>
              </select>
              <select value={codeTask} onChange={(e) => setCodeTask(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                <option value="explain">📖 解釋</option><option value="debug">🔍 除錯</option>
                <option value="optimize">⚡ 優化</option><option value="rewrite">🔄 重寫</option>
              </select>
            </div>
            <textarea value={codeInput} onChange={(e) => setCodeInput(e.target.value)}
              placeholder="貼上程式碼..." rows={12}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 font-mono text-sm focus:outline-none" />
            <button onClick={sendCode} className="btn-primary w-full mt-4">🚀 開始分析</button>
          </div>
          <div className="glass-card">
            <h3 className="text-lg font-bold text-white mb-4">📋 分析結果</h3>
            <div className="bg-white/5 rounded-xl p-4 min-h-[300px]">
              {codeResult ? <pre className="text-sm text-white/80 whitespace-pre-wrap font-sans">{codeResult}</pre>
                : <p className="text-white/30 text-center py-12">👆 輸入程式碼後點擊分析</p>}
            </div>
          </div>
        </div>
      )}

      {tab === "translate" && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="glass-card">
            <h3 className="text-lg font-bold text-white mb-4">📝 輸入文字</h3>
            <select value={transTarget} onChange={(e) => setTransTarget(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm mb-4">
              <option value="zh-TW">繁體中文 🇹🇼</option><option value="zh-CN">簡體中文 🇨🇳</option>
              <option value="en-US">English 🇺🇸</option><option value="ja-JP">日本語 🇯🇵</option>
              <option value="ko-KR">한국어 🇰🇷</option><option value="fr">Français 🇫🇷</option>
              <option value="de">Deutsch 🇩🇪</option><option value="es">Español 🇪🇸</option>
            </select>
            <textarea value={transText} onChange={(e) => setTransText(e.target.value)}
              placeholder="輸入要翻譯的文字..." rows={8}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none" />
            <button onClick={sendTranslate} className="btn-primary w-full mt-4">🌐 翻譯</button>
          </div>
          <div className="glass-card">
            <h3 className="text-lg font-bold text-white mb-4">📋 翻譯結果</h3>
            <div className="bg-white/5 rounded-xl p-4 min-h-[300px]">
              {transResult ? <p className="text-white/80 whitespace-pre-wrap">{transResult}</p>
                : <p className="text-white/30 text-center py-12">👆 輸入文字後點擊翻譯</p>}
            </div>
          </div>
        </div>
      )}

      {tab === "document" && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="glass-card">
            <h3 className="text-lg font-bold text-white mb-4">📄 輸入文件內容</h3>
            <select value={docTask} onChange={(e) => setDocTask(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm mb-4">
              <option value="summarize">📋 摘要</option><option value="analyze">🔍 分析</option>
              <option value="extract">📌 提取關鍵資訊</option>
            </select>
            <textarea value={docInput} onChange={(e) => setDocInput(e.target.value)}
              placeholder="貼上文章、報告或筆記..." rows={12}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none" />
            <button onClick={sendDocument} className="btn-primary w-full mt-4">📊 開始分析</button>
          </div>
          <div className="glass-card">
            <h3 className="text-lg font-bold text-white mb-4">📋 分析結果</h3>
            <div className="bg-white/5 rounded-xl p-4 min-h-[300px]">
              {docResult ? <p className="text-white/80 whitespace-pre-wrap">{docResult}</p>
                : <p className="text-white/30 text-center py-12">👆 輸入內容後點擊分析</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}