import { type SpiritCharacter } from "../config/spirits";

interface SpiritAvatarProps {
  spirit: SpiritCharacter;
  size?: number;
  className?: string;
}

export default function SpiritAvatar({ spirit, size = 96, className = "" }: SpiritAvatarProps) {
  // 有真图 → 显示图片
  if (spirit.image) {
    return (
      <img
        src={spirit.image}
        alt={spirit.name}
        className={`object-cover rounded-full ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  // 无真图 → emoji + 颜色圈 + 光晕
  return (
    <div
      className={`relative flex items-center justify-center rounded-full ${className}`}
      style={{ width: size, height: size }}
    >
      {/* 外圈光晕 */}
      <div
        className="absolute inset-0 rounded-full blur-md opacity-40"
        style={{ background: spirit.color }}
      />
      {/* 主圈 */}
      <div
        className="relative flex items-center justify-center rounded-full border-2"
        style={{
          width: size,
          height: size,
          background: `radial-gradient(circle at 30% 30%, ${spirit.color}55, ${spirit.color}22)`,
          borderColor: `${spirit.color}88`,
        }}
      >
        <span style={{ fontSize: size * 0.5, lineHeight: 1 }}>{spirit.emoji}</span>
      </div>
    </div>
  );
}