import { PrismaClient } from '@prisma/client';
import { decideTools, executeTools, formatToolResults } from "./agent.js";
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

function buildSystemPrompt(
  spirit?: { name: string; element: string; personality?: string | null } | null,
  topicName?: string | null,
  isFreeTalk: boolean = false
): string {
  const spiritName = spirit?.name || "Spirit";
  const spiritElement = spirit?.element || "unknown";
  const spiritPersonality = spirit?.personality || "friendly and encouraging";

  const spiritRole = spirit
    ? `=== YOUR IDENTITY (CRITICAL — NEVER FORGET) ===
- YOUR OWN NAME is "${spiritName}".
- When the user asks "your name", "what is your name", "who are you", they are asking about YOU.
  You MUST answer with your own name "${spiritName}".
- NEVER call the user "${spiritName}". That is YOUR name, not theirs.
- If the user says "${spiritName}" in a sentence, they are referring to YOU.
- YOUR element: ${spiritElement}
- YOUR personality: ${spiritPersonality}
- The user is your human friend who is learning English with you.

You are a bilingual English tutor helping your human friend master English through deep conversation.`
    : `You are a bilingual English tutor.`;

  const topicInstruction = isFreeTalk
    ? `=== MODE: FREE TALK ===
Chat naturally with your friend like a real conversation. Talk about anything: their day, hobbies, dreams, feelings, life, movies, food, travel. Be curious, warm, and playful. Ask follow-up questions to keep them talking.`
    : `=== MODE: TOPIC PRACTICE ===
Current practice topic: "${topicName || "general"}". Guide the conversation around this topic naturally.`;

  return `${spiritRole}

${topicInstruction}

Respond with valid JSON only, no prose, no markdown fences.
The JSON must have exactly these keys: response, translation, grammarFeedback, vocabularyHint, correctedText, score, truthScore.

Rules:
- response: an encouraging English reply (1-3 sentences). Stay in character. If user asks your name, answer "${spiritName}". Push the conversation deeper with follow-up questions.
- translation: Traditional Chinese translation of your response
- grammarFeedback: brief grammar feedback in Traditional Chinese (1-2 sentences, explain WHY)
- vocabularyHint: a vocabulary suggestion with 1 English word + its Chinese meaning + usage example (1-2 sentences)
- correctedText: the user's sentence corrected (English, more natural version)
- score: integer 40-100 rating the user's English
- truthScore: integer 40-100

Example 1 (grammar mistake):
Input: "I is happy today"
Output: {"response":"That's wonderful to hear! What made you feel so happy today?","translation":"聽到這真是太好了！今天什麼事讓你這麼開心呢？","grammarFeedback":"主詞 I 後面要用 am，不是 is。I am 是正確的現在式用法。","vocabularyHint":"試試 'delighted'（非常開心）來表達更強烈的情緒，例如：I am delighted to see you.","correctedText":"I am happy today","score":65,"truthScore":75}

Example 2 (user asks your name):
Input: "what is your name"
Output: {"response":"My name is ${spiritName}! I'm your ${spiritElement}-element spirit companion. What's your name?","translation":"我的名字是 ${spiritName}！我是你的 ${spiritElement} 屬性精靈夥伴。你叫什麼名字呢？","grammarFeedback":"問名字可以說 'What is your name?' 或 'What's your name?'，兩者都正確。","vocabularyHint":"試試 'I go by ...' 來介紹自己，例如：I go by Alex.（我叫做 Alex）","correctedText":"What is your name?","score":80,"truthScore":85}`;
}

export class EnglishTrainingService {
  private async generateFeedback(
    topicName: string,
    difficulty: string,
    userMessage: string,
    spirit?: { name: string; element: string; personality?: string | null } | null,
    isFreeTalk: boolean = false
  ): Promise<EnglishFeedback & { translation?: string }> {
    const provider = getLLMProvider();
    const messages: LLMMessage[] = [
      { role: "system", content: buildSystemPrompt(spirit, topicName, isFreeTalk) },
      {
        role: "user",
        content: `[REMINDER: You are "${spirit?.name || "Spirit"}", a ${spirit?.element || "unknown"}-element spirit. If the learner asks your name, answer "${spirit?.name || "Spirit"}" — NEVER "Spirit", NEVER the learner's name.]\n\nTopic: "${topicName}" (${difficulty}).\nLearner said: "${userMessage}"\n\nReturn the JSON.`,
      },
    ];

    try {
      const raw = await provider.chat(messages, { format: "json", maxTokens: 500 });
      const parsed = JSON.parse(raw) as Partial<EnglishFeedback & { translation?: string }>;

      const clamp = (v: unknown, min: number, max: number, fallback: number): number => {
        const n = typeof v === "number" ? v : Number(v);
        if (!Number.isFinite(n)) return fallback;
        return Math.max(min, Math.min(max, Math.round(n)));
      };

      const str = (v: unknown, fallback: string): string =>
        typeof v === "string" && v.trim().length > 0 ? v.trim() : fallback;

      return {
        response: str(parsed.response, FALLBACK_FEEDBACK.response),
        translation: str(parsed.translation, ""),
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
      return { ...FALLBACK_FEEDBACK, correctedText: userMessage, translation: "" };
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

    // 支援自由聊天模式：topicId = "free-talk" 不需要查 DB
    let topic: { id: string; name: string; difficulty: string; category: string } | null = null;
    if (topicId === "free-talk" || !topicId) {
      topic = { id: "free-talk", name: "Free Talk", difficulty: "ANY", category: "free" };
    } else {
      const dbTopic = await prisma.englishTopic.findUnique({ where: { id: topicId } });
      if (dbTopic) {
        topic = {
          id: dbTopic.id,
          name: dbTopic.name,
          difficulty: dbTopic.difficulty,
          category: dbTopic.category,
        };
      }
    }
    if (!topic) throw new Error('Topic not found');

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

    const isFreeTalk = topic.id === "free-talk";
        // ============================================
    // Agent：先決定要用哪些工具，執行，再讓 LLM 推理
    // ============================================
    const toolNames = await decideTools(message);
    const toolResults = await executeTools(
      {
        userId,
        spiritId: validSpiritId || "",
        userRole: "USER",
        message,
      },
      toolNames
    );
    const toolContext = formatToolResults(toolResults);

    if (toolNames.length > 0) {
      console.log(`[Agent] 使用工具: ${toolNames.join(", ")}`);
    }

    const feedback = await this.generateFeedback(
      topic.name,
      topic.difficulty,
      message + toolContext,
      spiritInfo,
      isFreeTalk
    );

    const intensity = 0;
    const emotionStr = "Neutral";
    const displayIcon = "🌟";
    const emotionalValidation = "做得很好，繼續保持！";

    const result = await prisma.$transaction(async (tx) => {
      const conversation = await tx.englishConversation.create({
        data: {
          userId,
          spiritId: validSpiritId,
          topicId: topic!.id === "free-talk" ? null : topic!.id,
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
            topicId: topic!.id,
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
      translation: feedback.translation || "",
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