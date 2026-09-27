import assert from "node:assert/strict";
import test from "node:test";
import {
  buildSpiritSystemPrompt,
  getElementTraits,
  getStageAbility,
} from "../../src/services/spirit/personality.js";

test("getElementTraits returns known element", () => {
  const fire = getElementTraits("FIRE");
  assert.ok(fire.en.includes("passionate"));
  assert.ok(fire.zh.includes("熱情"));
});

test("getElementTraits falls back to FIRE for unknown element", () => {
  const unknown = getElementTraits("NONEXISTENT");
  assert.equal(unknown.en, getElementTraits("FIRE").en);
});

test("getStageAbility returns correct maxWords", () => {
  assert.equal(getStageAbility("EGG").maxWords, 60);
  assert.equal(getStageAbility("LEGENDARY").maxWords, 300);
  assert.equal(getStageAbility("JUVENILE").maxWords, 150);
});

test("buildSpiritSystemPrompt includes name, element, and stage", () => {
  const prompt = buildSpiritSystemPrompt(
    {
      id: "s1",
      name: "Ember",
      element: "FIRE",
      stage: "JUVENILE",
      level: 7,
    },
    { language: "zh-TW" }
  );
  assert.ok(prompt.includes('"Ember"'));
  assert.ok(prompt.includes("FIRE"));
  assert.ok(prompt.includes("JUVENILE"));
  assert.ok(prompt.includes("Level 7"));
});

test("buildSpiritSystemPrompt uses Traditional Chinese instruction", () => {
  const prompt = buildSpiritSystemPrompt(
    { id: "s1", name: "A", element: "FIRE", stage: "ADULT", level: 20 },
    { language: "zh-TW" }
  );
  assert.ok(prompt.includes("Traditional Chinese"));
});

test("buildSpiritSystemPrompt includes English Learning Mode when englishFirst=true", () => {
  const prompt = buildSpiritSystemPrompt(
    { id: "s1", name: "A", element: "WATER", stage: "ADULT", level: 20 },
    { language: "zh-TW", englishFirst: true }
  );
  assert.ok(prompt.includes("English Learning Mode"));
  assert.ok(prompt.includes("CEFR A2-B1"));
});

test("buildSpiritSystemPrompt includes personality and backstory if set", () => {
  const prompt = buildSpiritSystemPrompt(
    {
      id: "s1",
      name: "A",
      element: "STAR",
      stage: "ADULT",
      level: 20,
      personality: "Playful and curious",
      backstory: "Born from a falling star.",
    },
    { language: "en" }
  );
  assert.ok(prompt.includes("Playful and curious"));
  assert.ok(prompt.includes("Born from a falling star."));
});

test("buildSpiritSystemPrompt does not include Neutral mood", () => {
  const prompt = buildSpiritSystemPrompt(
    { id: "s1", name: "A", element: "FIRE", stage: "ADULT", level: 20, currentEmotion: "Neutral" },
    { language: "en" }
  );
  assert.ok(!prompt.includes("Current mood"));
});

test("buildSpiritSystemPrompt includes non-Neutral mood", () => {
  const prompt = buildSpiritSystemPrompt(
    { id: "s1", name: "A", element: "FIRE", stage: "ADULT", level: 20, currentEmotion: "Happy" },
    { language: "en" }
  );
  assert.ok(prompt.includes("Current mood: Happy"));
});