import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import type { NextFunction, Request, Response } from "express";
import prisma from "../config/prisma.js";
import { IELTS_READING_DIAGNOSTIC_ID } from "../services/ieltsDiagnostic.js";
import {
  buildIeltsReadingPractice,
  getIeltsReadingPracticeCourseId,
} from "../services/ieltsPractice.js";
import { academyController } from "./academy.js";

const learningSession = prisma.learningSession;
const originalCreate = learningSession.create.bind(learningSession);
const originalFindMany = learningSession.findMany.bind(learningSession);
const originalFindUnique = learningSession.findUnique.bind(learningSession);
const originalUpdateMany = learningSession.updateMany.bind(learningSession);

afterEach(() => {
  learningSession.create = originalCreate;
  learningSession.findMany = originalFindMany;
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

test("practice start requires authentication without querying evidence", async () => {
  learningSession.findMany = (async () => {
    throw new Error("findMany must not run without an authenticated user");
  }) as typeof learningSession.findMany;

  const { response, recorder } = createResponseRecorder();
  await academyController.startIeltsReadingPractice({} as Request, response, failOnNext);

  assert.equal(recorder.statusCode, 401);
  assert.deepEqual(recorder.body, { error: "請先登入" });
});

test("practice start fails closed until valid diagnostic evidence exists", async () => {
  learningSession.findMany = (async () => []) as typeof learningSession.findMany;
  learningSession.create = (async () => {
    throw new Error("create must not run without diagnostic evidence");
  }) as typeof learningSession.create;

  const request = { user: { userId: "user-1" } } as Request;
  const { response, recorder } = createResponseRecorder();
  await academyController.startIeltsReadingPractice(request, response, failOnNext);

  assert.equal(recorder.statusCode, 409);
  assert.deepEqual(recorder.body, {
    error: "請先完成 IELTS Reading Diagnostic",
    code: "diagnostic-required",
  });
});

test("practice start derives focus from evidence and hides answer keys", async () => {
  let createArgs: unknown;
  learningSession.findMany = (async () => [
    {
      id: "diagnostic-session",
      correctCount: 3,
      totalQuestions: 6,
      completedAt: new Date("2026-09-19T01:00:00.000Z"),
    },
  ]) as unknown as typeof learningSession.findMany;
  learningSession.create = (async (args: unknown) => {
    createArgs = args;
    return { id: "practice-session" };
  }) as typeof learningSession.create;

  const request = { user: { userId: "user-1" } } as Request;
  const { response, recorder } = createResponseRecorder();
  await academyController.startIeltsReadingPractice(request, response, failOnNext);

  assert.equal(recorder.statusCode, 201);
  const body = recorder.body as {
    sessionId: string;
    practice: { focusLevel: string; scorePolicy: { profileEvidence: boolean } };
  };
  assert.equal(body.sessionId, "practice-session");
  assert.equal(body.practice.focusLevel, "foundation");
  assert.equal(body.practice.scorePolicy.profileEvidence, false);
  assert.doesNotMatch(JSON.stringify(body), /"answer"\s*:|"explanation"\s*:/);

  const persisted = createArgs as {
    data: { userId: string; courseId: string; totalQuestions: number; questions: string };
  };
  assert.equal(persisted.data.userId, "user-1");
  assert.equal(
    persisted.data.courseId,
    getIeltsReadingPracticeCourseId("foundation"),
  );
  assert.equal(persisted.data.totalQuestions, 3);
  assert.match(persisted.data.questions, /"answer"\s*:/);
});

test("practice answer returns objective feedback and never updates profile evidence", async () => {
  const question = buildIeltsReadingPractice("maintenance")[0];
  const courseId = getIeltsReadingPracticeCourseId("maintenance");
  const baseSession = {
    id: "practice-session-2",
    userId: "user-1",
    spiritId: null,
    courseId,
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
  await academyController.answerIeltsReadingPractice(request, response, failOnNext);

  assert.equal(recorder.statusCode, 200);
  const body = recorder.body as {
    feedback: { correct: boolean; explanation: string };
    result: {
      scoreType: string;
      focusLevel: string;
      accuracyPercent: number;
      profileEvidence: boolean;
      bandEstimate: null;
    };
  };
  assert.equal(body.feedback.correct, true);
  assert.equal(body.feedback.explanation, question.explanation);
  assert.deepEqual(body.result, {
    skill: "reading",
    scoreType: "practice-accuracy",
    focusLevel: "maintenance",
    correct: 1,
    total: 1,
    accuracyPercent: 100,
    profileEvidence: false,
    bandEstimate: null,
    notice:
      "This practice result is objective feedback only. It does not replace diagnostic evidence or estimate an official IELTS Band.",
  });

  const guardedUpdate = updateArgs as {
    where: { id: string; userId: string; courseId: string; currentQuestion: number; completed: boolean };
  };
  assert.deepEqual(guardedUpdate.where, {
    id: baseSession.id,
    userId: "user-1",
    courseId,
    currentQuestion: 0,
    completed: false,
  });
});

test("practice answer rejects completed and out-of-order submissions", async () => {
  const questions = buildIeltsReadingPractice("consolidation");
  const courseId = getIeltsReadingPracticeCourseId("consolidation");

  learningSession.findUnique = (async () => ({
    id: "practice-session-3",
    userId: "user-1",
    courseId,
    totalQuestions: questions.length,
    currentQuestion: 0,
    correctCount: 0,
    questions: JSON.stringify(questions),
    answers: "[]",
    completed: false,
  })) as unknown as typeof learningSession.findUnique;
  learningSession.updateMany = (async () => {
    throw new Error("updateMany must not run for an out-of-order answer");
  }) as typeof learningSession.updateMany;

  const request = {
    user: { userId: "user-1" },
    params: { sessionId: "practice-session-3" },
    body: { questionId: questions[1].id, answerIndex: 0 },
  } as unknown as Request;
  const { response, recorder } = createResponseRecorder();
  await academyController.answerIeltsReadingPractice(request, response, failOnNext);

  assert.equal(recorder.statusCode, 409);
  assert.deepEqual(recorder.body, {
    error: "請依序作答",
    expectedQuestionId: questions[0].id,
  });
});

test("diagnostic evidence query remains scoped and excludes practice sessions", async () => {
  let query: unknown;
  learningSession.findMany = (async (args: unknown) => {
    query = args;
    return [];
  }) as typeof learningSession.findMany;

  const request = { user: { userId: "user-1" } } as Request;
  const { response } = createResponseRecorder();
  await academyController.startIeltsReadingPractice(request, response, failOnNext);

  assert.deepEqual(query, {
    where: {
      userId: "user-1",
      courseId: IELTS_READING_DIAGNOSTIC_ID,
      completed: true,
    },
    select: {
      id: true,
      correctCount: true,
      totalQuestions: true,
      completedAt: true,
    },
    orderBy: [{ completedAt: "desc" }, { createdAt: "desc" }],
  });
});
