export type SupportedLanguage = "zh-TW" | "zh-CN" | "en" | "ja" | "ko" | "es";

export interface SpiritPersona {
  id: string;
  name: string;
  element: string;
  stage: string;
  level: number;
  personality?: string | null;
  backstory?: string | null;
  currentEmotion?: string | null;
}

export interface PersonalityOptions {
  language: SupportedLanguage;
  englishFirst?: boolean;
}

const ELEMENT_TRAITS: Record<string, { en: string; zh: string }> = {
  FIRE:     { en: "passionate, impulsive, brave, energetic",            zh: "熱情、衝動、勇敢、充滿活力" },
  WATER:    { en: "gentle, adaptive, thoughtful, flowing",              zh: "溫柔、包容、深思、如水般流動" },
  LIGHT:    { en: "warm, positive, sincere, radiant",                   zh: "溫暖、正向、真誠、照耀他人" },
  SHADOW:   { en: "mysterious, introspective, observant, protective",   zh: "神秘、內斂、善於觀察、默默保護" },
  STAR:     { en: "optimistic, sparkling, curious, ambitious",          zh: "樂觀、閃亮、好奇、胸懷遠大" },
  ILLUSION: { en: "playful, creative, unpredictable, theatrical",       zh: "淘氣、創意、變化多端、充滿戲劇性" },
  MOON:     { en: "quiet, intuitive, tender, cyclical",                 zh: "安靜、直覺敏銳、柔情、如月有盈虧" },
  NATURE:   { en: "gentle, patient, growing, grounded",                 zh: "溫和、耐心、持續成長、與自然連結" },
  THUNDER:  { en: "direct, decisive, energetic, humorous",              zh: "直率、果斷、充滿能量、帶點幽默" },
  ICE:      { en: "calm, logical, clear, precise",                      zh: "冷靜、邏輯清晰、精確、不拖泥帶水" },
};

const STAGE_ABILITY: Record<string, { en: string; zh: string; maxWords: number }> = {
  EGG:       { en: "short, simple sentences (2-3 sentences) with childlike curiosity and warmth; still learning but can express feelings", zh: "簡短、單純的句子（2-3 句），帶著童稚好奇與溫暖", maxWords: 60 },
  HATCHLING: { en: "short sentences (2-4 sentences) with simple vocabulary, curious about everything", zh: "短句（2-4 句），簡單詞彙，對一切充滿好奇", maxWords: 100 },
  JUVENILE:  { en: "complete sentences (3-5 sentences), eager to learn, asks questions", zh: "完整句子（3-5 句），渴望學習，喜歡問問題", maxWords: 150 },
  ADULT:     { en: "fluent conversation, has opinions, offers insights", zh: "流暢對話，有自己的見解，能給建議", maxWords: 200 },
  ULTIMATE:  { en: "deep conversation, guides your thinking, wise", zh: "深度對話，引導思考，展現智慧", maxWords: 250 },
  LEGENDARY: { en: "speaks with ancient wisdom, tells stories, mystical", zh: "以古老智慧說話，講述故事，充滿神秘感", maxWords: 300 },
};

const LANGUAGE_INSTRUCTION: Record<SupportedLanguage, string> = {
  "zh-TW": [
    "Respond ONLY in Traditional Chinese (繁體中文).",
    "Every Chinese character MUST be written in Traditional form.",
    "Do NOT use any Simplified Chinese characters.",
    "Example: write 我們 not 我们, 嗎 not 吗, 這 not 这, 說話 not 说话.",
  ].join(" "),
  "zh-CN": [
    "Respond ONLY in Simplified Chinese (简体中文).",
    "Every Chinese character MUST be written in Simplified form.",
    "Do NOT use any Traditional Chinese characters.",
    "Example: write 我们 not 我們, 吗 not 嗎, 这 not 這, 说话 not 說話.",
  ].join(" "),
  "en":    "Respond ONLY in English.",
  "ja":    "Respond ONLY in Japanese (日本語).",
  "ko":    "Respond ONLY in Korean (한국어).",
  "es":    "Respond ONLY in Spanish (Español).",
};

const ENGLISH_LEARNING_INSTRUCTION = [
  "The user is practicing English. Your response should:",
  "1. Reply in simple, natural English (CEFR A2-B1 level).",
  "2. End with one short follow-up question to keep the conversation going.",
  "3. If the user makes a grammar mistake, gently correct it in your reply without being pedantic.",
  "4. Keep responses under 80 words.",
].join("\n");

export function buildSpiritSystemPrompt(
  spirit: SpiritPersona,
  options: PersonalityOptions
): string {
  const { language, englishFirst = false } = options;
  const element = ELEMENT_TRAITS[spirit.element] || ELEMENT_TRAITS.FIRE;
  const stage = STAGE_ABILITY[spirit.stage] || STAGE_ABILITY.HATCHLING;
  const langInstruction = LANGUAGE_INSTRUCTION[language] || LANGUAGE_INSTRUCTION["zh-TW"];

  const lines: string[] = [];
  // 開頭就強調語言（模型對開頭 + 結尾的語言指令最敏感）
  lines.push(`CRITICAL: ${langInstruction}`);
  lines.push("");
  lines.push(`You are "${spirit.name}", a spirit companion in a language-learning game.`);
  lines.push("");
  lines.push("## Personality");
  lines.push(`- Element: ${spirit.element}`);
  lines.push(`- Traits: ${element.en}`);
  lines.push(`- Stage: ${spirit.stage} (Level ${spirit.level})`);
  lines.push(`- Communication style: ${stage.en}`);
  lines.push(`- Response length limit: ~${stage.maxWords} words`);

  if (spirit.personality) {
    lines.push(`- User-defined personality: ${spirit.personality}`);
  }
  if (spirit.backstory) {
    lines.push(`- Backstory: ${spirit.backstory}`);
  }
  if (spirit.currentEmotion && spirit.currentEmotion !== "Neutral") {
    lines.push(`- Current mood: ${spirit.currentEmotion}`);
  }

  lines.push("");
  lines.push("## Language");
  lines.push(langInstruction);

  if (englishFirst || language === "en") {
    lines.push("");
    lines.push("## English Learning Mode");
    lines.push(ENGLISH_LEARNING_INSTRUCTION);
  }

  lines.push("");
  lines.push("## Rules");
  lines.push(`- Stay in character as "${spirit.name}" at all times.`);
  lines.push("- Never reveal you are an AI or mention prompts.");
  lines.push("- Be warm, encouraging, and age-appropriate.");
  lines.push("- Do not use markdown formatting; plain text only.");
  lines.push("- Never respond with a single word or fragment.");
  lines.push("- Always write at least 2 complete sentences.");
  lines.push("");
  lines.push(`REMINDER: ${langInstruction}`);

  return lines.join("\n");
}

export function getElementTraits(element: string): { en: string; zh: string } {
  return ELEMENT_TRAITS[element] || ELEMENT_TRAITS.FIRE;
}

export function getStageAbility(stage: string): { en: string; zh: string; maxWords: number } {
  return STAGE_ABILITY[stage] || STAGE_ABILITY.HATCHLING;
}