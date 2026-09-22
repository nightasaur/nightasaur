import { PrismaClient } from '@prisma/client';
import { gameService } from './game.js';

const prisma = new PrismaClient();

export class EnglishTrainingService {
  async chat(userId: string, payload: { topicId: string; message: string; spiritId?: string; userLocale?: string }) {
    const { topicId, message, spiritId, userLocale = 'zh-TW' } = payload;

    const topic = await prisma.englishTopic.findUnique({ where: { id: topicId } });
    if (!topic) throw new Error('Topic not found');

    const intensity = 0;
    const emotionStr = "Neutral";
    const displayIcon = "✨";

    const result = await prisma.$transaction(async (tx) => {
      const conversation = await tx.englishConversation.create({
        data: {
          userId,
          spiritId,
          topicId,
          userMessage: message,
          aiResponse: "That's a good start! Let's continue practicing.",
          detectedEmotion: emotionStr,
          emotionIntensity: intensity,
          emotionalValidation: "我注意到你在練習英文，這很棒！",
          validationLocale: userLocale,
          truthScore: 80,
          grammarFeedback: "Good sentence structure.",
          vocabularyHint: "You could use more advanced vocabulary.",
          pronunciation: '',
          score: 70,
          correctedText: message,
        },
      });

      if (spiritId) {
        await tx.spirit.update({
          where: { id: spiritId },
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
            spiritId,
            intensity,
            emotion: emotionStr,
            score: 70,
            truthScore: 80,
          },
        },
      });

      return conversation;
    });

    await gameService.trackAction(userId, 'ENGLISH_CHAT', 1).catch(() => {});

    return {
      id: result.id,
      response: "That's a good start! Let's continue practicing.",
      emotionalValidation: "我注意到你在練習英文，這很棒！",
      detectedEmotion: emotionStr,
      emotionIntensity: intensity,
      displayIcon,
      feedback: {
        grammar: "Good sentence structure.",
        vocabulary: "You could use more advanced vocabulary.",
        pronunciation: '',
        score: 70,
        correctedText: message,
        truthScore: 80,
      },
      spirit: null,
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
        displayIcon: spirit.displayIcon || '✨',
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