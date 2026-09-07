import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { spiritsAPI, dialogueAPI } from "../api/client";
import SpiritSprite from "../components/SpiritSprite";
import { VoiceChat, useVoiceOutput } from "../components/VoiceChat";
const STAGES = ["蛋","幼体","少年体","成年体","究极体","传说体"];
const REQ: Record<string,number> = { "幼体":1,"少年体":5,"成年体":15,"究极体":30,"传说体":60 };
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
const OUTFITS = ["🧣探险围巾","🦺战斗铠甲","🎀星光缎带","🧢训练家帽","🪖水晶头盔","⛓️暗影披风"];
const ACCS = ["💍勇气戒指","🔮占卜水晶","🗡️龙牙匕首","📿先祖护符","🪶风之羽毛"];
export default function SpiritDetail() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const [s, setS] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [evolving, setEvolving] = useState(false);
  const [evolveMsg, setEvolveMsg] = useState("");
  const [msgs, setMsgs] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [tab, setTab] = useState<"chat"|"customize">("chat");
  const [custom, setCustom] = useState<{outfit?:string;accessory?:string}>({});
  const [expression, setExpression] = useState("😄开心");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { speak, isSpeaking } = useVoiceOutput();

  useEffect(() => { if (id) load(); }, [id]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const load = async () => {
    try {
      const response = await spiritsAPI.getById(id!);
      const data = response.data;
      setS(data.spirit || data);
      setCustom(data.spirit?.customization || {});
      setExpression(data.spirit?.expression || "😄开心");
    } catch { nav("/spirits"); }
    finally { setLoading(false); }
  };

  const evolve = async () => {
    setEvolving(true); setEvolveMsg("进化中...✨");
    try {
      const response = await spiritsAPI.evolve(id!);
      const data = response.data;
      setS(data.spirit || data);
      setEvolveMsg("进化成功！🎉");
      speak("进化成功！");
    } catch (e: any) {
      setEvolveMsg(e.response?.data?.error || "进化失败");
    }
    setTimeout(() => { setEvolving(false); setEvolveMsg(""); }, 2500);
  };

  const customize = async (key: string, value: string) => {
    const nc = { ...custom, [key]: value };
    setCustom(nc);
    try { await spiritsAPI.updateCustomization(id!, nc); } catch {}
  };

  const send = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || sending) return;
    setMsgs(p => [...p, { role: "user", content: msg }]);
    setInput(""); setSending(true);
    try {
      const response = await dialogueAPI.chat(id!, msg);
      const data = response.data;
      const reply = data.reply || "...";
      setMsgs(p => [...p, { role: "assistant", content: reply }]);
      if (s) setS((x: any) => ({ ...x, level: data.spiritLevel || x.level }));
      speak(reply);
    } catch {
      setMsgs(p => [...p, { role: "assistant", content: "感应中断了🦕" }]);
    }
    setSending(false);
  };

  if (loading || !s) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-4xl animate-float">🌙</div>
    </div>
  );

  const ci = STAGES.indexOf(s.stage);
  const ns = STAGES[ci+1];
  const nr = ns ? REQ[ns]||1 : 0;
  const can = ns && s.level >= nr;
  const ec = COLS[s.element]||"from-teal-500 to-cyan-400";
return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="glass-card text-center mb-8">
        <SpiritSprite species={s.species} element={s.element} stage={s.stage}
          outfit={custom.outfit} accessory={custom.accessory} expression={expression} size={180} />
        <h1 className="text-3xl font-black text-white">{s.name}</h1>
        <div className="flex justify-center gap-3 mt-3 flex-wrap">
          <span className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${ec} text-white`}>
            {ICO[s.element]||"?"} {s.element}
          </span>
          <span className="px-3 py-1 rounded-full text-xs bg-white/10 text-white/70">
            {ICO[s.species]||"?"} {s.species||"?"}
          </span>
          <span className="px-3 py-1 rounded-full text-xs bg-white/10 text-white/70">{s.stage}</span>
          <span className="px-3 py-1 rounded-full text-xs bg-white/10 text-white/70">Lv.{s.level}</span>
        </div>
        <div className="flex justify-center gap-2 mt-4 flex-wrap">
          {EXPS.map(ex => (
            <button key={ex} onClick={() => setExpression(ex)}
              className={`px-2 py-1 rounded-lg text-xs transition-all ${
                expression===ex?"bg-teal-500/40 border border-teal-400 text-white":"bg-white/5 text-white/40"
              }`}
            >{ex}</button>
          ))}
        </div>
      </div>
<div className="flex gap-2 mb-6">
        <button onClick={() => setTab("chat")} className={`flex-1 py-3 rounded-xl font-bold transition-all ${
          tab==="chat"?"bg-teal-500/30 border border-teal-400/50 text-white":"bg-white/5 text-white/40"
        }`}>💬 陪伴你的精灵对话</button>
        <button onClick={() => setTab("customize")} className={`flex-1 py-3 rounded-xl font-bold transition-all ${
          tab==="customize"?"bg-teal-500/30 border border-teal-400/50 text-white":"bg-white/5 text-white/40"
        }`}>🎨 装扮精灵</button>
      </div>
{tab === "chat" && (
        <>
          <div className="glass-card mb-4 min-h-[360px] max-h-[500px] overflow-y-auto">
            {msgs.length === 0 && (
              <div className="text-center text-white/30 py-16">
                <SpiritSprite species={s.species} element={s.element} stage={s.stage}
                  outfit={custom.outfit} accessory={custom.accessory} size={120} />
                <p>点击下方按钮跟 {s.name} 聊天吧！</p>
                <p className="text-xs mt-2">支援语音输入 🎤 与播放 🔊</p>
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={`mb-4 ${m.role==="user"?"text-right":""}`}>
                <div className={`inline-block max-w-[80%] rounded-2xl px-4 py-3 ${
                  m.role==="user"?"bg-teal-500/30 text-white":"bg-white/5 text-white/80"
                }`}>
                  {m.content}
                  {m.role==="assistant" && (
                    <button onClick={() => speak(m.content)}
                      className="ml-2 text-sm opacity-50 hover:opacity-100">🔊</button>
                  )}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
            {isSpeaking && <div className="text-teal-300 text-sm animate-pulse text-center">🔊 精灵正在说话...</div>}
          </div>
          <div className="glass-card flex gap-3 items-center">
            <VoiceChat onSendText={send} />
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key==="Enter" && send()}
              placeholder={`跟 ${s.name} 说点什么...`}
              className="input-field flex-1" disabled={sending}
            />
            <button onClick={() => send()} disabled={sending||!input.trim()}
              className="btn-primary px-6 disabled:opacity-50"
            >{sending?"...":"发送"}</button>
          </div>
        </>
      )}
{tab === "customize" && (
        <div className="glass-card space-y-6">
          <h3 className="text-xl font-bold text-white">🎨 装扮你的精灵 — 纸娃娃系统</h3>
          <p className="text-white/60 text-sm">取得方式：进化奖励 / 每日登入 / 社群分享获得配件</p>

          {/* 大型预览 */}
          <div className="flex justify-center py-4">
            <SpiritSprite species={s.species} element={s.element} stage={s.stage}
              outfit={custom.outfit} accessory={custom.accessory} expression={expression} size={200} />
          </div>
          <p className="text-center text-white/50 text-sm -mt-2">
            {s.name} | {ICO[s.element]||"?"} {s.element} | {ICO[s.species]||"?"} {s.species||"?"} | Lv.{s.level}
          </p>

          <p className="text-white/60 mb-3 font-bold">👗 服装</p>
          <div className="flex flex-wrap gap-2">
            {OUTFITS.map(o => (
              <button key={o} onClick={() => customize("outfit", custom.outfit===o?"":o)}
                className={`px-4 py-2 rounded-xl text-sm transition-all ${
                  custom.outfit===o?"outfit-selected bg-teal-500/40 border border-teal-400 text-white":"bg-white/5 text-white/50 hover:bg-white/10"
                }`}>{o}</button>
            ))}
          </div>
          <p className="text-white/60 mb-3 font-bold">🔮 配件</p>
          <div className="flex flex-wrap gap-2">
            {ACCS.map(a => (
              <button key={a} onClick={() => customize("accessory", custom.accessory===a?"":a)}
                className={`px-4 py-2 rounded-xl text-sm transition-all ${
                  custom.accessory===a?"outfit-selected bg-teal-500/40 border border-teal-400 text-white":"bg-white/5 text-white/50 hover:bg-white/10"
                }`}>{a}</button>
            ))}
          </div>
        </div>
      )}
<div className="glass-card mt-8">
        <h3 className="text-xl font-bold text-white mb-6">📜 进化时间线</h3>
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
              <span className={`text-xs ${i===ci?"text-teal-300 font-bold":"text-white/40"}`}>{st}</span>
              {i===ci && <span className="text-xs text-teal-400">Lv.{s.level}</span>}
              {i>ci && <span className="text-xs text-white/20">Lv.{REQ[st]}</span>}
            </div>
          ))}
        </div>
        <div className="mt-8 space-y-3">
          {[
            ["❤️ 生命力",7,20],["⚔️ 攻击力",5,18],["🛡️ 防御力",4,15],["💨 速度",6,12],["🔮 魔力",8,22]
          ].map(([label, m, b]) => {
            const v = s.level * (m as number) + (ci * (b as number));
            return (
              <div key={label as string} className="flex items-center gap-3">
                <span className="w-24 text-sm text-white/60">{label}</span>
                <div className="flex-1 h-4 bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full bg-gradient-to-r ${ec} rounded-full`}
                    style={{ width: `${Math.min(100, (v/500)*100)}%` }} />
                </div>
                <span className="text-xs text-white/40 w-10">{v}</span>
              </div>
            );
          })}
        </div>
        {ns && (
          <div className="mt-6 text-center">
            <button onClick={evolve} disabled={!can||evolving}
              className={`btn-primary text-lg px-10 ${!can?"opacity-40 cursor-not-allowed":""}`}>
              {evolving?"进化中...✨":can?`进化到 ${ns} →`:`需要 Lv.${nr} 才能进化`}
            </button>
            {evolveMsg && <p className="mt-3 text-teal-300 animate-pulse">{evolveMsg}</p>}
          </div>
        )}
      </div>
    </div>
  );
}