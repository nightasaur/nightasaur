import assert from "node:assert/strict";
import test from "node:test";
import {
  getEmotionIcon,
  normalizeEmotion,
  clampIntensity,
  VALID_EMOTIONS,
} from "../../src/services/spirit/emotionIcons.js";

test("getEmotionIcon returns known emoji", () => {
  assert.equal(getEmotionIcon("happy"), "😊");
  assert.equal(getEmotionIcon("sad"), "😢");
  assert.equal(getEmotionIcon("angry"), "😠");
});

test("getEmotionIcon falls back to neutral", () => {
  assert.equal(getEmotionIcon("confused"), "😐");
  assert.equal(getEmotionIcon(""), "😐");
});

test("normalizeEmotion handles case and trim", () => {
  assert.equal(normalizeEmotion("HAPPY"), "happy");
  assert.equal(normalizeEmotion("  Sad  "), "sad");
  assert.equal(normalizeEmotion("unknown"), "neutral");
  assert.equal(normalizeEmotion(null), "neutral");
  assert.equal(normalizeEmotion(42), "neutral");
});

test("clampIntensity enforces 0-10 range", () => {
  assert.equal(clampIntensity(5), 5);
  assert.equal(clampIntensity(-3), 0);
  assert.equal(clampIntensity(15), 10);
  assert.equal(clampIntensity(7.6), 8);
  assert.equal(clampIntensity("x"), 0);
  assert.equal(clampIntensity(NaN), 0);
});

test("VALID_EMOTIONS has 6 entries", () => {
  assert.equal(VALID_EMOTIONS.length, 6);
});