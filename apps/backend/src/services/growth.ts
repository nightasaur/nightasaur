// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Nightasaur Team

/**
 * 精靈成長系統 — 依元素與階段決定能力成長率
 */
import { ELEMENT_EMOJI, STAGE_LABELS } from "@nightasaur/shared";

// 各元素的成長傾向
export const ELEMENT_GROWTH: Record<string, {
  hp: number; atk: number; def: number; spd: number; magic: number;
  label: string;
}> = {
  FIRE:    { hp: 1.0, atk: 1.6, def: 0.6, spd: 1.1, magic: 1.3, label: "高攻擊" },
  WATER:   { hp: 1.2, atk: 1.0, def: 1.3, spd: 0.7, magic: 1.2, label: "高防禦" },
  LIGHT:   { hp: 1.1, atk: 0.8, def: 1.0, spd: 0.8, magic: 1.6, label: "高魔力" },
  SHADOW:  { hp: 1.0, atk: 1.4, def: 0.8, spd: 1.3, magic: 1.0, label: "高速度" },
  STAR:    { hp: 0.8, atk: 1.0, def: 0.7, spd: 1.4, magic: 1.5, label: "平均全能" },
  ILLUSION:{ hp: 0.9, atk: 1.2, def: 0.9, spd: 1.5, magic: 1.1, label: "極速型" },
  MOON:    { hp: 1.3, atk: 0.9, def: 1.2, spd: 0.9, magic: 1.4, label: "耐久型" },
  NATURE:  { hp: 1.5, atk: 1.0, def: 1.3, spd: 0.6, magic: 1.0, label: "坦型" },
  THUNDER: { hp: 0.9, atk: 1.4, def: 0.7, spd: 1.6, magic: 1.2, label: "敏攻型" },
  ICE:     { hp: 1.1, atk: 1.0, def: 1.4, spd: 0.8, magic: 1.3, label: "鐵壁型" },
};

// 各階段的總成長倍率
export const STAGE_GROWTH_MULT: Record<string, number> = {
  EGG: 0.3, HATCHLING: 0.5, JUVENILE: 0.8,
  ADULT: 1.2, ULTIMATE: 1.8, LEGENDARY: 2.5,
};

export interface GrowthResult {
  hp: number;
  atk: number;
  def: number;
  spd: number;
  magic: number;
  maxHp: number;
}

/** 依精靈的元素、等級與階段計算能力值 */
export function calculateGrowth(
  element: string,
  level: number,
  stage: string
): GrowthResult {
  const growth = ELEMENT_GROWTH[element] || ELEMENT_GROWTH.FIRE;
  const mult = STAGE_GROWTH_MULT[stage] || 1.0;
  const base = 40;

  const hp = Math.floor((base * 1.5 + level * 7) * growth.hp * mult);
  const atk = Math.floor((base + level * 4) * growth.atk * mult);
  const def = Math.floor((base + level * 3.5) * growth.def * mult);
  const spd = Math.floor((base + level * 3) * growth.spd * mult);
  const magic = Math.floor((base + level * 4.5) * growth.magic * mult);

  return { hp, atk, def, spd, magic, maxHp: hp };
}

/** 獲取成長類型描述 */
export function getGrowthDescription(element: string): string {
  return ELEMENT_GROWTH[element]?.label || "普通";
}

/** 格式化能力值為可展示字串 */
export function formatStats(stats: GrowthResult): Record<string, number> {
  return {
    生命: stats.hp,
    攻擊: stats.atk,
    防禦: stats.def,
    速度: stats.spd,
    魔力: stats.magic,
  };
}