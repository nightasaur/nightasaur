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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendChat = async () => {
    if (!input.trim() || sending) return;
    const msg = input.trim();
    setMessages((p) => [...p, { role: "user", content: msg }]);
    setInput("");
    setSending(true);
    try {
      const res = await assistantAPI.chat(msg, messages);
      setMessages((p) => [...p, { role: "assistant", content: res.data.response }]);
    } catch {
      setMessages((p) => [...p, { role: "assistant", content: "Connection failed. Check AI Engine." }]);
    }
    setSending(false);
  };

  const sendCode = async () => {
    if (!codeInput.trim()) return;
    setCodeResult("Analyzing...");
    try {
      const res = await assistantAPI.code(codeInput, codeLang, codeTask);
      setCodeResult(res.data.result);
    } catch {
      setCodeResult("Connection failed. Check AI Engine.");
    }
  };

  const sendTranslate = async () => {
    if (!transText.trim()) return;
    setTransResult("Translating...");
    try {
      const res = await assistantAPI.translate(transText, transTarget);
      setTransResult(res.data.translation);
    } catch {
      setTransResult("Connection failed. Check AI Engine.");
<div className="flex gap-2 mb-8 justify-center flex-wrap">
        {(["chat", "code", "translate", "document"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 rounded-xl transition-all text-sm font-medium ${
              tab === t
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25"
                : "bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            {t === "chat" && "Chat"}
            {t === "code" && "Code"}
            {t === "translate" && "Translate"}
            {t === "document" && "Document"}
          </button>
        ))}
      </div>

      {tab === "chat" && messages.length === 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { icon: "💡", title: "Q&A", hint: "Ask anything", tab: "chat" },
            { icon: "💻", title: "Code", hint: "Explain, debug, optimize", tab: "code" },
            { icon: "🌐", title: "Translate", hint: "Multi-language", tab: "translate" },
            { icon: "📄", title: "Document", hint: "Summarize, analyze", tab: "document" },
          ].map((a) => (
            <button
              key={a.tab}
              onClick={() => setTab(a.tab as any)}
              className="glass-card p-4 text-center hover:bg-white/10 transition-all group"
            >
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{a.icon}</div>
              <div className="font-bold text-white text-sm">{a.title}</div>
              <div className="text-xs text-white/40 mt-1">{a.hint}</div>
            </button>
{tab === "chat" && (
        <div className="glass-card min-h-[400px] flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[500px]">
            {messages.length === 0 ? (
              <div className="text-center py-16 text-white/30">
                <div className="text-6xl mb-4">🤖</div>
                <p className="text-lg mb-2">Start a conversation</p>
                <p className="text-sm">Ask me anything!</p>
              </div>
            ) : (
              messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] p-4 rounded-2xl ${
                    m.role === "user"
                      ? "bg-gradient-to-br from-purple-500/30 to-pink-500/30 text-white rounded-br-md"
                      : "bg-white/5 text-white/80 rounded-bl-md"
                  }`}>
                    {m.role === "assistant" && <div className="text-xs text-white/30 mb-1">AI</div>}
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</div>
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="border-t border-white/5 p-4">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendChat()}
                placeholder="Type a message..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50"
              />
              <button onClick={sendChat} disabled={sending || !input.trim()} className="btn-primary px-6 py-3 disabled:opacity-40">
{tab === "code" && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="glass-card">
            <h3 className="text-lg font-bold text-white mb-4">Code Input</h3>
            <select value={codeLang} onChange={(e) => setCodeLang(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm mb-2 w-full">
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
            </select>
            <select value={codeTask} onChange={(e) => setCodeTask(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm mb-4 w-full">
              <option value="explain">Explain</option>
              <option value="debug">Debug</option>
              <option value="optimize">Optimize</option>
              <option value="rewrite">Rewrite</option>
            </select>
            <textarea value={codeInput} onChange={(e) => setCodeInput(e.target.value)}
              placeholder="Paste your code here..." rows={12}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 font-mono text-sm focus:outline-none focus:border-purple-500/50" />
            <button onClick={sendCode} className="btn-primary w-full mt-4">Analyze</button>
          </div>
          <div className="glass-card">
            <h3 className="text-lg font-bold text-white mb-4">Result</h3>
            <div className="bg-white/5 rounded-xl p-4 min-h-[300px]">
              {codeResult ? <pre className="text-sm text-white/80 whitespace-pre-wrap font-sans">{codeResult}</pre>
              : <p className="text-white/30 text-center py-12">Paste code and click analyze</p>}
            </div>
          </div>
        </div>
      )}
                {sending ? "..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
          ))}
        </div>
      )}
    }
  };

  const sendDocument = async () => {
    if (!docInput.trim()) return;
    setDocResult("Analyzing...");
    try {
      const res = await assistantAPI.document(docInput, docTask);
      setDocResult(res.data.result);
    } catch {
      setDocResult("Connection failed. Check AI Engine.");
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-black mb-2">
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            AI Assistant
          </span>
        </h1>
        <p className="text-white/50">General AI assistant -- chat, code, translation, document analysis</p>
      </div>
{tab === "translate" && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="glass-card">
            <h3 className="text-lg font-bold text-white mb-4">Input Text</h3>
            <select value={transTarget} onChange={(e) => setTransTarget(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm mb-4">
              <option value="zh-TW">Chinese (TW)</option>
              <option value="zh-CN">Chinese (CN)</option>
              <option value="en-US">English</option>
              <option value="ja-JP">Japanese</option>
              <option value="ko-KR">Korean</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="es">Spanish</option>
            </select>
            <textarea value={transText} onChange={(e) => setTransText(e.target.value)}
              placeholder="Enter text to translate..." rows={8}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50" />
            <button onClick={sendTranslate} className="btn-primary w-full mt-4">Translate</button>
          </div>
          <div className="glass-card">
            <h3 className="text-lg font-bold text-white mb-4">Translation</h3>
            <div className="bg-white/5 rounded-xl p-4 min-h-[300px]">
              {transResult ? <p className="text-white/80 whitespace-pre-wrap">{transResult}</p>
              : <p className="text-white/30 text-center py-12">Enter text and click translate</p>}
            </div>
          </div>
        </div>
      )}

      {tab === "document" && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="glass-card">
            <h3 className="text-lg font-bold text-white mb-4">Document Content</h3>
            <select value={docTask} onChange={(e) => setDocTask(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm mb-4">
              <option value="summarize">Summarize</option>
              <option value="analyze">Analyze</option>
              <option value="extract">Extract Key Info</option>
            </select>
            <textarea value={docInput} onChange={(e) => setDocInput(e.target.value)}
              placeholder="Paste article, report, or notes..." rows={12}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50" />
            <button onClick={sendDocument} className="btn-primary w-full mt-4">Analyze</button>
          </div>
          <div className="glass-card">
            <h3 className="text-lg font-bold text-white mb-4">Result</h3>
            <div className="bg-white/5 rounded-xl p-4 min-h-[300px]">
              {docResult ? <p className="text-white/80 whitespace-pre-wrap">{docResult}</p>
              : <p className="text-white/30 text-center py-12">Paste content and click analyze</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}