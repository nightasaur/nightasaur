import { getLLMProvider, type LLMMessage } from "../llm/index.js";
import {
  buildSpiritSystemPrompt,
  type SpiritPersona,
  type SupportedLanguage,
} from "./personality.js";
import { normalizeChinese } from "./chineseNormalize.js";

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
}

export const spiritDialogueService = new SpiritDialogueService();
