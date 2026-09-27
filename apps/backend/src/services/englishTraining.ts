import { PrismaClient } from '@prisma/client';
import { gameService } from './game.js';
import { getLLMProvider, type LLMMessage, type EnglishFeedback } from './llm/index.js';

const prisma = new PrismaClient();

const FALLBACK_FEEDBACK: Omit<EnglishFeedback, "correctedText"> = {
  response: "That's a good start! Let's continue practicing.",
  grammarFeedback: "Good sentence structure.",
  vocabularyHint: "You could use more advanced vocabulary.",
  score: 70,
  truthScore: 80,
};

function buildSystemPrompt(spirit?: { name: string; element: string; personality?: string | null } | null): string {
  const spiritRole = spirit
    ? `You are "${spirit.name}", a ${spirit.element}-element spirit companion. Your personality: ${spirit.personality || "friendly and encouraging"}. You help your human friend practice English through natural, playful conversation.`
    : `You are a friendly English tutor.`;

  return `${spiritRole}

Respond with valid JSON only, no prose, no markdown fences.
The JSON must have exactly these keys: response, grammarFeedback, vocabularyHint, correctedText, score, truthScore.

Rules:
- response: an encouraging English reply from the spirit (1-2 sentences, stay in character, keep it warm)
- grammarFeedback: brief grammar feedback in Traditional Chinese (1 sentence)
- vocabularyHint: a vocabulary suggestion in Traditional Chinese + English word (1 sentence)
- correctedText: the user's sentence corrected (English)
- score: integer 40-100 rating the user's English (NOT 0 or 1)
- truthScore: integer 40-100

Example input: "I is happy"
Example output: {"response":"Oh what a lovely feeling! What made you smile today?","grammarFeedback":"記得用 I am，不是 I is 喔","vocabularyHint":"試試 delighted 或 cheerful 來表達開心","correctedText":"I am happy","score":65,"truthScore":75}`;
}

export class EnglishTrainingService {
  private async generateFeedback(
    topicName: string,
    difficulty: string,
    userMessage: string,
    spirit?: { name: string; element: string; personality?: string | null } | null
  ): Promise<EnglishFeedback> {
    const provider = getLLMProvider();
    const messages: LLMMessage[] = [
      { role: "system", content: buildSystemPrompt(spirit) },
      {
        role: "user",
        content: `Topic: "${topicName}" (${difficulty}).\nLearner said: "${userMessage}"\n\nReturn the JSON.`,
      },
    ];

    try {
      const raw = await provider.chat(messages, { format: "json", maxTokens: 400 });
      const parsed = JSON.parse(raw) as Partial<EnglishFeedback>;

      const clamp = (v: unknown, min: number, max: number, fallback: number): number => {
        const n = typeof v === "number" ? v : Number(v);
        if (!Number.isFinite(n)) return fallback;
        return Math.max(min, Math.min(max, Math.round(n)));
      };

      const str = (v: unknown, fallback: string): string =>
        typeof v === "string" && v.trim().length > 0 ? v.trim() : fallback;

      return {
        response: str(parsed.response, FALLBACK_FEEDBACK.response),
        grammarFeedback: str(parsed.grammarFeedback, FALLBACK_FEEDBACK.grammarFeedback),
        vocabularyHint: str(parsed.vocabularyHint, FALLBACK_FEEDBACK.vocabularyHint),
        correctedText: str(parsed.correctedText, userMessage),
        score: clamp(parsed.score, 0, 100, FALLBACK_FEEDBACK.score),
        truthScore: clamp(parsed.truthScore, 0, 100, FALLBACK_FEEDBACK.truthScore),
      };
    } catch (err) {
      console.warn(
        `[EnglishTraining] LLM provider "${provider.name}" failed, using fallback:`,
        err instanceof Error ? err.message : err
      );
      return { ...FALLBACK_FEEDBACK, correctedText: userMessage };
    }
  }

  async chat(
    userId: string,
    payload: {
      topicId: string;
      message: string;
      spiritId?: string;
      userLocale?: string;
      spiritName?: string;
      spiritElement?: string;
      spiritPersonality?: string;
    }
  ) {
    const { topicId, message, spiritId, userLocale = 'zh-TW' } = payload;

    const topic = await prisma.englishTopic.findUnique({ where: { id: topicId } });
    if (!topic) throw new Error('Topic not found');

    // 抓精靈資料（先試 DB，找不到就用前端傳來的自訂精靈資訊）
    let spiritInfo: { name: string; element: string; personality?: string | null } | null = null;
    let validSpiritId: string | null = null;

    if (spiritId) {
      const dbSpirit = await prisma.spirit.findFirst({
        where: { id: spiritId, userId, isActive: true },
        select: { id: true, name: true, element: true, personality: true },
      });
      if (dbSpirit) {
        spiritInfo = {
          name: dbSpirit.name,
          element: dbSpirit.element,
          personality: dbSpirit.personality,
        };
        validSpiritId = dbSpirit.id;
      } else if (payload.spiritName && payload.spiritElement) {
        spiritInfo = {
          name: payload.spiritName,
          element: payload.spiritElement,
          personality: payload.spiritPersonality || null,
        };
      }
    }

    const feedback = await this.generateFeedback(topic.name, topic.difficulty, message, spiritInfo);

    const intensity = 0;
    const emotionStr = "Neutral";
    const displayIcon = "🌟";
    const emotionalValidation = "做得很好，繼續保持！";

    const result = await prisma.$transaction(async (tx) => {
      const conversation = await tx.englishConversation.create({
        data: {
          userId,
          spiritId: validSpiritId,
          topicId,
          userMessage: message,
          aiResponse: feedback.response,
          detectedEmotion: emotionStr,
          emotionIntensity: intensity,
          emotionalValidation,
          validationLocale: userLocale,
          truthScore: feedback.truthScore,
          grammarFeedback: feedback.grammarFeedback,
          vocabularyHint: feedback.vocabularyHint,
          pronunciation: '',
          score: feedback.score,
          correctedText: feedback.correctedText,
        },
      });

      if (validSpiritId) {
        await tx.spirit.update({
          where: { id: validSpiritId },
          data: {
            displayIcon,
            currentEmotion: emotionStr,
            experience: { increment: 15 },
          },
        });
      }

      await tx.actionLog.create({
        data: {
          userId,
          actionType: 'ENGLISH_CHAT',
          metadata: {
            topicId,
            spiritId: validSpiritId,
            intensity,
            emotion: emotionStr,
            score: feedback.score,
            truthScore: feedback.truthScore,
          },
        },
      });

      return conversation;
    });

    await gameService.trackAction(userId, 'ENGLISH_CHAT', 1).catch(() => {});

    return {
      id: result.id,
      response: feedback.response,
      emotionalValidation,
      detectedEmotion: emotionStr,
      emotionIntensity: intensity,
      displayIcon,
      feedback: {
        grammar: feedback.grammarFeedback,
        vocabulary: feedback.vocabularyHint,
        pronunciation: '',
        score: feedback.score,
        correctedText: feedback.correctedText,
        truthScore: feedback.truthScore,
      },
      spirit: spiritInfo,
      topic: {
        id: topic.id,
        name: topic.name,
        category: topic.category,
        difficulty: topic.difficulty,
      },
      createdAt: result.createdAt,
    };
  }

  async getTopics(category?: string, difficulty?: string) {
    const where: any = { isActive: true };
    if (category) where.category = category;
    if (difficulty) where.difficulty = difficulty;

    return await prisma.englishTopic.findMany({
      where,
      orderBy: { order: 'asc' },
    });
  }

  async startConversation(userId: string, spiritId: string | null, topicId: string) {
    const topic = await prisma.englishTopic.findUnique({
      where: { id: topicId, isActive: true },
    });

    if (!topic) throw new Error('Topic not found');

    const spirit = spiritId ? await prisma.spirit.findFirst({
      where: { id: spiritId, userId, isActive: true },
    }) : null;

    return {
      topic: {
        id: topic.id,
        name: topic.name,
        category: topic.category,
        difficulty: topic.difficulty,
        description: topic.description,
      },
      spirit: spirit ? {
        id: spirit.id,
        name: spirit.name,
        element: spirit.element,
        displayIcon: spirit.displayIcon || '🌟',
      } : null,
      welcomeMessage: `Ready to practice "${topic.name}"? Let's start!`,
    };
  }

  async getConversationHistory(userId: string, topicId?: string, limit: number = 20) {
    const where: any = { userId };
    if (topicId) where.topicId = topicId;

    return await prisma.englishConversation.findMany({
      where,
      include: {
        spirit: { select: { id: true, name: true, element: true, displayIcon: true } },
        topic: { select: { id: true, name: true, category: true, difficulty: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

export const englishTrainingService = new EnglishTrainingService();