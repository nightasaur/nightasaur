// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Nightasaur Team

/**
 * 精靈屬性相剋系統
 * 根據寶可夢式循環相剋設計
 */
export const ELEMENT_ADVANTAGES: Record<string, string[]> = {
  FIRE: ["NATURE", "ICE"],
  WATER: ["FIRE", "THUNDER"],
  LIGHT: ["SHADOW"],
  SHADOW: ["MOON", "ILLUSION"],
  STAR: ["ILLUSION"],
  ILLUSION: ["THUNDER", "MOON"],
  MOON: ["STAR"],
  NATURE: ["WATER", "LIGHT"],
  THUNDER: ["WATER"],
  ICE: ["NATURE"],
};

export const ELEMENT_DISADVANTAGES: Record<string, string[]> = {
  FIRE: ["WATER"],
  WATER: ["NATURE"],
  LIGHT: ["NATURE"],
  SHADOW: ["LIGHT"],
  STAR: ["MOON"],
  ILLUSION: ["STAR"],
  MOON: ["SHADOW"],
  NATURE: ["FIRE", "ICE"],
  THUNDER: ["ILLUSION"],
  ICE: ["FIRE"],
};

export const ELEMENT_ICONS: Record<string, string> = {
  FIRE: "🔥",
  WATER: "💧",
  LIGHT: "✨",
  SHADOW: "🌑",
  STAR: "⭐",
  ILLUSION: "🦊",
  MOON: "🌙",
  NATURE: "🌿",
  THUNDER: "⚡",
  ICE: "❄️",
};

/** 計算屬性傷害倍率 */
export function getEffectiveness(attackElement: string, defenseElement: string): number {
  if (ELEMENT_ADVANTAGES[attackElement]?.includes(defenseElement)) return 2.0;
  if (ELEMENT_DISADVANTAGES[attackElement]?.includes(defenseElement)) return 0.5;
  return 1.0;
}

/** 獲取屬性相剋描述 */
export function getEffectivenessDescription(attackElement: string, defenseElement: string): string {
  const mult = getEffectiveness(attackElement, defenseElement);
  if (mult >= 2) return `${ELEMENT_ICONS[attackElement]} 剋制 ${ELEMENT_ICONS[defenseElement]}！效果絕佳！`;
  if (mult <= 0.5) return `${ELEMENT_ICONS[defenseElement]} 抵抗 ${ELEMENT_ICONS[attackElement]}...效果不佳`;
  return "效果普通";
}