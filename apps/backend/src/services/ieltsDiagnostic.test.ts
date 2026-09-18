import assert from "node:assert/strict";
import test from "node:test";
import {
  IELTS_READING_DIAGNOSTIC_ID,
  buildIeltsReadingDiagnostic,
  isStoredIeltsDiagnosticQuestion,
  toPublicIeltsReadingDiagnostic,
} from "./ieltsDiagnostic.js";

test("builds a deterministic two-passage reading baseline", () => {
  const first = buildIeltsReadingDiagnostic();
  const second = buildIeltsReadingDiagnostic();

  assert.deepEqual(second, first);
  assert.equal(first.length, 6);
  assert.equal(new Set(first.map((question) => question.id)).size, first.length);
  assert.equal(new Set(first.map((question) => question.passageId)).size, 2);
  assert.ok(first.every(isStoredIeltsDiagnosticQuestion));
});

test("never exposes answer keys or explanations in the start payload", () => {
  const diagnostic = toPublicIeltsReadingDiagnostic(buildIeltsReadingDiagnostic());
  const serialized = JSON.stringify(diagnostic);

  assert.equal(diagnostic.id, IELTS_READING_DIAGNOSTIC_ID);
  assert.equal(diagnostic.scorePolicy.bandEstimate, null);
  assert.equal(diagnostic.questions.length, 6);
  assert.doesNotMatch(serialized, /"answer"\s*:/);
  assert.doesNotMatch(serialized, /"explanation"\s*:/);
});

test("rejects malformed stored questions before they can be scored", () => {
  const question = buildIeltsReadingDiagnostic()[0];

  assert.equal(isStoredIeltsDiagnosticQuestion(question), true);
  assert.equal(isStoredIeltsDiagnosticQuestion({ ...question, answer: 99 }), false);
  assert.equal(isStoredIeltsDiagnosticQuestion({ ...question, options: [] }), false);
});
