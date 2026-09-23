export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  format?: "json" | "text";
  timeoutMs?: number;
}

export interface LLMProvider {
  readonly name: string;
  chat(messages: LLMMessage[], options?: LLMChatOptions): Promise<string>;
  isAvailable(): Promise<boolean>;
}

export interface EnglishFeedback {
  response: string;
  grammarFeedback: string;
  vocabularyHint: string;
  correctedText: string;
  score: number;
  truthScore: number;
}