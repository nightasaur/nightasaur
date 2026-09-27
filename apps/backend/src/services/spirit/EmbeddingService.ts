const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL
  || process.env.OLLAMA_URL?.replace(/\/api\/(generate|chat|embeddings).*$/, "")
  || "http://localhost:11434";
const EMBEDDING_MODEL = process.env.OLLAMA_EMBEDDING_MODEL || "nomic-embed-text";
const CF_CLIENT_ID = process.env.CF_ACCESS_CLIENT_ID || "";
const CF_CLIENT_SECRET = process.env.CF_ACCESS_CLIENT_SECRET || "";

export class EmbeddingService {
  private baseUrl = OLLAMA_BASE_URL.replace(/\/+$/, "");

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (CF_CLIENT_ID && CF_CLIENT_SECRET) {
      headers["CF-Access-Client-Id"] = CF_CLIENT_ID;
      headers["CF-Access-Client-Secret"] = CF_CLIENT_SECRET;
    }
    return headers;
  }

  async embed(text: string): Promise<number[] | null> {
    if (!text || !text.trim()) return null;
    try {
      const res = await fetch(`${this.baseUrl}/api/embeddings`, {
        method: "POST",
        headers: this.buildHeaders(),
        body: JSON.stringify({ model: EMBEDDING_MODEL, prompt: text.slice(0, 2000) }),
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { embedding?: number[] };
      return Array.isArray(data.embedding) ? data.embedding : null;
    } catch {
      return null;
    }
  }

  encode(emb: number[]): string {
    const f32 = new Float32Array(emb);
    return Buffer.from(f32.buffer).toString("base64");
  }

  decode(b64: string): Float32Array | null {
    try {
      const buf = Buffer.from(b64, "base64");
      return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
    } catch {
      return null;
    }
  }

  cosine(a: Float32Array, b: Float32Array): number {
    if (a.length !== b.length) return 0;
    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      na += a[i] * a[i];
      nb += b[i] * b[i];
    }
    if (na === 0 || nb === 0) return 0;
    return dot / (Math.sqrt(na) * Math.sqrt(nb));
  }
}

export const embeddingService = new EmbeddingService();
