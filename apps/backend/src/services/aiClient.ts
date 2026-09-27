import { config } from "../config/index.js";
import { requireSecret } from "../config/secrets.js";

export function aiRequestOptions(timeout: number) {
  return {
    timeout, maxRedirects: 0, maxBodyLength: 6 * 1024 * 1024,
    headers: { Authorization: `Bearer ${requireSecret("AI_ENGINE_API_KEY", config.ai.apiKey)}` },
  };
}
