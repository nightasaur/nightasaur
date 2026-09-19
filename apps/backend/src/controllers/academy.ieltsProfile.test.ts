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

test("IELTS profile requires authentication without querying evidence", async () => {
  learningSession.findMany = (async () => {
    throw new Error("findMany must not run without an authenticated user");
  }) as typeof learningSession.findMany;

  const request = {} as Request;
  const { response, recorder } = createResponseRecorder();
  await academyController.getIeltsLearningProfile(request, response, failOnNext);

  assert.equal(recorder.statusCode, 401);
  assert.deepEqual(recorder.body, { error: "請先登入" });
});

test("IELTS profile reports all skills as unassessed when no evidence exists", async () => {
  let query: unknown;
  learningSession.findMany = (async (args: unknown) => {
    query = args;
    return [];
  }) as typeof learningSession.findMany;

  const request = { user: { userId: "user-1" } } as Request;
  const { response, recorder } = createResponseRecorder();
  await academyController.getIeltsLearningProfile(request, response, failOnNext);

  assert.equal(recorder.statusCode, 200);
  const body = recorder.body as {
    profileVersion: string;
    evidencePolicy: string;
    skills: Record<string, {
      status: string;
      evidenceCount: number;
      latestEvidence: unknown;
      bestAccuracyPercent: number | null;
      bandEstimate: null;
    }>;
  };

  assert.equal(body.profileVersion, "ielts-learning-profile-v1");
  assert.equal(body.evidencePolicy, "completed-diagnostic-sessions-only");
  assert.deepEqual(Object.keys(body.skills), [
    "reading",
    "listening",
    "writing",
    "speaking",
  ]);
  for (const skill of Object.values(body.skills)) {
    assert.equal(skill.status, "not-assessed");
    assert.equal(skill.evidenceCount, 0);
    assert.equal(skill.latestEvidence, null);
    assert.equal(skill.bestAccuracyPercent, null);
    assert.equal(skill.bandEstimate, null);
  }

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

test("IELTS profile derives reading evidence without inventing Band scores", async () => {
  learningSession.findMany = (async () => [
    {
      id: "latest-session",
      correctCount: 4,
      totalQuestions: 6,
      completedAt: new Date("2026-09-19T00:00:00.000Z"),
    },
    {
      id: "best-session",
      correctCount: 6,
      totalQuestions: 6,
      completedAt: new Date("2026-09-18T00:00:00.000Z"),
    },
  ]) as unknown as typeof learningSession.findMany;

  const request = { user: { userId: "user-1" } } as Request;
  const { response, recorder } = createResponseRecorder();
  await academyController.getIeltsLearningProfile(request, response, failOnNext);

  assert.equal(recorder.statusCode, 200);
  const body = recorder.body as {
    skills: {
      reading: {
        status: string;
        evidenceCount: number;
        latestEvidence: {
          sessionId: string;
          scoreType: string;
          correct: number;
          total: number;
          accuracyPercent: number;
          completedAt: string;
        };
        bestAccuracyPercent: number;
        bandEstimate: null;
      };
      listening: { status: string };
      writing: { status: string };
      speaking: { status: string };
    };
    notice: string;
  };

  assert.deepEqual(body.skills.reading, {
    status: "evidence-ready",
    evidenceCount: 2,
    latestEvidence: {
      sessionId: "latest-session",
      scoreType: "objective-accuracy",
      correct: 4,
      total: 6,
      accuracyPercent: 67,
      completedAt: "2026-09-19T00:00:00.000Z",
    },
    bestAccuracyPercent: 100,
    bandEstimate: null,
  });
  assert.equal(body.skills.listening.status, "not-assessed");
  assert.equal(body.skills.writing.status, "not-assessed");
  assert.equal(body.skills.speaking.status, "not-assessed");
  assert.match(body.notice, /not an official IELTS test or Band estimate/i);
  assert.doesNotMatch(JSON.stringify(body), /questions|answers|explanation/);
});

test("IELTS profile ignores invalid zero-question evidence", async () => {
  learningSession.findMany = (async () => [
    {
      id: "invalid-session",
      correctCount: 0,
      totalQuestions: 0,
      completedAt: new Date("2026-09-19T00:00:00.000Z"),
    },
  ]) as unknown as typeof learningSession.findMany;

  const request = { user: { userId: "user-1" } } as Request;
  const { response, recorder } = createResponseRecorder();
  await academyController.getIeltsLearningProfile(request, response, failOnNext);

  const body = recorder.body as {
    skills: { reading: { status: string; evidenceCount: number } };
  };
  assert.equal(body.skills.reading.status, "not-assessed");
  assert.equal(body.skills.reading.evidenceCount, 0);
});
