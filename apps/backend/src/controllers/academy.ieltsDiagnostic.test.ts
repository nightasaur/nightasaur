import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import type { NextFunction, Request, Response } from "express";
import prisma from "../config/prisma.js";
import {
  IELTS_READING_DIAGNOSTIC_ID,
  buildIeltsReadingDiagnostic,
} from "../services/ieltsDiagnostic.js";
import { academyController } from "./academy.js";

const learningSession = prisma.learningSession;
const originalCreate = learningSession.create.bind(learningSession);
const originalFindUnique = learningSession.findUnique.bind(learningSession);
const originalUpdateMany = learningSession.updateMany.bind(learningSession);

afterEach(() => {
  learningSession.create = originalCreate;
  learningSession.findUnique = originalFindUnique;
  learningSession.updateMany = originalUpdateMany;
});

function createResponseRecorder() {
  const recorder: { statusCode: number; body: unknown } = {
    statusCode: 200,
    body: undefined,
  };

  const response = {
    status(code: number) {
      recorder.statusCode = code;
      return response;
    },
    json(body: unknown) {
      recorder.body = body;
      return response;
    },
  } as unknown as Response;

  return { response, recorder };
}

const failOnNext: NextFunction = (error?: unknown) => {
  throw error instanceof Error ? error : new Error("Unexpected next() call");
};

test("start endpoint persists answer keys but returns a key-free payload", async () => {
  let createArgs: unknown;
  learningSession.create = (async (args: unknown) => {
    createArgs = args;
    return { id: "diagnostic-session-1" };
  }) as typeof learningSession.create;

  const request = { user: { userId: "user-1" } } as Request;
  const { response, recorder } = createResponseRecorder();
  await academyController.startIeltsReadingDiagnostic(request, response, failOnNext);

  assert.equal(recorder.statusCode, 201);
  const responseJson = JSON.stringify(recorder.body);
  assert.doesNotMatch(responseJson, /"answer"\s*:/);
  assert.doesNotMatch(responseJson, /"explanation"\s*:/);

  const persisted = createArgs as {
    data: { courseId: string; totalQuestions: number; questions: string; answers: string };
  };
  assert.equal(persisted.data.courseId, IELTS_READING_DIAGNOSTIC_ID);
  assert.equal(persisted.data.totalQuestions, 6);
  assert.match(persisted.data.questions, /"answer"\s*:/);
  assert.equal(persisted.data.answers, "[]");
});

test("answer endpoint scores on the server and uses a duplicate-submit guard", async () => {
  const question = buildIeltsReadingDiagnostic()[0];
  const baseSession = {
    id: "diagnostic-session-2",
    userId: "user-1",
    spiritId: null,
    courseId: IELTS_READING_DIAGNOSTIC_ID,
    totalQuestions: 1,
    currentQuestion: 0,
    correctCount: 0,
    questions: JSON.stringify([question]),
    answers: "[]",
    completed: false,
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  let findCount = 0;
  let updateArgs: unknown;

  learningSession.findUnique = (async () => {
    findCount += 1;
    return findCount === 1
      ? baseSession
      : { ...baseSession, currentQuestion: 1, correctCount: 1, completed: true };
  }) as unknown as typeof learningSession.findUnique;
  learningSession.updateMany = (async (args: unknown) => {
    updateArgs = args;
    return { count: 1 };
  }) as typeof learningSession.updateMany;

  const request = {
    user: { userId: "user-1" },
    params: { sessionId: baseSession.id },
    body: { questionId: question.id, answerIndex: question.answer },
  } as unknown as Request;
  const { response, recorder } = createResponseRecorder();
  await academyController.answerIeltsReadingDiagnostic(request, response, failOnNext);

  assert.equal(recorder.statusCode, 200);
  const body = recorder.body as {
    feedback: { correct: boolean };
    result: { correct: number; total: number; accuracyPercent: number; bandEstimate: null };
  };
  assert.equal(body.feedback.correct, true);
  assert.deepEqual(body.result, {
    skill: "reading",
    scoreType: "objective-accuracy",
    correct: 1,
    total: 1,
    accuracyPercent: 100,
    bandEstimate: null,
    notice: "這是原創 IELTS-style 閱讀基線，不是官方 IELTS 測驗或 Band 預估。",
  });

  const guardedUpdate = updateArgs as {
    where: { id: string; userId: string; currentQuestion: number; completed: boolean };
  };
  assert.deepEqual(guardedUpdate.where, {
    id: baseSession.id,
    userId: "user-1",
    courseId: IELTS_READING_DIAGNOSTIC_ID,
    currentQuestion: 0,
    completed: false,
  });
});

test("answer endpoint rejects an out-of-order question without updating", async () => {
  const question = buildIeltsReadingDiagnostic()[0];
  learningSession.findUnique = (async () => ({
    id: "diagnostic-session-3",
    userId: "user-1",
    courseId: IELTS_READING_DIAGNOSTIC_ID,
    totalQuestions: 6,
    currentQuestion: 0,
    correctCount: 0,
    questions: JSON.stringify(buildIeltsReadingDiagnostic()),
    answers: "[]",
    completed: false,
  })) as unknown as typeof learningSession.findUnique;
  learningSession.updateMany = (async () => {
    throw new Error("updateMany must not run for an out-of-order answer");
  }) as typeof learningSession.updateMany;

  const request = {
    user: { userId: "user-1" },
    params: { sessionId: "diagnostic-session-3" },
    body: { questionId: "a-future-question", answerIndex: 0 },
  } as unknown as Request;
  const { response, recorder } = createResponseRecorder();
  await academyController.answerIeltsReadingDiagnostic(request, response, failOnNext);

  assert.equal(recorder.statusCode, 409);
  assert.deepEqual(recorder.body, {
    error: "請依序作答",
    expectedQuestionId: question.id,
  });
});
