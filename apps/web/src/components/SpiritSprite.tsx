import { useState, useEffect } from "react";
import { SPECIES_EMOJI } from "@nightasaur/shared";

const PC: Record<string, string[]> = {
  FIRE: ["#ff4500", "#ff6b35", "#ffd700"],
  WATER: ["#00b4d8", "#48cae4", "#90e0ef"],
  LIGHT: ["#ffd700", "#fffacd", "#ffffe0"],
  SHADOW: ["#6b21a8", "#4c1d95", "#a855f7"],
  STAR: ["#e879f9", "#c084fc", "#fdf4ff"],
  ILLUSION: ["#f472b6", "#ec4899", "#fce7f3"],
  MOON: ["#94a3b8", "#cbd5e1", "#e2e8f0"],
  NATURE: ["#22c55e", "#4ade80", "#bbf7d0"],
  THUNDER: ["#facc15", "#fef08a", "#fef9c3"],
  ICE: ["#67e8f9", "#a5f3fc", "#e0f2fe"],
};

const EI: Record<string, string> = {
  FIRE: "🔥", WATER: "💧", LIGHT: "✨",
  SHADOW: "🌑", STAR: "⭐", ILLUSION: "🦊",
  MOON: "🌙", NATURE: "🌿", THUNDER: "⚡",
  ICE: "❄️",
};

const ST: Record<string, string> = {
  "蛋": "scale-90 opacity-80",
  "幼體": "scale-100",
  "少年體": "scale-105",
  "成年體": "scale-110 brightness-110",
  "究極體": "scale-115 brightness-125 saturate-150",
  "傳說體": "scale-120 brightness-150 saturate-200",
};
export default function SpiritSprite({
  species, element, stage, outfit, accessory, expression, size = 160, animate = true,
}: {
  species?: string; element?: string; stage?: string;
  outfit?: string; accessory?: string; expression?: string; size?: number; animate?: boolean;
}) {
  const [ps, setPs] = useState<{ x: number; y: number; color: string; delay: number }[]>([]);
  const [bounce, setBounce] = useState(false);
  const [glow, setGlow] = useState(0);

  useEffect(() => {
    if (!element || !animate) return;
    const colors = PC[element] || ["#5eead4", "#0a7eaa"];
    setPs(Array.from({ length: 12 }, (_, i) => ({
      x: (Math.random() - 0.5) * 1.4,
      y: (Math.random() - 0.5) * 1.4,
      color: colors[i % colors.length],
      delay: Math.random() * 3,
    })));
  }, [element, animate]);

  useEffect(() => {
    if (!animate) return;
    const iv = setInterval(() => {
      setBounce(true); setGlow(1);
      setTimeout(() => { setBounce(false); setGlow(0); }, 600);
    }, 4000);
    return () => clearInterval(iv);
  }, [animate]);

  const main = SPECIES_EMOJI[species || ""] || EI[element || ""] || "🦕";
  const stageCls = ST[stage || ""] || "";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      {animate && (
        <div className="absolute inset-0 rounded-full transition-opacity duration-700" style={{
          background: `radial-gradient(circle, ${PC[element||""]?.[0]||"#5eead4"}22 0%, transparent 70%)`,
          opacity: glow * 0.8 + 0.15,
          transform: `scale(${1 + glow * 0.15})`,
        }} />
      )}
      {animate && <div className="absolute inset-0 rounded-full border-2 border-dashed border-white/10 animate-spin-slow" />}
      {animate && ps.map((p, i) => (
        <div key={i} className="absolute w-2 h-2 rounded-full animate-particle" style={{
          backgroundColor: p.color, left: "50%", top: "50%",
          animationDelay: `${p.delay}s`,
          "--tx": `${p.x * 60}px`, "--ty": `${p.y * 60}px`,
        } as any} />
      ))}
      <div className={`relative z-10 transition-all duration-500 ${stageCls} ${bounce ? "animate-spirit-bounce" : ""}`}>
        <span className="drop-shadow-2xl" style={{ fontSize: size * 0.6 }}>{main}</span>
      </div>
    </div>
  );
}