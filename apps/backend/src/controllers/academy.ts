import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma.js";
import { getQuestionsByCategory, getCategoryStats, AcademicCategory } from "../services/academicQuiz.js";
import { routeParam } from "../utils/request.js";

export class AcademyController {
  async getCourses(_req: Request, res: Response, next: NextFunction) {
    try {
      const courses = [
        {
          id: "literature-basics",
          title: "文學基礎與雙語口說",
          icon: "📚",
          difficulty: "初級",
          description: "與伴隨精靈進行中英雙語閱讀與口語發音演練，提升語感與親密度。",
          categories: ["文學", "英語口說"],
          estimatedTime: "10 分鐘",
          reward: { xp: 50, coins: 25 },
          unlocked: true,
        },
        {
          id: "physics-foundation",
          title: "自然物理與科學探索",
          icon: "⚛️",
          difficulty: "初級",
          description: "透過生活實例理解力學與能量，精靈將以英語發音輔助科學詞彙記憶。",
          categories: ["物理", "科學英語"],
          estimatedTime: "12 分鐘",
          reward: { xp: 60, coins: 30 },
          unlocked: true,
        },
        {
          id: "chemistry-intro",
          title: "元素化學與精靈屬性",
          icon: "🧪",
          difficulty: "初級",
          description: "認識水、火、雷、冰等自然元素反應，同步解鎖精靈英語語音詞庫。",
          categories: ["化學", "元素共鳴"],
          estimatedTime: "10 分鐘",
          reward: { xp: 55, coins: 25 },
          unlocked: true,
        },
        {
          id: "medical-basics",
          title: "健康醫學與生命守護",
          icon: "🏥",
          difficulty: "中級",
          description: "學習人體生理與日常保健知識，提升水系與光系精靈的治癒共鳴。",
          categories: ["醫學", "生命科學"],
          estimatedTime: "15 分鐘",
          reward: { xp: 80, coins: 40 },
          unlocked: true,
        },
        {
          id: "mathematics-fundamentals",
          title: "邏輯數學與對戰策略",
          icon: "🧮",
          difficulty: "初級",
          description: "訓練邏輯推演與心算速度，強化精靈在對戰中的反應力與專注力。",
          categories: ["數學", "邏輯思維"],
          estimatedTime: "10 分鐘",
          reward: { xp: 50, coins: 25 },
          unlocked: true,
        },
      ];
      return res.json({ courses });
    } catch (err) {
      return next(err);
    }
  }

  async getCategoryQuestions(req: Request, res: Response, next: NextFunction) {
    try {
      const category = routeParam(req, "category");
      const validCats: AcademicCategory[] = ["LITERATURE", "PHYSICS", "CHEMISTRY", "MEDICINE", "MATHEMATICS"];
      if (!validCats.includes(category as AcademicCategory)) {
        return res.status(400).json({ error: "無效的分類" });
      }
      const questions = getQuestionsByCategory(category as AcademicCategory, 10, 1);
      return res.json({ category, questions });
    } catch (err) {
      return next(err);
    }
  }

  async startCourse(req: Request, res: Response, next: NextFunction) {
    try {
      const courseId = routeParam(req, "courseId");
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: "請先登入" });

      const courseMap: Record<string, { title: string; icon: string; cat: AcademicCategory }> = {
        "literature-basics": { title: "文學基礎與雙語口說", icon: "📚", cat: "LITERATURE" },
        "physics-foundation": { title: "自然物理與科學探索", icon: "⚛️", cat: "PHYSICS" },
        "chemistry-intro": { title: "元素化學與精靈屬性", icon: "🧪", cat: "CHEMISTRY" },
        "medical-basics": { title: "健康醫學與生命守護", icon: "🏥", cat: "MEDICINE" },
        "mathematics-fundamentals": { title: "邏輯數學與對戰策略", icon: "🧮", cat: "MATHEMATICS" },
      };

      const course = courseMap[courseId];
      if (!course) return res.status(404).json({ error: "課程不存在" });

      const questions = getQuestionsByCategory(course.cat, 5, 1);
      const session = await prisma.learningSession.create({
        data: {
          userId,
          courseId,
          totalQuestions: 5,
          questions: JSON.stringify(questions),
          answers: "[]",
        },
      });

      return res.json({
        sessionId: session.id,
        course: { id: courseId, title: course.title, icon: course.icon },
        totalQuestions: 5,
        currentQuestion: 0,
        question: questions[0],
      });
    } catch (err) {
      return next(err);
    }
  }

  async answerQuestion(req: Request, res: Response, next: NextFunction) {
    try {
      const sessionId = routeParam(req, "sessionId");
      const { answerIndex } = req.body;
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: "請先登入" });

      const session = await prisma.learningSession.findUnique({ where: { id: sessionId } });
      if (!session || session.userId !== userId) {
        return res.status(404).json({ error: "學習會話不存在" });
      }

      const questions = session.questions ? JSON.parse(session.questions) : [];
      const answers = session.answers ? JSON.parse(session.answers) : [];
      const currentIndex = answers.length;
      const question = questions[currentIndex];
      const isCorrect = answerIndex === question.answer;

      const newAnswers = [...answers, { questionId: question.id, answerIndex, correct: isCorrect }];
      const updatedSession = await prisma.learningSession.update({
        where: { id: sessionId },
        data: {
          answers: JSON.stringify(newAnswers),
          currentQuestion: currentIndex + 1,
          correctCount: { increment: isCorrect ? 1 : 0 },
          completed: currentIndex + 1 >= questions.length,
        },
      });

      let reward = null;
      if (updatedSession.completed) {
        await prisma.user.update({
          where: { id: userId },
          data: { trainerXp: { increment: 50 }, coins: { increment: 25 } },
        });
        reward = { xp: 50, coins: 25 };
      }

      return res.json({
        correct: isCorrect,
        correctAnswer: question.answer,
        explanation: question.explanation,
        currentQuestion: updatedSession.currentQuestion,
        completed: updatedSession.completed,
        reward,
      });
    } catch (err) {
      return next(err);
    }
  }

  async getProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: "請先登入" });

      const progress = await prisma.learningProgress.findMany({ where: { userId } });
      const sessions = await prisma.learningSession.findMany({ where: { userId, completed: true } });
      const stats = getCategoryStats();

      const categories = Object.keys(stats).map(cat => {
        const prog = progress.find(p => p.category === cat);
        return {
          category: cat,
          name: stats[cat as AcademicCategory].name,
          icon: stats[cat as AcademicCategory].icon,
          completed: prog?.completed || 0,
        };
      });

      return res.json({
        overall: { completedCourses: sessions.length },
        categories,
        recentSessions: sessions.slice(0, 3),
      });
    } catch (err) {
      return next(err);
    }
  }

  async getCategories(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = getCategoryStats();
      const categories = Object.entries(stats).map(([id, data]) => ({
        id,
        name: data.name,
        icon: data.icon,
        totalQuestions: data.total,
      }));
      return res.json({ categories });
    } catch (err) {
      return next(err);
    }
  }
}

export const academyController = new AcademyController();
