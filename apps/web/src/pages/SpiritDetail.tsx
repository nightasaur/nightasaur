import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { spiritsAPI, dialogueAPI, generationAPI } from "../api/client";
import SpiritSprite, { AnimState } from "../components/SpiritSprite";
import { VoiceChat, useVoiceOutput } from "../components/VoiceChat";
import { STAGES, REQ, progression, growthValue } from "../utils/spiritPresentation";
import { spiritText } from "../utils/spiritCopy";
import { useLanguage } from "../contexts/LanguageContext";
const COLS: Record<string,string> = {
  FIRE:"from-orange-500 to-red-500", WATER:"from-cyan-400 to-blue-500",
  LIGHT:"from-yellow-300 to-amber-400", SHADOW:"from-violet-700 to-indigo-900",
  STAR:"from-purple-400 to-pink-500", ILLUSION:"from-fuchsia-400 to-rose-500",
  MOON:"from-slate-300 to-indigo-400", NATURE:"from-emerald-400 to-green-600",
  THUNDER:"from-yellow-300 to-amber-600", ICE:"from-blue-200 to-cyan-400",
};
const ICO: Record<string,string> = {
  FIRE:"🔥",WATER:"💧",LIGHT:"✨",SHADOW:"🌑",STAR:"⭐",ILLUSION:"🦊",
  MOON:"🌙",NATURE:"🌿",THUNDER:"⚡",ICE:"❄️",
};
const EXPS = ["😄开心","😤认真","😴慵懒","😎酷炫","🥺撒娇","🤩兴奋"];
const OUTFITS = ["🧣探索背心", "🎓學習外套", "🎀創作圍巾", "🧢專注帽子", "🪖記憶頭盔", "⛓️協作披風"];
const ACCS = ["💍學習徽章", "🔮創造水晶", "📿記憶護符", "🪶靈感羽毛", "🌟成長徽章"];
export default function SpiritDetail() {
  const { currentLanguage } = useLanguage();
  const t = (key: string, values: Record<string, string | number> = {}) => spiritText(currentLanguage, key, values);
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const [s, setS] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [art, setArt] = useState<any>(null);
  const [drawing, setDrawing] = useState(false);
  const [artError, setArtError] = useState("");
  const [evolving, setEvolving] = useState(false);
  const [evolveMsg, setEvolveMsg] = useState("");
  const [msgs, setMsgs] = useState<{ role: string; content: string; emotion?: string; displayIcon?: string }[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [tab, setTab] = useState<"chat"|"customize">("chat");
  const [custom, setCustom] = useState<{outfit?:string;accessory?:string}>({});
  const [expression, setExpression] = useState("😄开心");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { speak, isSpeaking } = useVoiceOutput();
const [animState, setAnimState] = useState<AnimState>("idle");

  useEffect(() => { if (id) {
    load();
    generationAPI.get(id).then(r => setArt(r.data)).catch(() => {});
  } }, [id]);
  const drawSpirit = async () => {
    if (!id || drawing) return;
    setDrawing(true); setArtError("");
    try {
      await generationAPI.generate(id);
      const result = await generationAPI.get(id);
      setArt(result.data);
      if (result.data?.status !== "COMPLETED") setArtError(result.data?.errorMsg || t("圖片正在生成，請稍後重新整理。"));
    } catch { setArtError(t("圖片生成暫時無法使用，請稍後再試。")); }
    finally { setDrawing(false); }
  };
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const load = async () => {
    try {
      const response = await spiritsAPI.getById(id!);
      const data = response.data;
      setS(data.spirit || data);
      setCustom((data.spirit || data).customization || {});
      setExpression((data.spirit || data).expression || "😄开心");
    } catch { nav("/spirits"); }
    finally { setLoading(false); }
  };

  const evolve = async () => {
    setEvolving(true); setEvolveMsg(t("进化中...✨"));
    try {
      const response = await spiritsAPI.evolve(id!);
      const data = response.data;
      setS(data.spirit || data);
      setEvolveMsg(t("进化成功！🎉"));
      speak(t("进化成功！"));
    } catch (e: any) {
      setEvolveMsg(e.response?.data?.error || t("进化失败"));
    }
    setTimeout(() => { setEvolving(false); setEvolveMsg(""); }, 2500);
  };

  const customize = async (key: string, value: string) => {
    const nc = { ...custom, [key]: value };
    setCustom(nc);
    try { await spiritsAPI.updateCustomization(id!, nc); } catch {}
  };

  const deleteSpirit = async () => {
    if (!window.confirm(t("刪除確認", {name: s.name}))) return;
    
    try {
      await spiritsAPI.delete(id!);
      alert(t("精靈已成功刪除"));
      nav("/spirits");
    } catch (error: any) {
      alert(error.response?.data?.message || t("刪除失敗"));
    }
  };

  const send = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || sending) return;
    setMsgs(p => [...p, { role: "user", content: msg }]);
    setInput(""); setSending(true);
    try {
      const response = await dialogueAPI.chat(id!, msg);
      const data = response.data;
      const reply = data.message;
      if (typeof reply !== "string" || !reply.trim()) throw new Error("Empty dialogue response");
      setMsgs(p => [...p, { role: "assistant", content: reply, emotion: data.emotion, displayIcon: data.displayIcon }]);
      if (s) setS((x: any) => ({ ...x, level: data.spiritLevel || x.level, currentEmotion: data.emotion, displayIcon: data.displayIcon }));
      speak(reply);
    } catch {
      setMsgs(p => [...p, { role: "assistant", content: t("感应中断了🦕") }]);
    }
    setSending(false);
  };

  if (loading || !s) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-4xl animate-float">🌙</div>
    </div>
  );

  const { index: ci, next: ns, required: nr, canEvolve: can } = progression(s.stage, s.level);
  const ec = COLS[s.element]||"from-teal-500 to-cyan-400";
return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="glass-card text-center mb-8">
        <SpiritSprite species={s.species} element={s.element} stage={s.stage}
          outfit={custom.outfit} accessory={custom.accessory} expression={expression} size={180} />
        {art?.resultUrl && <img src={art.resultUrl} alt={s.name} className="w-64 max-w-full h-auto object-contain mx-auto rounded-2xl my-4" />}
        <button className="btn-primary my-3" disabled={drawing} onClick={drawSpirit}>{drawing ? t("生成中…") : t("生成精靈圖片")}</button>
        <p className="text-sm text-white/60">{t("原創程序式生成・依元素與成長階段繪製")}</p>
        {artError && <p role="alert" className="text-red-300">{artError}</p>}
        <h1 className="text-3xl font-black text-white">{s.displayIcon && <span className="mr-2">{s.displayIcon}</span>}{s.name}</h1>
        <div className="flex justify-center gap-3 mt-3 flex-wrap">
          <span className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${ec} text-white`}>
            {ICO[s.element]||"✨"} {s.element}
          </span>
          <span className="px-3 py-1 rounded-full text-xs bg-white/10 text-white/70">
            🦕 {s.species || t("未設定物種")}
          </span>
          <span className="px-3 py-1 rounded-full text-xs bg-white/10 text-white/70">{ci >= 0 ? t(s.stage) : t("未知階段")}</span>
          <span className="px-3 py-1 rounded-full text-xs bg-white/10 text-white/70">Lv.{s.level}</span>
        </div>
        <div className="flex justify-center gap-2 mt-4 flex-wrap">
          {EXPS.map(ex => (
            <button key={ex} onClick={() => setExpression(ex)}
              className={`px-2 py-1 rounded-lg text-xs transition-all ${
                expression===ex?"bg-teal-500/40 border border-teal-400 text-white":"bg-white/5 text-white/40"
              }`}
            >{t(ex)}</button>
          ))}
        </div>
      </div>
<div className="flex gap-2 mb-6">
        <button onClick={() => setTab("chat")} className={`flex-1 py-3 rounded-xl font-bold transition-all ${
          tab==="chat"?"bg-teal-500/30 border border-teal-400/50 text-white":"bg-white/5 text-white/40"
        }`}>{t("💬 陪伴你的精灵对话")}</button>
        <button onClick={() => setTab("customize")} className={`flex-1 py-3 rounded-xl font-bold transition-all ${
          tab==="customize"?"bg-teal-500/30 border border-teal-400/50 text-white":"bg-white/5 text-white/40"
        }`}>{t("🎨 装扮精灵")}</button>
      </div>
{tab === "chat" && (
        <>
          <div className="glass-card mb-4 min-h-[360px] max-h-[500px] overflow-y-auto">
            {msgs.length === 0 && (
              <div className="text-center text-white/30 py-16">
                <SpiritSprite species={s.species} element={s.element} stage={s.stage}
                  outfit={custom.outfit} accessory={custom.accessory} size={120} />
                <p>{t("聊天提示", {name: s.name})}</p>
                <p className="text-xs mt-2">{t("支援语音输入 🎤 与播放 🔊")}</p>
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={`mb-4 ${m.role==="user"?"text-right":""}`}>
                <div className={`inline-block max-w-[80%] rounded-2xl px-4 py-3 ${
                  m.role==="user"?"bg-teal-500/30 text-white":"bg-white/5 text-white/80"
                }`}>
                  {m.role==="assistant" && m.displayIcon && (
                    <span className="mr-1.5" title={m.emotion || ""}>{m.displayIcon}</span>
                  )}
                  {m.content}
                  {m.role==="assistant" && (
                    <button onClick={() => speak(m.content)}
                      className="ml-2 text-sm opacity-50 hover:opacity-100">🔊</button>
                  )}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
            {isSpeaking && <div className="text-teal-300 text-sm animate-pulse text-center">{t("🔊 精灵正在说话...")}</div>}
          </div>
          <div className="glass-card flex flex-wrap sm:flex-nowrap gap-3 items-center">
            <VoiceChat onSendText={send} />
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key==="Enter" && send()}
              placeholder={t("聊天輸入", {name: s.name})}
              className="input-field flex-1 min-w-0" disabled={sending}
            />
            <button onClick={() => send()} disabled={sending||!input.trim()}
              className="btn-primary px-3 sm:px-6 disabled:opacity-50"
            >{sending?"...":t("发送")}</button>
          </div>
        </>
      )}
{tab === "customize" && (
        <div className="glass-card space-y-6">
          <h3 className="text-xl font-bold text-white">{t("🎨 装扮你的精灵 — 纸娃娃系统")}</h3>
          <p className="text-white/60 text-sm">{t("取得方式：成長獎勵 / 每日學習 / 社群分享獲得配件")}</p>

          {/* 大型预览 */}
          <div className="flex justify-center py-4">
            <SpiritSprite species={s.species} element={s.element} stage={s.stage}
              outfit={custom.outfit} accessory={custom.accessory} expression={expression} size={200}
              animState={animState} onAnimEnd={() => setAnimState("idle")} />
          </div>
          <p className="text-center text-white/50 text-sm -mt-2">
            {s.name} | {ICO[s.element]||"✨"} {s.element} | 🦕 {s.species || t("未設定物種")} | Lv.{s.level}
          </p>

          {/* 動作互動按鈕 */}
          <div className="flex justify-center gap-2 mt-4 flex-wrap">
            {[
              { key: "happy", icon: "😄", label: "開心" },
              { key: "practice", icon: "💪", label: "練習" },
              { key: "special", icon: "✨", label: "技能" },
              { key: "rest", icon: "🛌", label: "休息" },
              { key: "sleep", icon: "😴", label: "睡覺" },
              { key: "evolve", icon: "🌟", label: "成長" },
            ].map((a) => (
              <button key={a.key} onClick={() => setAnimState(a.key as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  animState === a.key
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                    : "bg-white/5 text-white/60 hover:bg-white/10"
                }`}>
                {a.icon} {t(a.label)}
              </button>
            ))}
          </div>

          <p className="text-white/60 mb-3 font-bold">{t("👗 服装")}</p>
          <div className="flex flex-wrap gap-2">
            {OUTFITS.map(o => (
              <button key={o} onClick={() => customize("outfit", custom.outfit===o?"":o)}
                className={`px-4 py-2 rounded-xl text-sm transition-all ${
                  custom.outfit===o?"outfit-selected bg-teal-500/40 border border-teal-400 text-white":"bg-white/5 text-white/50 hover:bg-white/10"
                }`}>{t(o)}</button>
            ))}
          </div>
          <p className="text-white/60 mb-3 font-bold">{t("🔮 配件")}</p>
          <div className="flex flex-wrap gap-2">
            {ACCS.map(a => (
              <button key={a} onClick={() => customize("accessory", custom.accessory===a?"":a)}
                className={`px-4 py-2 rounded-xl text-sm transition-all ${
                  custom.accessory===a?"outfit-selected bg-teal-500/40 border border-teal-400 text-white":"bg-white/5 text-white/50 hover:bg-white/10"
                }`}>{t(a)}</button>
            ))}
          </div>
        </div>
      )}
<div className="glass-card mt-8">
        <h3 className="text-xl font-bold text-white mb-6">{t("📜 进化时间线")}</h3>
        <div className="flex items-center justify-between flex-wrap gap-2">
          {STAGES.map((st, i) => (
            <div key={st} className={`flex flex-col items-center gap-2 transition-all ${
              i===ci?"scale-125":i<ci?"opacity-70":"opacity-30"
            }`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                i===ci?`bg-gradient-to-br ${ec} shadow-lg`:i<ci?"bg-teal-500/40":"bg-white/5"
              }`}>
                {["🥚","🐣","🦎","🐉","🦖","👑"][i]}
              </div>
              <span className={`text-xs ${i===ci?"text-teal-300 font-bold":"text-white/40"}`}>{t(st)}</span>
              {i===ci && <span className="text-xs text-teal-400">Lv.{s.level}</span>}
              {i>ci && <span className="text-xs text-white/20">Lv.{REQ[st]}</span>}
            </div>
          ))}
        </div>
        <div className="mt-8 space-y-3">
          <p className="text-sm text-white/50">{t("成長指標")}</p>
          {[
            ["❤️ 生命力",7,20],["💪 學習力",5,18],["🛡️ 專注力",4,15],["💨 反應力",6,12],["🔮 創造力",8,22]
          ].map(([label, m, b]) => {
            const v = growthValue(s.stage, s.level, m as number, b as number);
            return (
              <div key={label as string} className="flex items-center gap-3">
                <span className="w-24 text-sm text-white/60">{t(label as string)}</span>
                <div className="flex-1 h-4 bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full bg-gradient-to-r ${ec} rounded-full`}
                    style={{ width: `${Math.min(100, ((v ?? 0)/500)*100)}%` }} />
                </div>
                <span className="text-xs text-white/40 w-10">{v ?? "—"}</span>
              </div>
            );
          })}
        </div>
        {ns && (
          <div className="mt-6 text-center">
            <button onClick={evolve} disabled={!can||evolving}
              className={`btn-primary text-lg px-10 ${!can?"opacity-40 cursor-not-allowed":""}`}>
              {evolving?t("进化中...✨"):can?t("進化到", {stage: t(ns)}):t("需要等級", {level: nr ?? 0})}
            </button>
            {evolveMsg && <p className="mt-3 text-teal-300 animate-pulse">{evolveMsg}</p>}
          </div>
        )}
        {s && s.stage !== "EGG" && (
          <div className="mt-6 text-center">
            <Link to="/academy"
              className="btn-primary text-lg px-10 inline-block">
              {t("🎯 學習挑戰")}
            </Link>
          </div>
        )}
        <div className="mt-4 text-center">
          <button onClick={deleteSpirit}
            className="btn-danger text-lg px-10 inline-block bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300">
            {t("🗑️ 刪除精靈")}
          </button>
          <p className="text-white/40 text-sm mt-2">{t("此操作無法還原")}</p>
        </div>
      </div>
    </div>
  );
}
