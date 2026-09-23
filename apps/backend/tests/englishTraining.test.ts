import assert from "node:assert/strict";
import test from "node:test";
import { MockProvider } from "../src/services/llm/MockProvider.js";

test("MockProvider returns valid JSON in json format", async () => {
  const p = new MockProvider();
  const raw = await p.chat([{ role: "user", content: "hello" }], { format: "json" });
  const parsed = JSON.parse(raw);
  assert.equal(typeof parsed.response, "string");
  assert.equal(typeof parsed.grammarFeedback, "string");
  assert.equal(typeof parsed.vocabularyHint, "string");
  assert.equal(typeof parsed.correctedText, "string");
  assert.equal(typeof parsed.score, "number");
  assert.equal(typeof parsed.truthScore, "number");
  assert.ok(parsed.score >= 0 && parsed.score <= 100);
  assert.ok(parsed.truthScore >= 0 && parsed.truthScore <= 100);
});

test("MockProvider returns text in non-json format", async () => {
  const p = new MockProvider();
  const raw = await p.chat([{ role: "user", content: "hello" }]);
  assert.equal(typeof raw, "string");
  assert.ok(raw.length > 0);
  assert.throws(() => JSON.parse(raw));
});

test("MockProvider is always available", async () => {
  const p = new MockProvider();
  assert.equal(await p.isAvailable(), true);
});

test("MockProvider echoes last user message in correctedText", async () => {
  const p = new MockProvider();
  const raw = await p.chat(
    [
      { role: "system", content: "system prompt" },
      { role: "user", content: "I is happy" },
    ],
    { format: "json" }
  );
  const parsed = JSON.parse(raw);
  assert.equal(parsed.correctedText, "I is happy");
});