import { PrismaClient } from "@prisma/client";
import { getLLMProvider, type LLMMessage } from "../llm/index.js";
import { embeddingService } from "./EmbeddingService.js";
import type { SupportedLanguage } from "./personality.js";

const prisma = new PrismaClient();

export interface MemoryItem {
  content: string;
  category: "fact" | "preference" | "event" | "relationship" | "goal";
  importance: number;
}

const EXTRACT_SYSTEM = [
  "You extract LONG-TERM memorable facts from a conversation between a user and their spirit companion.",
  'Return valid JSON only: {"memories":[{"content":"...","category":"fact|preference|event|relationship|goal","importance":1-10}]}',
  "",
  "MEMORY LANGUAGE RULE (CRITICAL):",
  "- Write each memory content in the SAME language as the user message.",
  "- NEVER mix languages within one memory.",
  "",
  "MUST REJECT (return empty):",
  "- Greetings, thanks, or filler",
  "- Questions the user asked",
  "- Restating the spirit words",
  "- Statements about the spirit",
  "",
  "Rules:",
  "- Max 3 memories per turn.",
  "- Each memory must be one self-contained sentence about the user.",
  '- If nothing worth remembering, return {"memories":[]}.',
].join("\n");

function isValidMemory(content: string, importance: number): boolean {
  const t = content.trim();
  if (t.length < 4) return false;
  if (importance < 4) return false;
  if (/^(what|who|why|where|when|how|which|do you|are you|can you|is it|did|does|will)/i.test(t)) return false;
  if (/(user asked|the user asked|user is|talking to me)/i.test(t)) return false;
  const nameMatch = t.match(/^(\S{2,4}).*\1/);
  if (nameMatch) return false;
  return true;
}

export class MemoryService {
  async extract(
    userMessage: string,
    aiResponse: string,
    language: SupportedLanguage = "zh-TW"
  ): Promise<MemoryItem[]> {
    if (!userMessage || userMessage.trim().length < 4) return [];

    const provider = getLLMProvider();
    const messages: LLMMessage[] = [
      { role: "system", content: EXTRACT_SYSTEM },
      {
        role: "user",
        content: `User said (${language}): "${userMessage}"\nSpirit replied: "${aiResponse}"\n\nExtract memories in ${language}.`,
      },
    ];

    try {
      const raw = await provider.chat(messages, {
        format: "json",
        maxTokens: 300,
        temperature: 0.3,
      });
      const parsed = JSON.parse(raw) as { memories?: unknown };
      const list = Array.isArray(parsed.memories) ? parsed.memories : [];

      const out: MemoryItem[] = [];
      for (const item of list) {
        if (!item || typeof item !== "object") continue;
        const m = item as Record<string, unknown>;
        const content = typeof m.content === "string" ? m.content.trim() : "";
        if (!content || content.length < 3) continue;
        const category = typeof m.category === "string" ? m.category : "fact";
        const imp = typeof m.importance === "number" ? m.importance : 5;
        const mem: MemoryItem = {
          content: content.slice(0, 200),
          category: ["fact", "preference", "event", "relationship", "goal"].includes(category)
            ? (category as MemoryItem["category"])
            : "fact",
          importance: Math.max(1, Math.min(10, Math.round(imp))),
        };
        if (isValidMemory(mem.content, mem.importance)) {
          out.push(mem);
          if (out.length >= 3) break;
        }
      }
      return out;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[Memory] extract failed: ${msg}`);
      return [];
    }
  }

  async save(
    spiritId: string,
    userId: string,
    memories: MemoryItem[],
    sourceConv?: string
  ): Promise<number> {
    if (memories.length === 0) return 0;

    let saved = 0;
    for (const m of memories) {
      const emb = await embeddingService.embed(m.content);
      const embB64 = emb ? embeddingService.encode(emb) : null;

      if (emb) {
        const existing = await prisma.spiritMemory.findMany({
          where: { spiritId, embedding: { not: null } },
          select: { id: true, embedding: true, importance: true },
          orderBy: { createdAt: "desc" },
          take: 200,
        });

        let isDup = false;
        const qvec = new Float32Array(emb);
        for (const e of existing) {
          if (!e.embedding) continue;
          const evec = embeddingService.decode(e.embedding);
          if (!evec) continue;
          const sim = embeddingService.cosine(qvec, evec);
          if (sim > 0.92) {
            isDup = true;
            if (m.importance > e.importance) {
              await prisma.spiritMemory.update({
                where: { id: e.id },
                data: { importance: m.importance, lastUsedAt: new Date() },
              });
            }
            break;
          }
        }
        if (isDup) continue;
      } else {
        const existing = await prisma.spiritMemory.findFirst({
          where: { spiritId, content: m.content },
          select: { id: true },
        });
        if (existing) continue;
      }

      await prisma.spiritMemory.create({
        data: {
          spiritId,
          userId,
          content: m.content,
          category: m.category,
          importance: m.importance,
          embedding: embB64,
          sourceConv: sourceConv ?? null,
        },
      });
      saved++;
    }
    return saved;
  }

  async retrieve(spiritId: string, query: string, topN: number = 5): Promise<string[]> {
    if (!query || query.trim().length === 0) return [];

    const all = await prisma.spiritMemory.findMany({
      where: { spiritId },
      select: {
        id: true,
        content: true,
        category: true,
        importance: true,
        embedding: true,
        createdAt: true,
        lastUsedAt: true,
      },
    });

    if (all.length === 0) return [];

    const fmt = (m: typeof all[number]) => `[${m.category}] ${m.content}`;
    if (all.length <= topN) {
      await prisma.spiritMemory.updateMany({
        where: { id: { in: all.map((c) => c.id) } },
        data: { lastUsedAt: new Date() },
      });
      return all.map(fmt);
    }

    const queryEmb = await embeddingService.embed(query);
    if (queryEmb) {
      const qvec = new Float32Array(queryEmb);
      const now = Date.now();

      const scored = all.map((m) => {
        let sim = 0;
        if (m.embedding) {
          const mvec = embeddingService.decode(m.embedding);
          if (mvec) sim = embeddingService.cosine(qvec, mvec);
        }
        const lastTime = m.lastUsedAt?.getTime() ?? m.createdAt.getTime();
        const daysOld = (now - lastTime) / 86400000;
        const freshness = 1 / (1 + daysOld / 30);
        const score = sim * 0.6 + (m.importance / 10) * 0.25 + freshness * 0.15;
        return { m, sim, score };
      });

      scored.sort((a, b) => b.score - a.score);
      const top = scored.slice(0, topN);
      await prisma.spiritMemory.updateMany({
        where: { id: { in: top.map((s) => s.m.id) } },
        data: { lastUsedAt: new Date() },
      });
      return top.map((s) => fmt(s.m));
    }

    const top = [...all].sort((a, b) => b.importance - a.importance).slice(0, topN);
    await prisma.spiritMemory.updateMany({
      where: { id: { in: top.map((c) => c.id) } },
      data: { lastUsedAt: new Date() },
    });
    return top.map(fmt);
  }

  async listBySpirit(spiritId: string, limit: number = 50): Promise<MemoryItem[]> {
    const rows = await prisma.spiritMemory.findMany({
      where: { spiritId },
      orderBy: [{ importance: "desc" }, { createdAt: "desc" }],
      take: limit,
      select: { content: true, category: true, importance: true },
    });
    return rows.map((r) => ({
      content: r.content,
      category: r.category as MemoryItem["category"],
      importance: r.importance,
    }));
  }

  async listForUser(spiritId: string, userId: string, limit: number = 50) {
    const spirit = await prisma.spirit.findFirst({
      where: { id: spiritId, userId, isActive: true },
      select: { id: true },
    });
    if (!spirit) throw Object.assign(new Error("Spirit not found"), { statusCode: 404 });

    const rows = await prisma.spiritMemory.findMany({
      where: { spiritId },
      orderBy: [{ importance: "desc" }, { createdAt: "desc" }],
      take: limit,
      select: { id: true, content: true, category: true, importance: true, createdAt: true, lastUsedAt: true },
    });
    return rows.map((r) => ({
      id: r.id,
      content: r.content,
      category: r.category as MemoryItem["category"],
      importance: r.importance,
      createdAt: r.createdAt,
      lastUsedAt: r.lastUsedAt,
    }));
  }

  async deleteById(spiritId: string, userId: string, memoryId: string): Promise<boolean> {
    const spirit = await prisma.spirit.findFirst({
      where: { id: spiritId, userId, isActive: true },
      select: { id: true },
    });
    if (!spirit) throw Object.assign(new Error("Spirit not found"), { statusCode: 404 });

    const result = await prisma.spiritMemory.deleteMany({
      where: { id: memoryId, spiritId },
    });
    return result.count > 0;
  }
}

export const memoryService = new MemoryService();
