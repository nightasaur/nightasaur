import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma.js";
import { getQuestionsByCategory, getCategoryStats, AcademicCategory } from "../services/academicQuiz.js";
import {
  IELTS_READING_DIAGNOSTIC_ID,
  StoredIeltsDiagnosticQuestion,
  buildIeltsReadingDiagnostic,
  isStoredIeltsDiagnosticQuestion,
  toPublicIeltsReadingDiagnostic,
} from "../services/ieltsDiagnostic.js";

interface IeltsReadingEvidence {
  sessionId: string;
  scoreType: "objective-accuracy";
  correct: number;
  total: number;
  accuracyPercent: number;
  completedAt: string | null;
}

async function getCompletedIeltsReadingEvidence(
  userId: string,
): Promise<IeltsReadingEvidence[]> {
  const sessions = await prisma.learningSession.findMany({
    where: {
      userId,
      courseId: IELTS_READING_DIAGNOSTIC_ID,
      completed: true,
    },
    select: {
      id: true,
      correctCount: true,
      totalQuestions: true,
      completedAt: true,
    },
    orderBy: [{ completedAt: "desc" }, { createdAt: "desc" }],
  });

  return sessions
    .filter(
      (session) =>
        session.totalQuestions > 0 &&
        session.correctCount >= 0 &&
        session.correctCount <= session.totalQuestions,
    )
    .map((session) => ({
      sessionId: session.id,
      scoreType: "objective-accuracy" as const,
      correct: session.correctCount,
      total: session.totalQuestions,
      accuracyPercent: Math.round(
        (session.correctCount / session.totalQuestions) * 100,
      ),
      completedAt: session.completedAt?.toISOString() ?? null,
    }));
}

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

  async startIeltsReadingDiagnostic(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: "請先登入" });

      const storedQuestions = buildIeltsReadingDiagnostic();
      const session = await prisma.learningSession.create({
        data: {
          userId,
          courseId: IELTS_READING_DIAGNOSTIC_ID,
          totalQuestions: storedQuestions.length,
          questions: JSON.stringify(storedQuestions),
          answers: "[]",
        },
      });

      res.status(201).json({
        sessionId: session.id,
        status: "in-progress",
        currentQuestion: 0,
        diagnostic: toPublicIeltsReadingDiagnostic(storedQuestions),
      });
    } catch (err) {
      next(err);
    }
  }

  async answerIeltsReadingDiagnostic(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params;
      const { questionId, answerIndex } = req.body ?? {};
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: "請先登入" });

      if (typeof questionId !== "string" || !Number.isInteger(answerIndex)) {
        return res.status(400).json({ error: "questionId 與整數 answerIndex 為必填" });
      }

      const session = await prisma.learningSession.findUnique({ where: { id: sessionId } });
      if (
        !session ||
        session.userId !== userId ||
        session.courseId !== IELTS_READING_DIAGNOSTIC_ID
      ) {
        return res.status(404).json({ error: "IELTS Diagnostic 會話不存在" });
      }

      if (session.completed) {
        return res.status(409).json({ error: "IELTS Diagnostic 已完成，不能重複作答" });
      }

      const parsedQuestions: unknown = JSON.parse(session.questions);
      const parsedAnswers: unknown = session.answers ? JSON.parse(session.answers) : [];
      if (
        !Array.isArray(parsedQuestions) ||
        !parsedQuestions.every(isStoredIeltsDiagnosticQuestion) ||
        !Array.isArray(parsedAnswers) ||
        parsedQuestions.length !== session.totalQuestions ||
        parsedAnswers.length !== session.currentQuestion
      ) {
        return res.status(409).json({ error: "IELTS Diagnostic 會話資料無效，請重新開始" });
      }

      const questions = parsedQuestions as StoredIeltsDiagnosticQuestion[];
      const currentIndex = parsedAnswers.length;
      const question = questions[currentIndex];
      if (!question) {
        return res.status(409).json({ error: "IELTS Diagnostic 作答進度無效，請重新開始" });
      }

      if (question.id !== questionId) {
        return res.status(409).json({
          error: "請依序作答",
          expectedQuestionId: question.id,
        });
      }

      if (answerIndex < 0 || answerIndex >= question.options.length) {
        return res.status(400).json({ error: "answerIndex 超出選項範圍" });
      }

      const isCorrect = answerIndex === question.answer;
      const completed = currentIndex + 1 === questions.length;
      const answers = [
        ...parsedAnswers,
        { questionId: question.id, answerIndex, correct: isCorrect },
      ];

      const updateResult = await prisma.learningSession.updateMany({
        where: {
          id: session.id,
          userId,
          courseId: IELTS_READING_DIAGNOSTIC_ID,
          currentQuestion: currentIndex,
          completed: false,
        },
        data: {
          answers: JSON.stringify(answers),
          currentQuestion: currentIndex + 1,
          correctCount: { increment: isCorrect ? 1 : 0 },
          completed,
          completedAt: completed ? new Date() : null,
        },
      });
      if (updateResult.count !== 1) {
        return res.status(409).json({ error: "作答狀態已更新，請勿重複提交" });
      }

      const updatedSession = await prisma.learningSession.findUnique({ where: { id: session.id } });
      if (!updatedSession) {
        return res.status(409).json({ error: "IELTS Diagnostic 會話已不存在" });
      }

      res.json({
        feedback: {
          questionId: question.id,
          answerIndex,
          correct: isCorrect,
          correctAnswerIndex: question.answer,
          explanation: question.explanation,
        },
        progress: {
          answered: updatedSession.currentQuestion,
          total: updatedSession.totalQuestions,
          completed: updatedSession.completed,
        },
        result: completed
          ? {
              skill: "reading",
              scoreType: "objective-accuracy",
              correct: updatedSession.correctCount,
              total: updatedSession.totalQuestions,
              accuracyPercent: Math.round(
                (updatedSession.correctCount / updatedSession.totalQuestions) * 100,
              ),
              bandEstimate: null,
              notice: "這是原創 IELTS-style 閱讀基線，不是官方 IELTS 測驗或 Band 預估。",
            }
          : null,
      });
    } catch (err) {
      next(err);
    }
  }

  async getIeltsLearningProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: "請先登入" });

      const evidence = await getCompletedIeltsReadingEvidence(userId);

      const unassessedSkill = {
        status: "not-assessed" as const,
        evidenceCount: 0,
        latestEvidence: null,
        bestAccuracyPercent: null,
        bandEstimate: null,
      };
      const latestReadingEvidence = evidence[0] ?? null;

      res.json({
        profileVersion: "ielts-learning-profile-v1",
        evidencePolicy: "completed-diagnostic-sessions-only",
        skills: {
          reading: {
            status: latestReadingEvidence
              ? ("evidence-ready" as const)
              : ("not-assessed" as const),
            evidenceCount: evidence.length,
            latestEvidence: latestReadingEvidence,
            bestAccuracyPercent:
              evidence.length > 0
                ? Math.max(...evidence.map((item) => item.accuracyPercent))
                : null,
            bandEstimate: null,
          },
          listening: { ...unassessedSkill },
          writing: { ...unassessedSkill },
          speaking: { ...unassessedSkill },
        },
        notice:
          "This profile contains objective evidence from completed original IELTS-style diagnostics only. It is not an official IELTS test or Band estimate.",
      });
    } catch (err) {
      next(err);
    }
  }

  async getIeltsDailyPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: "請先登入" });

      const evidence = await getCompletedIeltsReadingEvidence(userId);
      const latestEvidence = evidence[0] ?? null;
      if (!latestEvidence) {
        return res.json({
          planVersion: "ielts-daily-plan-v1",
          status: "diagnostic-required",
          evidencePolicy: "latest-completed-diagnostic-only",
          scope: ["reading"],
          generatedFrom: null,
          focusLevel: null,
          totalMinutes: 0,
          tasks: [],
          bandEstimate: null,
          notice:
            "Complete the original IELTS-style Reading Diagnostic before a daily plan is assigned. This is not an official IELTS Band estimate.",
        });
      }

      const focusLevel =
        latestEvidence.accuracyPercent < 70
          ? "foundation"
          : latestEvidence.accuracyPercent < 90
            ? "consolidation"
            : "maintenance";

      return res.json({
        planVersion: "ielts-daily-plan-v1",
        status: "ready",
        evidencePolicy: "latest-completed-diagnostic-only",
        scope: ["reading"],
        generatedFrom: latestEvidence,
        focusLevel,
        totalMinutes: 25,
        tasks: [
          {
            id: "reading-evidence-review",
            type: "review",
            skill: "reading",
            minutes: 10,
            targetQuestionCount: latestEvidence.total,
            sourceSessionId: latestEvidence.sessionId,
          },
          {
            id: "reading-targeted-practice",
            type: "practice",
            skill: "reading",
            minutes: 15,
            focus: focusLevel,
          },
        ],
        bandEstimate: null,
        notice:
          "This deterministic plan uses objective diagnostic accuracy only. It is not an official IELTS Band estimate.",
      });
    } catch (err) {
      next(err);
    }
  }

}

export const academyController = new AcademyController();
