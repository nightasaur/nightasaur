// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Nightasaur Team

/**
 * 精靈戰鬥系統 — PvE 對戰
 */
import prisma from "../config/prisma.js";
import { getEffectiveness } from "@nightasaur/shared";
import { calculateGrowth } from "./growth.js";

interface BattleSpirit {
  id: string;
  name: string;
  element: string;
  stage: string;
  level: number;
  stats: { hp: number; atk: number; def: number; spd: number; magic: number; maxHp: number };
  skills: { id: string; name: string; power: number; element: string }[];
}

interface BattleAction {
  type: "ATTACK" | "SKILL" | "DEFEND" | "HEAL";
  skillId?: string;
}

interface BattleResult {
  playerDamage: number;
  enemyDamage: number;
  playerHp: number;
  enemyHp: number;
  message: string;
  critical: boolean;
  effective: number;
  xpGained: number;
  victory: boolean;
}

// 野生精靈生成配置
const WILD_SPIRITS = [
  { name: "火焰鼠", element: "FIRE", stage: "HATCHLING", minLevel: 1, maxLevel: 5 },
  { name: "水滴魚", element: "WATER", stage: "HATCHLING", minLevel: 1, maxLevel: 5 },
  { name: "光球獸", element: "LIGHT", stage: "HATCHLING", minLevel: 2, maxLevel: 6 },
  { name: "暗影貓", element: "SHADOW", stage: "HATCHLING", minLevel: 3, maxLevel: 7 },
export class BattleService {
  /** 生成野生精靈 */
  generateWildSpirit(playerLevel: number): BattleSpirit {
    const candidates = WILD_SPIRITS.filter(s => s.minLevel <= playerLevel + 5);
    const template = candidates[Math.floor(Math.random() * candidates.length)];
    const level = Math.max(1, template.minLevel + Math.floor(Math.random() * (template.maxLevel - template.minLevel + 1)));
    const stats = calculateGrowth(template.element, level, template.stage);
    return {
      id: "wild_" + Date.now(),
      name: template.name,
      element: template.element,
      stage: template.stage,
      level,
      stats,
      skills: [{ id: "charge", name: "Charge", power: 30, element: "NORMAL" }],
    };
  }

  /** 執行一個戰鬥回合 */
  async executeBattle(player: BattleSpirit, enemy: BattleSpirit, action: BattleAction): Promise<BattleResult> {
    const pStats = { ...player.stats, maxHp: player.stats.maxHp || player.stats.hp };
    const eStats = { ...enemy.stats, maxHp: enemy.stats.maxHp || enemy.stats.hp };
    let playerHp = pStats.hp;
    let enemyHp = eStats.hp;
    let message = "";
    let playerDamage = 0;
    let critical = false;
    let effective = 1;

    switch (action.type) {
      case "ATTACK": {
        const raw = Math.max(1, Math.floor(((30 + player.level * 2) * pStats.atk) / (eStats.def || 1) * 0.5));
        critical = Math.random() < 0.1;
        playerDamage = critical ? Math.floor(raw * 1.5) : raw;
        effective = getEffectiveness(player.element, enemy.element);
        playerDamage = Math.floor(playerDamage * effective);
        enemyHp = Math.max(0, enemyHp - playerDamage);
        message = `${player.name} 發動攻擊！${critical ? "💥 暴擊！" : ""}`;
        if (effective > 1) message += " 屬性剋制！效果絕佳！";
        else if (effective < 1) message += " 被抵抗了...";
        break;
      }
      case "SKILL": {
        const skill = player.skills[0] || { name: "衝撞", power: 30, element: player.element };
        const raw = Math.max(1, Math.floor(((skill.power + player.level) * pStats.atk) / (eStats.def || 1) * 0.6));
        critical = Math.random() < 0.15;
        playerDamage = critical ? Math.floor(raw * 1.5) : raw;
        effective = getEffectiveness(skill.element, enemy.element);
        playerDamage = Math.floor(playerDamage * effective);
        enemyHp = Math.max(0, enemyHp - playerDamage);
        message = `${player.name} 使用 ${skill.name}！${critical ? "💥 暴擊！" : ""}`;
        if (effective > 1) message += " 屬性剋制！效果絕佳！";
        else if (effective < 1) message += " 被抵抗了...";
        break;
      }
      case "DEFEND": {
        message = `${player.name} 進入防禦姿態！`;
        break;
      }
      case "HEAL": {
        const heal = Math.floor(pStats.maxHp * 0.2);
        playerHp = Math.min(pStats.maxHp, playerHp + heal);
        message = `${player.name} 恢復了 ${heal} 點生命！`;
        break;
      }
    }

    let enemyDamage = 0;
    if (enemyHp > 0) {
      const raw = Math.max(1, Math.floor(((20 + enemy.level) * eStats.atk) / (pStats.def || 1) * 0.4));
      enemyDamage = Math.floor(raw * (0.8 + Math.random() * 0.4));
      playerHp = Math.max(0, playerHp - enemyDamage);
      message += ` ${enemy.name} 反擊造成 ${enemyDamage} 點傷害！`;
    }

    const victory = enemyHp <= 0;
    const xpGained = victory ? 20 + enemy.level * 5 : 5;
    if (victory) message += ` 🎉 勝利！獲得 ${xpGained} 經驗值！`;
    else if (playerHp <= 0) message += ` 😵 戰敗...`;

    return { playerDamage, enemyDamage, playerHp, enemyHp, message, critical, effective, xpGained, victory };
  }

  /** 遭遇野生精靈 */
  async encounterWild(spiritId: string) {
    const spirit = await prisma.spirit.findUnique({ where: { id: spiritId } });
    if (!spirit) throw new Error("精靈不存在");
    const wild = this.generateWildSpirit(spirit.level);
    const stats = typeof spirit.stats === "string" ? JSON.parse(spirit.stats) : spirit.stats;
    const growth = calculateGrowth(spirit.element, spirit.level, spirit.stage);
    return {
      wild,
      player: {
        id: spirit.id, name: spirit.name, element: spirit.element,
        stage: spirit.stage, level: spirit.level,
        stats: { ...growth, ...stats },
        skills: [{ id: "charge", name: "Charge", power: 30 + spirit.level, element: spirit.element }],
      },
    };
  }
}

export const battleService = new BattleService();
  { name: "星塵龍", element: "STAR", stage: "JUVENILE", minLevel: 5, maxLevel: 10 },
  { name: "幻狐", element: "ILLUSION", stage: "JUVENILE", minLevel: 6, maxLevel: 12 },
  { name: "月狼", element: "MOON", stage: "JUVENILE", minLevel: 8, maxLevel: 15 },
  { name: "森靈", element: "NATURE", stage: "ADULT", minLevel: 12, maxLevel: 20 },
  { name: "雷鳥", element: "THUNDER", stage: "ADULT", minLevel: 15, maxLevel: 25 },
  { name: "冰龍", element: "ICE", stage: "ULTIMATE", minLevel: 20, maxLevel: 35 },
];