import { getLLMProvider, type LLMMessage } from "../llm/index.js";
import {
  buildSpiritSystemPrompt,
  type SpiritPersona,
  type SupportedLanguage,
} from "./personality.js";
import { normalizeChinese } from "./chineseNormalize.js";
import { normalizeEmotion, clampIntensity, getEmotionIcon, type Emotion } from "./emotionIcons.js";

export interface DialogueContext {
  spirit: SpiritPersona;
  userId: string;
  message: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  language: SupportedLanguage;
  englishFirst?: boolean;
  memories?: string[];
}

export class SpiritDialogueService {
  async chat(ctx: DialogueContext): Promise<string> {
    const provider = getLLMProvider();
    const systemPrompt = buildSpiritSystemPrompt(ctx.spirit, {
      language: ctx.language,
      englishFirst: ctx.englishFirst,
      memories: ctx.memories,
    });

    const messages: LLMMessage[] = [
      { role: "system", content: systemPrompt },
      ...ctx.history.slice(-10),
      { role: "user", content: ctx.message },
    ];

    const raw = await provider.chat(messages, {
      maxTokens: 400,
      temperature: 0.8,
    });

    const trimmed = raw.trim();
    if (!trimmed) {
      throw new Error("Empty response from LLM provider");
    }

    return normalizeChinese(trimmed, ctx.language);
  }

  async chatWithEmotion(ctx: DialogueContext): Promise<ChatResult> {
    const provider = getLLMProvider();
    const basePrompt = buildSpiritSystemPrompt(ctx.spirit, {
      language: ctx.language,
      englishFirst: ctx.englishFirst,
      memories: ctx.memories,
    });

    const emotionInstruction = [
      "",
      "## Output Format (CRITICAL)",
      "Return valid JSON only, no prose, no markdown fences:",
      '{"reply":"...", "emotion":"happy|sad|angry|anxious|excited|neutral", "intensity":0-10}',
      "",
      "Field rules:",
      "- reply: your in-character reply (same language rules as above)",
      "- emotion: the USER current emotion (not yours), one of the 6 values",
      "- intensity: how strong the emotion is, 0=neutral, 10=extreme",
      "- If the user message is neutral/factual, use emotion='neutral', intensity=0-3",
      "",
      "Emotion keyword mapping (CRITICAL):",
      "- happy: 開心, 高興, 愉快, 滿足, 幸福",
      "- sad: 難過, 傷心, 失望, 沮喪, 想哭, 委屈",
      "- angry: 生氣, 憤怒, 火大, 不爽, 討厭",
      "- anxious: 緊張, 焦慮, 擔心, 害怕, 不安",
      "- excited: 興奮, 期待, 太棒了, 超讚, 錄取, 中獎, 成功",
      "- neutral: 一般問句, 事實陳述, 日常對話 (intensity 0-3)",
      "- IMPORTANT: A question like 你喜歡什麼/你叫什麼/現在幾點 is ALWAYS neutral, never happy",
      "- Only assign happy/excited when user explicitly states positive feelings (開心, 超棒, 我好高興)",
      "",
      "Mapping examples:",
      "- 我好難過 -> sad, 7-9",
      "- 好緊張 -> anxious, 6-8",
      "- 生氣了 -> angry, 7-9",
      "- 超開心 -> excited, 7-9",
      "- 你喜歡什麼 -> neutral, 0-2",
    ].join("\n");

    const messages: LLMMessage[] = [
      { role: "system", content: basePrompt + emotionInstruction },
      ...ctx.history.slice(-10),
      { role: "user", content: ctx.message },
    ];

    const raw = await provider.chat(messages, {
      format: "json",
      maxTokens: 500,
      temperature: 0.7,
    });

    let parsed: { reply?: unknown; emotion?: unknown; intensity?: unknown };
    try {
      parsed = JSON.parse(raw);
    } catch {
      const fallbackReply = normalizeChinese(raw.trim(), ctx.language);
      if (!fallbackReply) throw new Error("Empty response from LLM provider");
      return { reply: fallbackReply, emotion: "neutral", intensity: 0, displayIcon: getEmotionIcon("neutral") };
    }

    const replyRaw = typeof parsed.reply === "string" ? parsed.reply.trim() : "";
    const replyFinal = replyRaw || (ctx.language === "en" ? "I hear you. Tell me more." : "我聽到了，繼續說說好嗎？");

    let emotion = normalizeEmotion(parsed.emotion);
    let intensity = clampIntensity(parsed.intensity);

    // Guard: pure questions without emotion keywords should be neutral
    const msg = ctx.message.trim();
    const isQuestion = /[？?]\s*$/.test(msg);
    const hasEmotionWord = /開心|高興|愉快|難過|傷心|失望|生氣|憤怒|緊張|焦慮|擔心|害怕|興奮|期待|太棒|超讚|錄取|中獎|幸福|委屈|沮喪/.test(msg);
    if (isQuestion && !hasEmotionWord && (emotion === "happy" || emotion === "excited")) {
      emotion = "neutral";
      intensity = Math.min(intensity, 2);
    }

    return {
      reply: normalizeChinese(replyFinal, ctx.language),
      emotion,
      intensity,
      displayIcon: getEmotionIcon(emotion),
    };
  }
}

export interface ChatResult {
  reply: string;
  emotion: Emotion;
  intensity: number;
  displayIcon: string;
}

export const spiritDialogueService = new SpiritDialogueService();
