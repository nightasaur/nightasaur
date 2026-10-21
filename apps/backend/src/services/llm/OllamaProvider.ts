import type { LLMProvider, LLMMessage, LLMChatOptions } from "./types.js";

// 支援兩種環境變數：OLLAMA_BASE_URL（首選）或 OLLAMA_URL（相容舊設定）
const rawBaseUrl =
  process.env.OLLAMA_BASE_URL ||
  process.env.OLLAMA_URL?.replace(/\/api\/(generate|chat).*$/, "") ||
  "http://localhost:11434";
const DEFAULT_BASE_URL = rawBaseUrl.replace(/\/+$/, "");
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || "minimax-m3.1-flash:cloud";
const FALLBACK_MODELS = ["minimax-m3.1-flash:cloud", "qwen2.5-coder:1.5b", "qwen2.5:3b", "qwen2.5:7b"];
const DEFAULT_TIMEOUT_MS = parseInt(process.env.OLLAMA_TIMEOUT_MS || "120000", 10);
const CF_CLIENT_ID = process.env.CF_ACCESS_CLIENT_ID || "";
const CF_CLIENT_SECRET = process.env.CF_ACCESS_CLIENT_SECRET || "";

export class OllamaProvider implements LLMProvider {
  readonly name = "ollama";
  private baseUrl: string;
  private defaultModel: string;

  constructor(baseUrl?: string, model?: string) {
    this.baseUrl = (baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.defaultModel = model || DEFAULT_MODEL;
  }

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (CF_CLIENT_ID && CF_CLIENT_SECRET) {
      headers["CF-Access-Client-Id"] = CF_CLIENT_ID;
      headers["CF-Access-Client-Secret"] = CF_CLIENT_SECRET;
    }
    return headers;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`, {
        headers: this.buildHeaders(),
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async chat(messages: LLMMessage[], options: LLMChatOptions = {}): Promise<string> {
    const primaryModel = options.model || this.defaultModel;
    const isTestEnv = process.env.VITEST === "true" || process.env.NODE_ENV === "test";
    const candidates = isTestEnv
      ? [primaryModel]
      : Array.from(new Set([primaryModel, ...FALLBACK_MODELS]));

    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    let lastError: Error | null = null;

    for (const candidateModel of candidates) {
      const body: Record<string, unknown> = {
        model: candidateModel,
        messages,
        stream: false,
        options: {
          temperature: options.temperature ?? 0.7,
          num_predict: options.maxTokens ?? 500,
        },
      };
      if (options.format === "json") {
        body.format = "json";
      }

      try {
        const res = await fetch(`${this.baseUrl}/api/chat`, {
          method: "POST",
          headers: this.buildHeaders(),
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(timeoutMs),
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          lastError = new Error(`Ollama chat failed (${res.status}): ${text.slice(0, 200)}`);
          if (isTestEnv) throw lastError;
          continue;
        }

        const data = (await res.json()) as { message?: { content?: string } };
        const content = data?.message?.content;
        if (typeof content !== "string") {
          lastError = new Error("Ollama returned unexpected response shape");
          if (isTestEnv) throw lastError;
          continue;
        }
        return content;
      } catch (err: any) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (isTestEnv) throw lastError;
      }
    }

    throw lastError || new Error("Ollama chat failed across all candidate models");
  }
}
