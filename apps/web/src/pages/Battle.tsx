// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Nightasaur Team

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { spiritsAPI } from "../api/client";

interface BattleUnit {
  id: string;
  name: string;
  element: string;
  stage: string;
  level: number;
  stats: { hp: number; atk: number; def: number; spd: number; magic: number; maxHp: number };
  skills: { id: string; name: string; power: number; element: string }[];
}

interface BattleResult {
  playerDamage: number; enemyDamage: number;
  playerHp: number; enemyHp: number;
  message: string; critical: boolean; effective: number;
  xpGained: number; victory: boolean;
}

const EI: Record<string, string> = {
  FIRE: "🔥", WATER: "💧", LIGHT: "✨", SHADOW: "🌑", STAR: "⭐",
  ILLUSION: "🦊", MOON: "🌙", NATURE: "🌿", THUNDER: "⚡", ICE: "❄️",
};

export default function Battle() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const [player, setPlayer] = useState<BattleUnit | null>(null);
  const [enemy, setEnemy] = useState<BattleUnit | null>(null);
  const [playerHp, setPlayerHp] = useState(0);
  const [enemyHp, setEnemyHp] = useState(0);
  const [msg, setMsg] = useState("點擊「遭遇野生精靈」開始戰鬥！");
  const [battling, setBattling] = useState(false);
  const [victory, setVictory] = useState<boolean | null>(null);
  const [spirit, setSpirit] = useState<any>(null);

  useEffect(() => { if (id) loadSpirit(); }, [id]);

  const loadSpirit = async () => {
    try { const res = await spiritsAPI.getById(id!); setSpirit(res.data.spirit || res.data); }
    catch { nav("/spirits"); }
  };

  const encounter = async () => {
    setBattling(true); setVictory(null);
    try {
      const res = await fetch(`/api/battle/encounter/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("nightasaur_token")}` },
      });
      const data = await res.json();
      setPlayer(data.player); setEnemy(data.wild);
      setPlayerHp(data.player.stats.hp); setEnemyHp(data.wild.stats.hp);
      setMsg(`⚔️ ${data.wild.name} 出現了！`);
    } catch { setMsg("連線失敗"); setBattling(false); }
  };

  const act = async (type: "ATTACK" | "SKILL" | "DEFEND" | "HEAL") => {
    if (!player || !enemy) return;
    try {
      const res = await fetch("/api/battle/action", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("nightasaur_token")}` },
        body: JSON.stringify({ player, enemy, action: { type } }),
      });
      const r: BattleResult = await res.json();
      setPlayerHp(r.playerHp); setEnemyHp(r.enemyHp); setMsg(r.message);
      if (r.victory) { setVictory(true); setBattling(false); setTimeout(() => loadSpirit(), 500); }
      else if (r.playerHp <= 0) { setVictory(false); setBattling(false); }
    } catch { setMsg("連線失敗"); }
  };

  if (!spirit) return <div className="min-h-screen pt-24 text-center text-white/50">載入中...</div>;
return (
    <div className="min-h-screen pt-24 pb-12 px-4 max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-black mb-2">
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            ⚔️ 精靈對戰
          </span>
        </h1>
        <p className="text-white/50">{spirit.name} 的冒險</p>
      </div>

      {enemy && (
        <div className="glass-card mb-6 text-center">
          <div className="text-6xl mb-2">{EI[enemy.element] || "❓"}</div>
          <h3 className="text-xl font-bold text-white">{enemy.name}</h3>
          <p className="text-white/50 text-sm">Lv.{enemy.level} {enemy.stage}</p>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-white/60 mb-1">
              <span>HP</span><span>{enemyHp}/{enemy.stats.maxHp}</span>
            </div>
            <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-red-500 to-pink-500 rounded-full transition-all duration-300"
                style={{ width: `${(enemyHp / enemy.stats.maxHp) * 100}%` }} />
            </div>
          </div>
        </div>
      )}

      {enemy && <div className="text-center text-2xl font-bold text-white/30 mb-6">⚡ VS ⚡</div>}

      {player && (
        <div className="glass-card mb-6 text-center">
          <div className="text-6xl mb-2">{EI[player.element] || "❓"}</div>
          <h3 className="text-xl font-bold text-white">{player.name}</h3>
          <p className="text-white/50 text-sm">Lv.{player.level} {player.stage}</p>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-white/60 mb-1">
              <span>HP</span><span>{playerHp}/{player.stats.maxHp}</span>
            </div>
            <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full transition-all duration-300"
                style={{ width: `${(playerHp / player.stats.maxHp) * 100}%` }} />
            </div>
          </div>
          <div className="grid grid-cols-5 gap-2 mt-4 text-xs">
            {[{ label: "攻擊", val: player.stats.atk }, { label: "防禦", val: player.stats.def },
              { label: "速度", val: player.stats.spd }, { label: "魔力", val: player.stats.magic },
              { label: "生命", val: player.stats.maxHp },
            ].map((s) => (
              <div key={s.label} className="bg-white/5 rounded-lg p-2">
                <div className="text-white/40">{s.label}</div>
                <div className="text-white font-bold">{s.val}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="glass-card mb-6">
        <p className="text-white/80 text-center text-sm whitespace-pre-wrap">{msg}</p>
      </div>

      {enemy ? (
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => act("ATTACK")} disabled={(!battling && victory === null) || playerHp <= 0}
            className="btn-primary disabled:opacity-40">⚔️ 攻擊</button>
          <button onClick={() => act("SKILL")} disabled={(!battling && victory === null) || playerHp <= 0}
            className="glass-card py-3 text-white font-bold rounded-xl hover:bg-white/10 disabled:opacity-40">✨ 技能</button>
          <button onClick={() => act("DEFEND")} disabled={(!battling && victory === null) || playerHp <= 0}
            className="glass-card py-3 text-white font-bold rounded-xl hover:bg-white/10 disabled:opacity-40">🛡️ 防禦</button>
          <button onClick={() => act("HEAL")} disabled={(!battling && victory === null) || playerHp <= 0}
            className="glass-card py-3 text-white font-bold rounded-xl hover:bg-white/10 disabled:opacity-40">💚 回復</button>
        </div>
      ) : (
        <button onClick={encounter} className="btn-primary w-full text-lg">⚔️ 遭遇野生精靈</button>
      )}

      {victory !== null && (
        <div className={`mt-6 glass-card text-center ${victory ? "border-teal-500/30" : "border-red-500/30"}`}>
          <div className="text-5xl mb-3">{victory ? "🎉" : "😵"}</div>
          <h3 className={`text-2xl font-bold mb-2 ${victory ? "text-teal-300" : "text-red-300"}`}>
            {victory ? "勝利！" : "戰敗..."}
          </h3>
          <button onClick={encounter} className="btn-primary mt-4">再戰一次</button>
        </div>
      )}

      <div className="mt-6 text-center">
        <button onClick={() => nav(`/spirits/${id}`)} className="text-white/50 hover:text-white transition text-sm">
          ← 返回精靈詳情
        </button>
      </div>
    </div>
  );
}