// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Nightasaur Team

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { spiritsAPI } from "../api/client";

const EI: Record<string, string> = {
  FIRE: "🔥", WATER: "💧", LIGHT: "✨", SHADOW: "🌑", STAR: "⭐",
  ILLUSION: "🦊", MOON: "🌙", NATURE: "🌿", THUNDER: "⚡", ICE: "❄️",
};

const CATEGORY_ICONS: Record<string, string> = {
  ELEMENT: "🔥", SPIRIT: "🐉", MATH: "🔢", LOGIC: "🧠", GENERAL: "💡", SPECIES: "🐾",
};

export default function Battle() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const [spirit, setSpirit] = useState<any>(null);
  const [battle, setBattle] = useState<any>(null);
  const [question, setQuestion] = useState<any>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("⚔️ 點擊「開始對戰」挑戰野生精靈！");
  const [showResult, setShowResult] = useState(false);

  useEffect(() => { if (id) loadSpirit(); }, [id]);

  const loadSpirit = async () => {
    try { const res = await spiritsAPI.getById(id!); setSpirit(res.data.spirit || res.data); }
    catch { nav("/spirits"); }
  };

  const startBattle = async () => {
    setLoading(true); setShowResult(false); setResult(null); setSelected(null);
    try {
      const res = await fetch(`/api/battle/quiz/start/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("nightasaur_token")}` },
      });
      const data = await res.json();
      setBattle(data.battle);
      setQuestion(data.question);
      setMsg(`⚔️ ${data.battle.enemyName} 出現了！答對題目攻擊它！`);
    } catch { setMsg("連線失敗"); }
    setLoading(false);
  };

  const answer = async (index: number) => {
    if (selected !== null) return;
    setSelected(index); setLoading(true);
    try {
      const res = await fetch(`/api/battle/quiz/answer/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("nightasaur_token")}` },
        body: JSON.stringify({ answerIndex: index }),
      });
      const data = await res.json();
      setResult(data);
      setBattle((b: any) => ({ ...b, playerHp: data.playerHp, enemyHp: data.enemyHp, correctCount: data.correctCount }));
      setMsg(data.message);
      setShowResult(true);
      if (data.finished) { setLoading(false); return; }
      setTimeout(() => {
        setQuestion(data.nextQuestion);
        setSelected(null);
        setShowResult(false);
        setResult(null);
        setLoading(false);
      }, 2000);
    } catch { setMsg("連線失敗"); setLoading(false); }
  };

  if (!spirit) return <div className="min-h-screen pt-24 text-center text-white/50">載入中...</div>;

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 max-w-3xl mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-black mb-2">
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            🧠 益智對戰
          </span>
        </h1>
        <p className="text-white/50">{spirit.name} 的知識挑戰</p>
      </div>
{/* 敵方 + 我方 HP 條 */}
      {battle && (
        <>
          <div className="glass-card mb-3 text-center">
            <div className="flex items-center gap-4 justify-center">
              <span className="text-4xl">{EI[battle.enemyElement] || "❓"}</span>
              <div>
                <div className="text-white font-bold">{battle.enemyName}</div>
                <div className="text-white/40 text-xs">Lv.{battle.enemyLevel}</div>
              </div>
              <div className="flex-1 max-w-[200px]">
                <div className="flex justify-between text-xs text-white/60 mb-1"><span>HP</span><span>{battle.enemyHp}/{battle.enemyMaxHp}</span></div>
                <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-red-500 to-pink-500 rounded-full transition-all duration-500"
                    style={{ width: `${(battle.enemyHp / battle.enemyMaxHp) * 100}%` }} />
                </div>
              </div>
            </div>
            {result && result.damage > 0 && <div className="text-red-400 font-bold text-lg mt-2">-{result.damage}{result.critical ? " 💥" : ""}{result.effective > 1 ? " 🔥剋制" : ""}</div>}
          </div>

          <div className="text-center text-lg font-bold text-white/30 mb-3">⚡ VS ⚡</div>

          <div className="glass-card mb-6 text-center">
            <div className="flex items-center gap-4 justify-center">
              <span className="text-4xl">{EI[battle.playerElement] || "❓"}</span>
              <div>
                <div className="text-white font-bold">{battle.playerName}</div>
                <div className="text-white/40 text-xs">答對: {battle.correctCount}/{battle.totalQuestions}</div>
              </div>
              <div className="flex-1 max-w-[200px]">
                <div className="flex justify-between text-xs text-white/60 mb-1"><span>HP</span><span>{battle.playerHp}/{battle.playerMaxHp}</span></div>
                <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full transition-all duration-500"
                    style={{ width: `${(battle.playerHp / battle.playerMaxHp) * 100}%` }} />
                </div>
              </div>
            </div>
            {result && result.enemyDamage > 0 && <div className="text-red-400 font-bold text-lg mt-2">-{result.enemyDamage} ❌</div>}
          </div>
        </>
      )}

      {/* 訊息 */}
      <div className="glass-card mb-4">
        <p className="text-white/80 text-center text-sm whitespace-pre-wrap">{msg}</p>
      </div>
{/* 題目 */}
      {question && !result?.finished && (
        <div className="glass-card mb-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">{CATEGORY_ICONS[question.category] || "❓"}</span>
            <span className="text-white/40 text-xs bg-white/5 px-2 py-1 rounded">
              {{ ELEMENT: "屬性知識", SPIRIT: "精靈知識", MATH: "計算題", LOGIC: "邏輯推理", SPECIES: "生物知識" }[question.category] || "綜合"}
            </span>
            <span className="text-white/30 text-xs ml-auto">第 {battle.questionIndex + 1}/{battle.totalQuestions} 題</span>
          </div>
          <h3 className="text-lg font-bold text-white mb-4">{question.question}</h3>
          <div className="grid grid-cols-1 gap-2">
            {question.options.map((opt: string, i: number) => {
              let cls = "glass-card p-3 rounded-xl text-white text-left hover:bg-white/10 transition-all cursor-pointer border ";
              if (selected === null) cls += "border-white/5 hover:border-teal-400/50";
              else if (result?.correctAnswer === i) cls += "border-teal-400/50 bg-teal-500/20";
              else if (selected === i) cls += "border-red-400/50 bg-red-500/20";
              else cls += "border-white/5 opacity-50";
              return (
                <button key={i} onClick={() => answer(i)} disabled={selected !== null} className={cls}>
                  <span className="text-white/40 mr-2">{String.fromCharCode(65 + i)}.</span> {opt}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 結果 */}
      {showResult && result && (
        <div className={`glass-card mb-4 text-center ${result.correct ? "border-teal-500/30" : "border-red-500/30"}`}>
          <div className="text-3xl mb-2">{result.correct ? "✅" : "❌"}</div>
          <p className="text-white/60 text-sm mb-2">{result.explanation}</p>
          {result.finished && (
            <div className="mt-4">
              <div className="text-5xl mb-3">{result.victory ? "🎉" : "😵"}</div>
              <h3 className={`text-2xl font-bold mb-2 ${result.victory ? "text-teal-300" : "text-red-300"}`}>
                {result.victory ? "勝利！" : "戰敗..."}
              </h3>
              {result.xpGained > 0 && <p className="text-white/60">+{result.xpGained} 經驗</p>}
              {result.coinsGained > 0 && <p className="text-yellow-400">+{result.coinsGained} 金幣</p>}
              <button onClick={startBattle} className="btn-primary mt-4">再戰一次</button>
            </div>
          )}
        </div>
      )}

      {/* 開始 */}
      {!battle && (
        <button onClick={startBattle} disabled={loading} className="btn-primary w-full text-lg">
          {loading ? "⏳ 載入中..." : "🧠 開始益智對戰"}
        </button>
      )}

      <div className="mt-6 text-center">
        <button onClick={() => nav(`/spirits/${id}`)} className="text-white/50 hover:text-white transition text-sm">
          ← 返回精靈詳情
        </button>
      </div>
    </div>
  );
}