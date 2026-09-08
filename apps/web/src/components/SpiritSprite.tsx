// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Nightasaur Team

/**
 * SpiritSprite — 精靈動作建模引擎
 * 多種動作狀態 + 元素粒子特效 + 階段成長表現
 */

import { useState, useEffect, useRef } from "react";

// ─── 元素配色 ───
const PC: Record<string, string[]> = {
  FIRE:     ["#ff4500","#ff6b35","#ffd700","#ff2d00"],
  WATER:    ["#00b4d8","#48cae4","#90e0ef","#0077b6"],
  LIGHT:    ["#ffd700","#fffacd","#ffffe0","#fbbf24"],
  SHADOW:   ["#6b21a8","#4c1d95","#a855f7","#9333ea"],
  STAR:     ["#e879f9","#c084fc","#fdf4ff","#d946ef"],
  ILLUSION: ["#f472b6","#ec4899","#fce7f3","#db2777"],
  MOON:     ["#94a3b8","#cbd5e1","#e2e8f0","#64748b"],
  NATURE:   ["#22c55e","#4ade80","#bbf7d0","#16a34a"],
  THUNDER:  ["#facc15","#fef08a","#fef9c3","#eab308"],
  ICE:      ["#67e8f9","#a5f3fc","#e0f2fe","#22d3ee"],
};

const EI: Record<string, string> = {
  FIRE:"🔥", WATER:"💧", LIGHT:"✨", SHADOW:"🌑", STAR:"⭐",
  ILLUSION:"🦊", MOON:"🌙", NATURE:"🌿", THUNDER:"⚡", ICE:"❄️",
};

// 階段表情 + 大小
const STAGE_META: Record<string, {emoji:string; scale:number; glow:string}> = {
  EGG:       {emoji:"🥚", scale:0.7, glow:"0 0 10px rgba(255,255,255,0.1)"},
  HATCHLING: {emoji:"🐣", scale:0.85, glow:"0 0 15px rgba(255,255,255,0.2)"},
  JUVENILE:  {emoji:"🦎", scale:1.0, glow:"0 0 20px rgba(255,255,255,0.3)"},
  ADULT:     {emoji:"🦕", scale:1.15, glow:"0 0 30px rgba(255,255,255,0.4)"},
  ULTIMATE:  {emoji:"👑", scale:1.3, glow:"0 0 40px rgba(255,255,255,0.6)"},
  LEGENDARY: {emoji:"🌟", scale:1.5, glow:"0 0 60px rgba(255,255,255,0.8)"},
};

// 表情對應的圖示
const EXPR_ICON: Record<string, string> = {
  "開心":"😄","認真":"😤","慵懶":"😴","酷炫":"😎","撒嬌":"🥺","興奮":"🤩",
};

// 元素粒子設定
const PARTICLE_CONFIG: Record<string, {count:number; shape:string; speed:number; twinkle:boolean}> = {
  FIRE:     {count:8, shape:"drop", speed:1.2, twinkle:true},
  WATER:    {count:6, shape:"circle", speed:1.0, twinkle:false},
  LIGHT:    {count:10, shape:"star", speed:0.8, twinkle:true},
  SHADOW:   {count:6, shape:"ring", speed:1.5, twinkle:false},
  STAR:     {count:12, shape:"star", speed:0.6, twinkle:true},
  ILLUSION: {count:8, shape:"circle", speed:0.9, twinkle:true},
  MOON:     {count:5, shape:"ring", speed:0.7, twinkle:false},
  NATURE:   {count:7, shape:"leaf", speed:1.1, twinkle:false},
  THUNDER:  {count:6, shape:"bolt", speed:1.8, twinkle:true},
  ICE:      {count:9, shape:"crystal", speed:0.8, twinkle:true},
};

export type AnimState = "idle" | "happy" | "attack" | "hurt" | "sleep" | "evolve" | "special";

interface SpiritSpriteProps {
  species?: string;
  element?: string;
  stage?: string;       // EGG|HATCHLING|JUVENILE|ADULT|ULTIMATE|LEGENDARY
  outfit?: string;
  accessory?: string;
  expression?: string;
  size?: number;
  animate?: boolean;
  animState?: AnimState;  // 強制指定動作狀態
  onAnimEnd?: () => void; // 動作結束回調
}
export default function SpiritSprite({
  species, element = "FIRE", stage = "EGG", outfit, accessory,
  expression, size = 160, animate = true, animState, onAnimEnd,
}: SpiritSpriteProps) {
  const [currentState, setCurrentState] = useState<AnimState>("idle");
  const [particles, setParticles] = useState<any[]>([]);
  const [bounce, setBounce] = useState(false);
  const [flash, setFlash] = useState(false);
  const [glowIntensity, setGlow] = useState(0.3);
  const [shake, setShake] = useState(false);
  const [rotate, setRotate] = useState(0);
  const [scalePulse, setScalePulse] = useState(1);
  const animTimers = useRef<any[]>([]);

  const meta = STAGE_META[stage] || STAGE_META.EGG;
  const colors = PC[element] || PC.FIRE;
  const pConfig = PARTICLE_CONFIG[element] || PARTICLE_CONFIG.FIRE;
  const emoji = meta.emoji;
  const exprIcon = expression ? (EXPR_ICON[expression] || "") : "";

  // 閒置循環動畫
  useEffect(() => {
    if (!animate) return;
    const idle = setInterval(() => {
      setBounce(true);
      setTimeout(() => setBounce(false), 400);
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(idle);
  }, [animate]);
// 粒子系統
  useEffect(() => {
    if (!animate || !element) return;
    const cfg = PARTICLE_CONFIG[element] || PARTICLE_CONFIG.FIRE;
    const count = currentState === "evolve" ? 20 : currentState === "happy" ? 15 : cfg.count;
    const parts = Array.from({length: count}, (_, i) => ({
      id: i, x: (Math.random() - 0.5) * 2,
      y: Math.random() * -1.5,
      size: 3 + Math.random() * 6,
      color: colors[i % colors.length],
      delay: Math.random() * 2,
      duration: 1.5 + Math.random() * 2,
    }));
    setParticles(parts);
  }, [element, animate, currentState]);
// 外部 animState 控制
  useEffect(() => {
    if (!animState) return;
    setCurrentState(animState);
    animTimers.current.forEach(t => clearTimeout(t));
    animTimers.current = [];

    switch (animState) {
      case "happy":
        setBounce(true); setGlow(0.8);
        animTimers.current.push(setTimeout(() => { setBounce(false); setGlow(0.3); }, 800));
        break;
      case "attack":
        setShake(true); setRotate(-5);
        animTimers.current.push(setTimeout(() => { setShake(false); setRotate(0); }, 400));
        break;
      case "hurt":
        setFlash(true); setShake(true); setGlow(0.1);
        animTimers.current.push(setTimeout(() => { setFlash(false); setShake(false); setGlow(0.3); }, 500));
        break;
      case "sleep":
        setRotate(90);
        break;
      case "evolve":
        setGlow(1); setScalePulse(1.3);
        animTimers.current.push(setTimeout(() => { setScalePulse(1); setGlow(0.5); }, 1500));
        break;
      case "special":
        setGlow(1); setRotate(360);
        animTimers.current.push(setTimeout(() => { setRotate(0); setGlow(0.3); }, 1000));
        break;
      default: setGlow(0.3);
    }

    const duration = animState === "evolve" ? 2000 : animState === "attack" ? 500 : 800;
    animTimers.current.push(setTimeout(() => {
      setCurrentState("idle");
      onAnimEnd?.();
    }, duration));

    return () => animTimers.current.forEach(t => clearTimeout(t));
  }, [animState]);
const s = size * meta.scale;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size + 30 }}>

      {/* 光環 */}
      <div className="absolute inset-0 rounded-full transition-all duration-700" style={{
        background: `radial-gradient(circle, ${colors[0]}33 0%, ${colors[1]}22 40%, transparent 70%)`,
        opacity: glowIntensity,
        transform: `scale(${1 + glowIntensity * 0.2})`,
      }} />

      {/* 進化旋轉光環 */}
      {currentState === "evolve" && (
        <div className="absolute inset-0 rounded-full animate-spin-slow" style={{
          border: `3px solid ${colors[0]}`,
          borderTopColor: "transparent",
        }} />
      )}

      {/* 粒子 */}
      {animate && particles.map(p => (
        <div key={p.id} className="absolute rounded-full" style={{
          left: "50%", top: "50%",
          width: p.size, height: p.size,
          backgroundColor: p.color,
          opacity: currentState === "hurt" ? 0.2 : 0.7,
          animation: `floatUp ${p.duration}s ease-out ${p.delay}s infinite`,
          transform: `translate(${p.x * 40}px, ${p.y * 30}px)`,
          boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
        }} />
      ))}

      {/* 受傷閃爍 */}
      {flash && <div className="absolute inset-0 bg-white/30 rounded-full animate-ping" />}

      {/* 主體 */}
      <div className="relative z-10 transition-all duration-300 select-none" style={{
        transform: `scale(${scalePulse}) rotate(${rotate}deg) translateX(${shake ? (Math.random() - 0.5) * 8 : 0}px) translateY(${currentState === "sleep" ? 5 : bounce ? -8 : 0}px)`,
      }}>
        <span className="block text-center drop-shadow-xl transition-all duration-300" style={{
          fontSize: s,
          filter: flash ? "brightness(200%) saturate(0%)" : `brightness(${80 + glowIntensity * 40}%)`,
        }}>
          {emoji}
        </span>

        {/* 表情 overlay */}
        {exprIcon && (
          <span className="absolute -top-2 -right-4 text-lg animate-bounce">{exprIcon}</span>
        )}

        {/* 服裝 */}
        {outfit && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-sm whitespace-nowrap"
            style={{ filter: `drop-shadow(0 0 3px ${colors[0]})` }}>
            {outfit}
          </div>
        )}

        {/* 配件 */}
        {accessory && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-sm" style={{ filter: "drop-shadow(0 0 4px gold)" }}>
            {accessory}
          </div>
        )}
      </div>
    </div>
  );
}