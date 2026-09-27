import type { LLMProvider } from "./types.js";
import { OllamaProvider } from "./OllamaProvider.js";
import { MockProvider } from "./MockProvider.js";

export type { LLMProvider, LLMMessage, LLMChatOptions, EnglishFeedback } from "./types.js";
export { OllamaProvider } from "./OllamaProvider.js";
export { MockProvider } from "./MockProvider.js";

let cachedProvider: LLMProvider | null = null;

export function getLLMProvider(): LLMProvider {
  if (cachedProvider) return cachedProvider;

  const mode = (process.env.LLM_PROVIDER || "ollama").toLowerCase();
  switch (mode) {
    case "mock":
      cachedProvider = new MockProvider();
      break;
    case "ollama":
    default:
      cachedProvider = new OllamaProvider();
      break;
  }
  return cachedProvider;
}

export function resetLLMProvider(): void {
  cachedProvider = null;
}