// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Nightasaur Team

/**
 * 益智問答對戰服務
 * 答對題目攻擊敵方精靈，答錯被反擊，5題決勝負
 */
import prisma from "../config/prisma.js";
import { gameService } from "./game.js";
import { calculateGrowth } from "./growth.js";
import { getQuizQuestions, calcQuizDamage, calcEnemyDamage } from "./quiz.js";
import type { QuizQuestion } from "./quiz.js";

interface QuizBattleState {
  spiritId: string;
  questionIndex: number;
  questions: QuizQuestion[];
  playerHp: number;
  playerMaxHp: number;
  playerAtk: number;
  playerDef: number;
  playerElement: string;
  playerLevel: number;
  playerName: string;
  enemyHp: number;
  enemyMaxHp: number;
  enemyName: string;
  enemyElement: string;
  enemyLevel: number;
  correctCount: number;
  totalDamage: number;
}

export class QuizBattleService {
  private battles = new Map<string, QuizBattleState>();

  /** 開始益智對戰 */
  async startBattle(spiritId: string) {
    const spirit = await prisma.spirit.findUnique({ where: { id: spiritId } });
    if (!spirit) throw Object.assign(new Error("精靈不存在"), { statusCode: 404 });

    const stats = typeof spirit.stats === "string" ? JSON.parse(spirit.stats || "{}") : spirit.stats;
    const growth = calculateGrowth(spirit.element, spirit.level, spirit.stage);
    const playerHp = growth.hp;

    const wildNames = ["火焰鼠", "水滴魚", "光球獸", "暗影貓", "星塵龍", "幻狐", "月狼", "森靈", "雷鳥", "冰龍"];
    const wildElements = ["FIRE", "WATER", "LIGHT", "SHADOW", "STAR", "ILLUSION", "MOON", "NATURE", "THUNDER", "ICE"];
    const enemyLevel = Math.max(1, spirit.level - 2 + Math.floor(Math.random() * 5));
    const name = wildNames[Math.floor(Math.random() * wildNames.length)];
    const element = wildElements[Math.floor(Math.random() * wildElements.length)];
    const enemyGrowth = calculateGrowth(element, enemyLevel, spirit.stage);
    const enemyHp = Math.floor(enemyGrowth.hp * 1.2);

    const questions = getQuizQuestions(5, spirit.element);

    this.battles.set(spiritId, {
      spiritId, questionIndex: 0, questions,
      playerHp, playerMaxHp: playerHp, playerAtk: growth.atk, playerDef: growth.def,
      playerElement: spirit.element, playerLevel: spirit.level, playerName: spirit.name,
      enemyHp, enemyMaxHp: enemyHp, enemyName: name, enemyElement: element, enemyLevel,
      correctCount: 0, totalDamage: 0,
    });

    return {
      battle: {
        spiritId, playerName: spirit.name, playerElement: spirit.element,
        playerHp, playerMaxHp: playerHp, enemyName: name, enemyElement: element,
        enemyHp, enemyMaxHp: enemyHp, enemyLevel,
        questionIndex: 0, totalQuestions: questions.length, correctCount: 0,
      },
      question: { id: questions[0].id, category: questions[0].category, question: questions[0].question, options: questions[0].options },
    };
  }
/** 回答問題 — 答對攻擊，答錯被反擊 */
  async answerQuestion(spiritId: string, answerIndex: number) {
    const state = this.battles.get(spiritId);
    if (!state) throw Object.assign(new Error("請先開始對戰"), { statusCode: 400 });

    const q = state.questions[state.questionIndex];
    const isCorrect = answerIndex === q.answer;
    let damage = 0, effective = 1, critical = false, enemyDamage = 0, message = "";

    if (isCorrect) {
      state.correctCount++;
      const result = calcQuizDamage(q, state.playerElement, state.enemyElement, state.playerLevel);
      damage = result.damage; effective = result.effective; critical = result.critical;
      state.enemyHp = Math.max(0, state.enemyHp - damage);
      state.totalDamage += damage;
      message = `✅ 答對了！${state.playerName} 造成 ${damage} 點傷害！`;
      if (critical) message += " 💥 暴擊！";
      if (effective > 1) message += " 屬性剋制！";
    } else {
      enemyDamage = calcEnemyDamage(state.enemyLevel, state.playerDef);
      state.playerHp = Math.max(0, state.playerHp - enemyDamage);
      message = `❌ 答錯了！${state.enemyName} 反擊造成 ${enemyDamage} 點傷害！`;
    }

    const victory = state.enemyHp <= 0;
    const defeat = state.playerHp <= 0;
    const finished = victory || defeat || state.questionIndex >= state.questions.length - 1;

    const result = {
      correct: isCorrect, correctAnswer: q.answer, explanation: q.explanation,
      damage, enemyDamage, effective, critical,
      playerHp: state.playerHp, playerMaxHp: state.playerMaxHp,
      enemyHp: state.enemyHp, enemyMaxHp: state.enemyMaxHp,
      victory, defeat, finished,
      xpGained: 0, coinsGained: 0, message,
      correctCount: state.correctCount,
      nextQuestion: undefined as any,
    };

    if (victory) {
      const xp = 20 + state.enemyLevel * 5 + state.correctCount * 10;
      const coins = 10 + state.correctCount * 5;
      result.message += ` 🎉 勝利！獲得 ${xp} 經驗 + ${coins} 金幣！`;
      result.xpGained = xp; result.coinsGained = coins;
      await this.rewardVictory(state, xp, coins);
      this.battles.delete(spiritId);
    } else if (defeat || finished) {
      const xp = defeat ? 5 : 8 + state.correctCount * 5;
      result.message += defeat ? ` 😵 戰敗...` : ` 🏁 對戰結束！`;
      result.message += ` 獲得 ${xp} 經驗`;
      result.xpGained = xp;
      if (!defeat) result.victory = true;
      await prisma.spirit.update({ where: { id: spiritId }, data: { experience: { increment: xp } } }).catch(() => {});
      this.battles.delete(spiritId);
    } else {
      state.questionIndex++;
      const nq = state.questions[state.questionIndex];
      result.nextQuestion = { id: nq.id, category: nq.category, question: nq.question, options: nq.options };
    }

    return result;
  }

  /** 勝利獎勵 */
  private async rewardVictory(state: QuizBattleState, xp: number, coins: number) {
    await prisma.spirit.update({ where: { id: state.spiritId }, data: { experience: { increment: xp } } });
    const spirit = await prisma.spirit.findUnique({ where: { id: state.spiritId } });
    if (spirit) {
      await prisma.user.update({ where: { id: spirit.userId }, data: { coins: { increment: coins }, trainerXp: { increment: xp } } }).catch(() => {});
    }
  }
}

export const quizBattleService = new QuizBattleService();