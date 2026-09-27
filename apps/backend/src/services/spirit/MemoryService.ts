import { PrismaClient } from "@prisma/client";
import { getLLMProvider, type LLMMessage } from "../llm/index.js";
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
  "- If user wrote Traditional Chinese -> memory in Traditional Chinese.",
  "- If user wrote Simplified Chinese -> memory in Simplified Chinese.",
  "- If user wrote English -> memory in English.",
  "- NEVER mix languages within one memory.",
  "",
  "MUST REJECT (return empty):",
  "- Greetings, thanks, or filler",
  "- Questions the user asked (questions are not facts)",
  "- Restating the spirit words",
  "- Statements about the spirit (only facts about the USER count)",
  "- Meta statements like user asked if I remember",
  "",
  "BAD examples (do NOT save):",
  "- Alex asked if I remember him",
  "- Alex remembers Alex",
  "- The user is talking to me",
  "",
  "GOOD examples (save these):",
  "- Alex name is Alex (category: fact, importance: 9)",
  "- Alex likes black coffee (category: preference, importance: 7)",
  "- Alex has a cat named Mimi (category: relationship, importance: 7)",
  "",
  "Rules:",
  "- Max 3 memories per turn.",
  "- Each memory must be one self-contained sentence about the user.",
  '- If nothing worth remembering, return {"memories":[]}.',
].join("\n");

const RETRIEVE_SYSTEM = [
  "You select the most relevant memories to include in a spirit's context before replying to the user.",
  'Return valid JSON only: {"indices":[0,3,7]}',
  "Pick at most the requested number of indices, ranked by relevance to the user message.",
  'If none are relevant, return {"indices":[]}.',
].join("\n");

function isValidMemory(content: string, importance: number): boolean {
  const t = content.trim();
  if (t.length < 4) return false;
  if (importance < 4) return false;

  // Reject questions (Chinese + English)
  if (/[？?]$/.test(t)) return false;
  if (/^(你|您|什麼|誰|為什麼|哪|幾|怎麼|如何|是不是|有沒有|還記得)/.test(t)) return false;
  if (/^(what|who|why|where|when|how|which|do you|are you|can you|is it|did|does|will)/i.test(t)) return false;

  // Reject spirit's own words
  if (/^(我記得|我認為|我覺得|我會|我可以|我想|我很|我也)/.test(t)) return false;

  // Reject meta statements
  if (/(使用者問|用戶問|user asked|the user asked|user is|talking to me)/i.test(t)) return false;

  // Reject anything mentioning "remember"
  if (/記得|记得/.test(t)) return false;

  // Reject name echo (e.g. "Alex記得Alex")
  const nameMatch = t.match(/^(\S{2,4})[記记].*\1/);
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
        out.push({
          content: content.slice(0, 200),
          category: ["fact", "preference", "event", "relationship", "goal"].includes(category)
            ? (category as MemoryItem["category"])
            : "fact",
          importance: Math.max(1, Math.min(10, Math.round(imp))),
        });
        if (isValidMemory(out[out.length - 1].content, out[out.length - 1].importance)) {
          if (out.length >= 3) break;
        } else {
          out.pop();
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
      const existing = await prisma.spiritMemory.findFirst({
        where: { spiritId, content: m.content },
        select: { id: true },
      });
      if (existing) continue;

      await prisma.spiritMemory.create({
        data: {
          spiritId,
          userId,
          content: m.content,
          category: m.category,
          importance: m.importance,
          sourceConv: sourceConv ?? null,
        },
      });
      saved++;
    }
    return saved;
  }

  async retrieve(
    spiritId: string,
    query: string,
    topN: number = 5
  ): Promise<string[]> {
    if (!query || query.trim().length === 0) return [];

    const candidates = await prisma.spiritMemory.findMany({
      where: { spiritId },
      orderBy: [{ importance: "desc" }, { createdAt: "desc" }],
      take: 30,
      select: { id: true, content: true, importance: true, category: true },
    });

    if (candidates.length === 0) return [];
    if (candidates.length <= topN) {
      await prisma.spiritMemory.updateMany({
        where: { id: { in: candidates.map((c) => c.id) } },
        data: { lastUsedAt: new Date() },
      });
      return candidates.map((c) => `[${c.category}] ${c.content}`);
    }

    const provider = getLLMProvider();
    const numbered = candidates.map((c, i) => `${i}. [${c.category}] ${c.content}`).join("\n");
    const messages: LLMMessage[] = [
      { role: "system", content: RETRIEVE_SYSTEM },
      {
        role: "user",
        content: `User message: "${query}"\n\nAvailable memories (pick at most ${topN}):\n${numbered}`,
      },
    ];

    try {
      const raw = await provider.chat(messages, {
        format: "json",
        maxTokens: 100,
        temperature: 0.2,
      });
      const parsed = JSON.parse(raw) as { indices?: unknown };
      const indices = Array.isArray(parsed.indices) ? parsed.indices : [];
      const picked = indices
        .filter((i): i is number => typeof i === "number" && i >= 0 && i < candidates.length)
        .slice(0, topN);

      if (picked.length === 0) return [];

      const selectedIds = picked.map((i) => candidates[i].id);
      await prisma.spiritMemory.updateMany({
        where: { id: { in: selectedIds } },
        data: { lastUsedAt: new Date() },
      });
      return picked.map((i) => `[${candidates[i].category}] ${candidates[i].content}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[Memory] retrieve failed, using top by importance: ${msg}`);
      const top = candidates.slice(0, topN);
      await prisma.spiritMemory.updateMany({
        where: { id: { in: top.map((c) => c.id) } },
        data: { lastUsedAt: new Date() },
      });
      return top.map((c) => `[${c.category}] ${c.content}`);
    }
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
