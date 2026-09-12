// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Nightasaur Team

/**
 * 學院控制器 - 第二部分
 * 包含學習進度相關方法
 */
import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma.js";
import { gameService } from "../services/game.js";

export class AcademyControllerPart2 {
  // 獲取學習進度
  async getProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: "請先登入" });
      }

      const progress = await prisma.learningProgress.findMany({
        where: { userId },
        orderBy: { lastCompleted: "desc" },
      });

      const sessions = await prisma.learningSession.findMany({
        where: { userId, completed: true },
        orderBy: { completedAt: "desc" },
        take: 10,
      });

      const courses = this.getCourseList();
      const courseStats = courses.map(course => {
        const courseSessions = sessions.filter(s => s.courseId === course.id);
        return {
          courseId: course.id,
          title: course.title,
          icon: course.icon,
          difficulty: course.difficulty,
          completedCount: courseSessions.length,
          averageScore: courseSessions.length > 0
            ? Math.round(courseSessions.reduce((acc, s) => {
                const correct = typeof s.correctCount === "number" ? s.correctCount : 0;
                const total = typeof s.totalQuestions === "number" ? s.totalQuestions : 1;
                return acc + (correct / total);
              }, 0) / courseSessions.length * 100)
            : 0,
          lastCompleted: courseSessions[0]?.completedAt,
        };
      });

      res.json({
        overall: {
          totalCourses: courses.filter(c => c.unlocked).length,
          completedCourses: sessions.length,
          totalQuestions: progress.reduce((acc, p) => acc + (p.attempts || 0), 0),
          correctAnswers: progress.reduce((acc, p) => acc + (p.correct || 0), 0),
          accuracy: progress.reduce((acc, p) => acc + (p.attempts || 0), 0) > 0
            ? Math.round(progress.reduce((acc, p) => acc + (p.correct || 0), 0) / 
                        progress.reduce((acc, p) => acc + (p.attempts || 0), 0) * 100)
            : 0,
        },
        categories: progress,
        courses: courseStats,
        recentSessions: sessions.slice(0, 5).map(s => ({
          id: s.id,
          courseId: s.courseId,
          completedAt: s.completedAt,
          correctCount: s.correctCount,
          totalQuestions: s.totalQuestions,
          score: Math.round((s.correctCount || 0) / (s.totalQuestions || 1) * 100),
        })),
      });
    } catch (err) {
      next(err);
    }
  }

  // 獲取課程列表（私有方法）
  private getCourseList() {
    return [
      {
        id: "element-basics",
        title: "元素基礎學",
        description: "學習所有元素的基本知識和屬性關係",
        icon: "🔥💧✨",
        difficulty: "初級",
        estimatedTime: "30分鐘",
        categories: ["ELEMENT", "LOGIC"] as any[],
        reward: { xp: 50, coins: 25 },
        unlocked: true,
      },
      {
        id: "spirit-studies",
        title: "精靈研究學",
        description: "深入了解精靈種類、進化和技能",
        icon: "🦎🌟",
        difficulty: "初級",
        estimatedTime: "45分鐘",
        categories: ["SPIRIT", "SPECIES"] as any[],
        reward: { xp: 75, coins: 35 },
        unlocked: true,
      },
      {
        id: "math-foundation",
        title: "數學基礎學",
        description: "基礎數學運算和邏輯思維訓練",
        icon: "🧮📐",
        difficulty: "初級",
        estimatedTime: "40分鐘",
        categories: ["MATH"] as any[],
        reward: { xp: 60, coins: 30 },
        unlocked: true,
      },
      {
        id: "ielts-preparation",
        title: "雅思準備課程",
        description: "英語詞彙和閱讀理解訓練",
        icon: "📚🌍",
        difficulty: "中級",
        estimatedTime: "60分鐘",
        categories: ["IELTS"] as any[],
        reward: { xp: 100, coins: 50 },
        unlocked: true,
      },
      {
        id: "advanced-logic",
        title: "高階邏輯學",
        description: "複雜邏輯推理和問題解決",
        icon: "🧠⚡",
        difficulty: "高級",
        estimatedTime: "90分鐘",
        categories: ["LOGIC", "MATH"] as any[],
        reward: { xp: 150, coins: 75 },
        unlocked: false,
      },
      {
        id: "element-mastery",
        title: "元素精通學",
        description: "深入了解元素相剋和組合應用",
        icon: "⚡❄️🌪️",
        difficulty: "高級",
        estimatedTime: "75分鐘",
        categories: ["ELEMENT", "LOGIC"] as any[],
        reward: { xp: 125, coins: 60 },
        unlocked: false,
      },
    ];
  }
}

export const academyControllerPart2 = new AcademyControllerPart2();