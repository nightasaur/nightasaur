// ─────────────────────────────────
// Nightasaur 共用型別定義
// ─────────────────────────────────

export const ELEMENTS = [
  "FIRE", "WATER", "LIGHT", "SHADOW", "STAR",
  "ILLUSION", "MOON", "NATURE", "THUNDER", "ICE",
] as const;

export type Element = (typeof ELEMENTS)[number];

export const STAGES = [
  "EGG", "HATCHLING", "JUVENILE", "ADULT", "ULTIMATE", "LEGENDARY",
] as const;

export type Stage = (typeof STAGES)[number];

export const ELEMENT_EMOJI: Record<Element, string> = {
  FIRE: "🔥", WATER: "💧", LIGHT: "✨", SHADOW: "🌑",
  STAR: "⭐", ILLUSION: "🦊", MOON: "🌙", NATURE: "🌿",
  THUNDER: "⚡", ICE: "❄️",
};

export const STAGE_LABELS: Record<Stage, string> = {
  EGG: "蛋", HATCHLING: "幼體", JUVENILE: "少年體",
  ADULT: "成年體", ULTIMATE: "究極體", LEGENDARY: "傳說體",
};

export const STAGE_EMOJI: Record<Stage, string> = {
  EGG: "🥚", HATCHLING: "🐣", JUVENILE: "🦎",
  ADULT: "🦕", ULTIMATE: "👑", LEGENDARY: "🌟",
};

export interface SpiritStats {
  hp: number;
  atk: number;
  def: number;
  spd: number;
  maxHp: number;
}
// 地球生物外觀資料庫
export { ALL_SPECIES, SPECIES_CATEGORIES, SPECIES_EMOJI, SPECIES_LABELS, getSpeciesByCategory } from "./species.js";
export type { SpeciesEntry } from "./species.js";