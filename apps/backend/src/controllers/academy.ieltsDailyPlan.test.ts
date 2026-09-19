import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import type { NextFunction, Request, Response } from "express";
import prisma from "../config/prisma.js";
import { IELTS_READING_DIAGNOSTIC_ID } from "../services/ieltsDiagnostic.js";
import { academyController } from "./academy.js";

const learningSession = prisma.learningSession;
const originalFindMany = learningSession.findMany.bind(learningSession);

afterEach(() => {
  learningSession.findMany = originalFindMany;
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

test("IELTS daily plan requires authentication without querying evidence", async () => {
  learningSession.findMany = (async () => {
    throw new Error("findMany must not run without an authenticated user");
  }) as typeof learningSession.findMany;

  const request = {} as Request;
  const { response, recorder } = createResponseRecorder();
  await academyController.getIeltsDailyPlan(request, response, failOnNext);

  assert.equal(recorder.statusCode, 401);
  assert.deepEqual(recorder.body, { error: "請先登入" });
});

test("IELTS daily plan requires a completed diagnostic before assigning work", async () => {
  let query: unknown;
  learningSession.findMany = (async (args: unknown) => {
    query = args;
    return [];
  }) as typeof learningSession.findMany;

  const request = { user: { userId: "user-1" } } as Request;
  const { response, recorder } = createResponseRecorder();
  await academyController.getIeltsDailyPlan(request, response, failOnNext);

  assert.equal(recorder.statusCode, 200);
  assert.deepEqual(recorder.body, {
    planVersion: "ielts-daily-plan-v1",
    status: "diagnostic-required",
    evidencePolicy: "latest-completed-diagnostic-only",
    scope: ["reading"],
    generatedFrom: null,
    focusLevel: null,
    totalMinutes: 0,
    tasks: [],
    bandEstimate: null,
    notice:
      "Complete the original IELTS-style Reading Diagnostic before a daily plan is assigned. This is not an official IELTS Band estimate.",
  });
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

test("IELTS daily plan derives a bounded foundation plan from objective evidence", async () => {
  learningSession.findMany = (async () => [
    {
      id: "latest-session",
      correctCount: 3,
      totalQuestions: 6,
      completedAt: new Date("2026-09-19T01:00:00.000Z"),
      questions: "must-not-leak",
      answers: "must-not-leak",
    },
  ]) as unknown as typeof learningSession.findMany;

  const request = { user: { userId: "user-1" } } as Request;
  const { response, recorder } = createResponseRecorder();
  await academyController.getIeltsDailyPlan(request, response, failOnNext);

  assert.equal(recorder.statusCode, 200);
  assert.deepEqual(recorder.body, {
    planVersion: "ielts-daily-plan-v1",
    status: "ready",
    evidencePolicy: "latest-completed-diagnostic-only",
    scope: ["reading"],
    generatedFrom: {
      sessionId: "latest-session",
      scoreType: "objective-accuracy",
      correct: 3,
      total: 6,
      accuracyPercent: 50,
      completedAt: "2026-09-19T01:00:00.000Z",
    },
    focusLevel: "foundation",
    totalMinutes: 25,
    tasks: [
      {
        id: "reading-evidence-review",
        type: "review",
        skill: "reading",
        minutes: 10,
        targetQuestionCount: 6,
        sourceSessionId: "latest-session",
      },
      {
        id: "reading-targeted-practice",
        type: "practice",
        skill: "reading",
        minutes: 15,
        focus: "foundation",
      },
    ],
    bandEstimate: null,
    notice:
      "This deterministic plan uses objective diagnostic accuracy only. It is not an official IELTS Band estimate.",
  });
  assert.doesNotMatch(JSON.stringify(recorder.body), /questions|answers|explanation/);
});

test("IELTS daily plan uses explicit accuracy thresholds", async () => {
  for (const [correctCount, expectedFocus] of [
    [7, "consolidation"],
    [9, "maintenance"],
  ] as const) {
    learningSession.findMany = (async () => [
      {
        id: `session-${correctCount}`,
        correctCount,
        totalQuestions: 10,
        completedAt: null,
      },
    ]) as unknown as typeof learningSession.findMany;

    const request = { user: { userId: "user-1" } } as Request;
    const { response, recorder } = createResponseRecorder();
    await academyController.getIeltsDailyPlan(request, response, failOnNext);

    const body = recorder.body as {
      focusLevel: string;
      tasks: Array<{ focus?: string }>;
      bandEstimate: null;
    };
    assert.equal(body.focusLevel, expectedFocus);
    assert.equal(body.tasks[1]?.focus, expectedFocus);
    assert.equal(body.bandEstimate, null);
  }
});

test("IELTS daily plan ignores impossible or zero-question evidence", async () => {
  learningSession.findMany = (async () => [
    {
      id: "impossible-session",
      correctCount: 7,
      totalQuestions: 6,
      completedAt: new Date("2026-09-19T01:00:00.000Z"),
    },
    {
      id: "zero-session",
      correctCount: 0,
      totalQuestions: 0,
      completedAt: new Date("2026-09-18T01:00:00.000Z"),
    },
  ]) as unknown as typeof learningSession.findMany;

  const request = { user: { userId: "user-1" } } as Request;
  const { response, recorder } = createResponseRecorder();
  await academyController.getIeltsDailyPlan(request, response, failOnNext);

  const body = recorder.body as { status: string; tasks: unknown[] };
  assert.equal(body.status, "diagnostic-required");
  assert.deepEqual(body.tasks, []);
});
