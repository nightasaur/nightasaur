import assert from "node:assert/strict";
import test from "node:test";
import { detectLanguage } from "../../src/services/spirit/detectLanguage.js";

test("detects Traditional Chinese", () => {
  assert.equal(detectLanguage("你好嗎？我們來學習吧！"), "zh-TW");
});

test("detects Simplified Chinese", () => {
  assert.equal(detectLanguage("你好吗？我们来学习吧！"), "zh-CN");
});

test("detects English", () => {
  assert.equal(detectLanguage("Hello, how are you?"), "en");
});

test("detects Japanese kana", () => {
  assert.equal(detectLanguage("こんにちは"), "ja");
});

test("detects Korean Hangul", () => {
  assert.equal(detectLanguage("안녕하세요"), "ko");
});

test("uses fallback for empty text", () => {
  assert.equal(detectLanguage("", "zh-TW"), "zh-TW");
  assert.equal(detectLanguage("", "en"), "en");
});

test("uses fallback for ambiguous text", () => {
  assert.equal(detectLanguage("12345", "zh-TW"), "zh-TW");
});

test("mixed Chinese with more Traditional chars wins", () => {
  const text = "這個問題嗎？我們說話吧。裡";
  assert.equal(detectLanguage(text), "zh-TW");
});

test("mixed Chinese with more Simplified chars wins", () => {
  const text = "这个问题吗？我们说话吧。里";
  assert.equal(detectLanguage(text), "zh-CN");
});