import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma.js";
import { getQuestionsByCategory, getCategoryStats, AcademicCategory } from "../services/academicQuiz.js";

export class AcademyController {
  async getCourses(req: Request, res: Response, next: NextFunction) {
    try {
      const courses = [
        { id: "literature-basics", title: "文學基礎課程", icon: "📚", difficulty: "初級", unlocked: true },
        { id: "physics-foundation", title: "物理基礎課程", icon: "⚛️", difficulty: "初級", unlocked: true },
        { id: "chemistry-intro", title: "化學入門課程", icon: "🧪", difficulty: "初級", unlocked: true },
        { id: "medical-basics", title: "醫學基礎課程", icon: "🏥", difficulty: "初級", unlocked: true },
        { id: "mathematics-fundamentals", title: "數學基礎課程", icon: "🧮", difficulty: "初級", unlocked: true },
      ];
      res.json({ courses });
    } catch (err) {
      next(err);
    }
  }

  async getCategoryQuestions(req: Request, res: Response, next: NextFunction) {
    try {
      const { category } = req.params;
      const validCats: AcademicCategory[] = ["LITERATURE", "PHYSICS", "CHEMISTRY", "MEDICINE", "MATHEMATICS"];
      if (!validCats.includes(category as AcademicCategory)) {
        return res.status(400).json({ error: "無效的分類" });
      }
      const questions = getQuestionsByCategory(category as AcademicCategory, 10, 1);
      res.json({ category, questions });
    } catch (err) {
      next(err);
    }
  }

  async startCourse(req: Request, res: Response, next: NextFunction) {
    try {
      const { courseId } = req.params;
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: "請先登入" });

      const courseMap: Record<string, { title: string; icon: string; cat: AcademicCategory }> = {
        "literature-basics": { title: "文學基礎課程", icon: "📚", cat: "LITERATURE" },
        "physics-foundation": { title: "物理基礎課程", icon: "⚛️", cat: "PHYSICS" },
        "chemistry-intro": { title: "化學入門課程", icon: "🧪", cat: "CHEMISTRY" },
        "medical-basics": { title: "醫學基礎課程", icon: "🏥", cat: "MEDICINE" },
        "mathematics-fundamentals": { title: "數學基礎課程", icon: "🧮", cat: "MATHEMATICS" },
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

      res.json({
        sessionId: session.id,
        course: { id: courseId, title: course.title, icon: course.icon },
        totalQuestions: 5,
        currentQuestion: 0,
        question: questions[0],
      });
    } catch (err) {
      next(err);
    }
  }

  async answerQuestion(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params;
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

      res.json({
        correct: isCorrect,
        correctAnswer: question.answer,
        explanation: question.explanation,
        currentQuestion: updatedSession.currentQuestion,
        completed: updatedSession.completed,
        reward,
      });
    } catch (err) {
      next(err);
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

      res.json({
        overall: { completedCourses: sessions.length },
        categories,
        recentSessions: sessions.slice(0, 3),
      });
    } catch (err) {
      next(err);
    }
  }

  async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = getCategoryStats();
      const categories = Object.entries(stats).map(([id, data]) => ({
        id,
        name: data.name,
        icon: data.icon,
        totalQuestions: data.total,
      }));
      res.json({ categories });
    } catch (err) {
      next(err);
    }
  }
}

export const academyController = new AcademyController();