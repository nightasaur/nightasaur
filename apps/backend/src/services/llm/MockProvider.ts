import type { LLMProvider, LLMMessage, LLMChatOptions } from "./types.js";

export class MockProvider implements LLMProvider {
  readonly name = "mock";

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async chat(messages: LLMMessage[], options: LLMChatOptions = {}): Promise<string> {
    if (options.format === "json") {
      return JSON.stringify({
        response: "That is a great start! Tell me more about it.",
        grammarFeedback: "Good sentence structure.",
        vocabularyHint: "Try using more descriptive words.",
        correctedText: messages[messages.length - 1]?.content || "",
        score: 75,
        truthScore: 80,
      });
    }
    return "That is a great start! Tell me more.";
  }
}