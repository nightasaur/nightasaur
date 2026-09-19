import assert from "node:assert/strict";
import test from "node:test";
import {
  IELTS_READING_PRACTICE_VERSION,
  buildIeltsReadingPractice,
  getIeltsReadingPracticeCourseId,
  isStoredIeltsPracticeQuestion,
  parseIeltsReadingPracticeCourseId,
  toPublicIeltsReadingPractice,
} from "./ieltsPractice.js";

const cases = [
  ["foundation", "edu-1"],
  ["consolidation", "society-1"],
  ["maintenance", "eco-1"],
] as const;

test("builds deterministic three-question practice for every focus level", () => {
  for (const [focusLevel, expectedPassageId] of cases) {
    const first = buildIeltsReadingPractice(focusLevel);
    const second = buildIeltsReadingPractice(focusLevel);

    assert.deepEqual(second, first);
    assert.equal(first.length, 3);
    assert.equal(new Set(first.map((question) => question.id)).size, 3);
    assert.ok(first.every(isStoredIeltsPracticeQuestion));
    assert.ok(first.every((question) => question.passageId === expectedPassageId));
  }
});

test("public practice payload never exposes answer keys or explanations", () => {
  const stored = buildIeltsReadingPractice("foundation");
  const practice = toPublicIeltsReadingPractice("foundation", stored);
  const serialized = JSON.stringify(practice);

  assert.equal(practice.version, IELTS_READING_PRACTICE_VERSION);
  assert.equal(practice.focusLevel, "foundation");
  assert.equal(practice.scorePolicy.bandEstimate, null);
  assert.equal(practice.scorePolicy.profileEvidence, false);
  assert.equal(practice.questions.length, 3);
  assert.doesNotMatch(serialized, /"answer"\s*:/);
  assert.doesNotMatch(serialized, /"explanation"\s*:/);
});

test("practice course IDs preserve and validate the focus level", () => {
  for (const [focusLevel] of cases) {
    const courseId = getIeltsReadingPracticeCourseId(focusLevel);
    assert.equal(parseIeltsReadingPracticeCourseId(courseId), focusLevel);
  }

  assert.equal(parseIeltsReadingPracticeCourseId("ielts-reading-practice-v1:unknown"), null);
  assert.equal(parseIeltsReadingPracticeCourseId("ielts-reading-diagnostic-v1"), null);
});

test("rejects malformed stored practice questions before scoring", () => {
  const question = buildIeltsReadingPractice("maintenance")[0];

  assert.equal(isStoredIeltsPracticeQuestion(question), true);
  assert.equal(isStoredIeltsPracticeQuestion({ ...question, answer: 99 }), false);
  assert.equal(isStoredIeltsPracticeQuestion({ ...question, explanation: null }), false);
});
