// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Nightasaur Team

/**
 * 精靈技能系統 — 等級學習、進化學習、技能升級
 */

export interface Skill {
  id: string;
  name: string;
  nameZh: string;
  element: string;
  power: number;
  accuracy: number;
  description: string;
  learnLevel: number;
  learnStage: string;
  category: "PHYSICAL" | "SPECIAL" | "STATUS";
  cooldown: number;
}

/** 技能池 — 各元素精靈可學習的技能 */
export const SKILL_POOL: Skill[] = [
  // 基礎技能（所有精靈通用）
  { id: "charge", name: "Charge", nameZh: "蓄力", element: "NORMAL", power: 30, accuracy: 100, description: "集中力量進行攻擊", learnLevel: 1, learnStage: "EGG", category: "PHYSICAL", cooldown: 0 },
  { id: "roar", name: "Roar", nameZh: "咆哮", element: "NORMAL", power: 20, accuracy: 100, description: "發出威嚇的吼叫", learnLevel: 1, learnStage: "EGG", category: "PHYSICAL", cooldown: 0 },
  { id: "dodge", name: "Dodge", nameZh: "閃避", element: "NORMAL", power: 0, accuracy: 100, description: "快速閃避攻擊", learnLevel: 3, learnStage: "HATCHLING", category: "STATUS", cooldown: 2 },
  { id: "focus", name: "Focus", nameZh: "集中", element: "NORMAL", power: 0, accuracy: 100, description: "集中精神提升下一擊威力", learnLevel: 5, learnStage: "HATCHLING", category: "STATUS", cooldown: 3 },
  
  // 🔥 火焰元素技能
  { id: "fireball", name: "Fireball", nameZh: "火球", element: "FIRE", power: 40, accuracy: 95, description: "發射火球攻擊敵人", learnLevel: 1, learnStage: "EGG", category: "SPECIAL", cooldown: 0 },
  { id: "firebloom", name: "Firebloom", nameZh: "火花綻放", element: "FIRE", power: 55, accuracy: 90, description: "綻放火焰之花", learnLevel: 8, learnStage: "HATCHLING", category: "SPECIAL", cooldown: 1 },
  { id: "flamewheel", name: "Flamewheel", nameZh: "火焰輪", element: "FIRE", power: 65, accuracy: 85, description: "化為火焰之輪撞擊", learnLevel: 15, learnStage: "JUVENILE", category: "PHYSICAL", cooldown: 2 },
  { id: "inferno", name: "Inferno", nameZh: "地獄火", element: "FIRE", power: 90, accuracy: 75, description: "釋放地獄般的烈焰", learnLevel: 25, learnStage: "ADULT", category: "SPECIAL", cooldown: 3 },
  { id: "volcano", name: "Volcano Eruption", nameZh: "火山爆發", element: "FIRE", power: 120, accuracy: 65, description: "引發火山爆發毀滅一切", learnLevel: 40, learnStage: "ULTIMATE", category: "SPECIAL", cooldown: 4 },

  // 💧 水流元素技能
  { id: "watergun", name: "Water Gun", nameZh: "水槍", element: "WATER", power: 40, accuracy: 100, description: "發射高壓水柱", learnLevel: 1, learnStage: "EGG", category: "SPECIAL", cooldown: 0 },
  { id: "tideshield", name: "Tide Shield", nameZh: "潮汐護盾", element: "WATER", power: 0, accuracy: 100, description: "用潮汐之力形成護盾", learnLevel: 7, learnStage: "HATCHLING", category: "STATUS", cooldown: 3 },
  { id: "aquajet", name: "Aqua Jet", nameZh: "水流噴射", element: "WATER", power: 60, accuracy: 100, description: "以水流推動高速撞擊", learnLevel: 14, learnStage: "JUVENILE", category: "PHYSICAL", cooldown: 1 },
  { id: "tsunami", name: "Tsunami", nameZh: "海嘯", element: "WATER", power: 95, accuracy: 70, description: "召喚巨大海嘯", learnLevel: 28, learnStage: "ADULT", category: "SPECIAL", cooldown: 3 },
  { id: "abyss", name: "Abyss Gate", nameZh: "深淵之門", element: "WATER", power: 130, accuracy: 60, description: "打開深淵之門吞噬一切", learnLevel: 45, learnStage: "ULTIMATE", category: "SPECIAL", cooldown: 5 },

  // ✨ 光元素技能
  { id: "lightarrow", name: "Light Arrow", nameZh: "光箭", element: "LIGHT", power: 35, accuracy: 100, description: "發射光之箭矢", learnLevel: 1, learnStage: "EGG", category: "SPECIAL", cooldown: 0 },
  { id: "healinglight", name: "Healing Light", nameZh: "治癒之光", element: "LIGHT", power: 0, accuracy: 100, description: "用光芒治癒傷口", learnLevel: 6, learnStage: "HATCHLING", category: "STATUS", cooldown: 3 },
  { id: "radiance", name: "Radiance", nameZh: "光輝", element: "LIGHT", power: 70, accuracy: 90, description: "釋放耀眼的光芒", learnLevel: 16, learnStage: "JUVENILE", category: "SPECIAL", cooldown: 2 },
  { id: "judgment", name: "Judgment", nameZh: "審判", element: "LIGHT", power: 100, accuracy: 80, description: "降下光明審判", learnLevel: 32, learnStage: "ADULT", category: "SPECIAL", cooldown: 3 },
  { id: "divine", name: "Divine Wrath", nameZh: "神怒", element: "LIGHT", power: 140, accuracy: 55, description: "引來神之憤怒毀滅邪惡", learnLevel: 50, learnStage: "ULTIMATE", category: "SPECIAL", cooldown: 5 },

  // 其他元素省略（可在 v1.1 擴充）
];

/** 根據等級和階段獲取可學習的技能 */
export function getAvailableSkills(element: string, level: number, stage: string): Skill[] {
  return SKILL_POOL.filter(s => {
    const stageOrder = ["EGG", "HATCHLING", "JUVENILE", "ADULT", "ULTIMATE", "LEGENDARY"];
    const currentStageIndex = stageOrder.indexOf(stage);
    const skillStageIndex = stageOrder.indexOf(s.learnStage);
    if (s.element !== "NORMAL" && s.element !== element) return false;
    if (s.learnLevel > level) return false;
    if (skillStageIndex > currentStageIndex) return false;
    return true;
  });
}

/** 獲取技能升級資訊 */
export function getSkillProgression(skill: Skill, spiritLevel: number, spiritStage: string): {
  currentPower: number;
  nextUpgradeLevel: number | null;
} {
  const stageMultiplier: Record<string, number> = {
    EGG: 0.5, HATCHLING: 0.7, JUVENILE: 1.0, ADULT: 1.3, ULTIMATE: 1.6, LEGENDARY: 2.0,
  };
  const mult = stageMultiplier[spiritStage] || 1.0;
  const currentPower = Math.round(skill.power * mult);
  const nextStage = spiritStage === "LEGENDARY" ? null : spiritStage;
  return { currentPower, nextUpgradeLevel: nextStage ? spiritLevel + 10 : null };
}