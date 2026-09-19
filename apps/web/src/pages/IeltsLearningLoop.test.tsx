import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ieltsAssessmentAPI } from "../api/client";
import IeltsLearningLoop from "./IeltsLearningLoop";

vi.mock("../api/client", () => ({
  ieltsAssessmentAPI: {
    getProfile: vi.fn(),
    getDailyPlan: vi.fn(),
    startPractice: vi.fn(),
    submitPracticeAnswer: vi.fn(),
  },
}));

const getProfileMock = vi.mocked(ieltsAssessmentAPI.getProfile);
const getDailyPlanMock = vi.mocked(ieltsAssessmentAPI.getDailyPlan);
const startPracticeMock = vi.mocked(ieltsAssessmentAPI.startPractice);
const submitPracticeAnswerMock = vi.mocked(
  ieltsAssessmentAPI.submitPracticeAnswer,
);

const profileResponse = {
  profileVersion: "ielts-learning-profile-v1",
  evidencePolicy: "completed-diagnostic-sessions-only",
  skills: {
    reading: {
      status: "evidence-ready" as const,
      evidenceCount: 1,
      latestEvidence: {
        sessionId: "diagnostic-1",
        scoreType: "objective-accuracy" as const,
        correct: 4,
        total: 6,
        accuracyPercent: 67,
        completedAt: "2026-09-19T00:00:00.000Z",
      },
      bestAccuracyPercent: 67,
      bandEstimate: null,
    },
    listening: {
      status: "not-assessed" as const,
      evidenceCount: 0,
      latestEvidence: null,
      bestAccuracyPercent: null,
      bandEstimate: null,
    },
    writing: {
      status: "not-assessed" as const,
      evidenceCount: 0,
      latestEvidence: null,
      bestAccuracyPercent: null,
      bandEstimate: null,
    },
    speaking: {
      status: "not-assessed" as const,
      evidenceCount: 0,
      latestEvidence: null,
      bestAccuracyPercent: null,
      bandEstimate: null,
    },
  },
  notice: "Objective diagnostic evidence only.",
};

const planResponse = {
  planVersion: "ielts-daily-plan-v1",
  status: "ready" as const,
  evidencePolicy: "latest-completed-diagnostic-only",
  scope: ["reading" as const],
  generatedFrom: profileResponse.skills.reading.latestEvidence,
  focusLevel: "foundation" as const,
  totalMinutes: 25,
  tasks: [
    {
      id: "reading-evidence-review",
      type: "review" as const,
      skill: "reading" as const,
      minutes: 10,
      targetQuestionCount: 6,
      sourceSessionId: "diagnostic-1",
    },
    {
      id: "reading-targeted-practice",
      type: "practice" as const,
      skill: "reading" as const,
      minutes: 15,
      focus: "foundation" as const,
    },
  ],
  bandEstimate: null,
  notice: "Objective plan only.",
};

beforeEach(() => {
  vi.clearAllMocks();
  getProfileMock.mockResolvedValue({ data: profileResponse } as never);
  getDailyPlanMock.mockResolvedValue({ data: planResponse } as never);
});

afterEach(() => {
  cleanup();
});

describe("IELTS Learning Loop UI", () => {
  it("renders server evidence and the bounded daily plan", async () => {
    render(<IeltsLearningLoop refreshKey="initial" />);

    expect(await screen.findByText("Reading Learning Profile")).toBeInTheDocument();
    expect(screen.getByText("4 / 6 · 67%")).toBeInTheDocument();
    expect(screen.getByText("foundation")).toBeInTheDocument();
    expect(screen.getByText("25 分鐘")).toBeInTheDocument();
    expect(screen.getByText("10 分鐘 · review")).toBeInTheDocument();
    expect(screen.getByText("15 分鐘 · practice")).toBeInTheDocument();
    expect(screen.getByText("Band Estimate：不產生")).toBeInTheDocument();
    expect(getProfileMock).toHaveBeenCalledTimes(1);
    expect(getDailyPlanMock).toHaveBeenCalledTimes(1);
  });

  it("runs practice and shows server-scored feedback", async () => {
    startPracticeMock.mockResolvedValue({
      data: {
        sessionId: "practice-1",
        status: "in-progress",
        currentQuestion: 0,
        generatedFrom: profileResponse.skills.reading.latestEvidence,
        practice: {
          id: "ielts-reading-practice-v1:foundation",
          version: "reading-practice-v1",
          skill: "reading",
          source: "original-ielts-style",
          focusLevel: "foundation",
          title: "IELTS-style Reading Practice",
          instructions: "Read and answer in order.",
          scorePolicy: {
            type: "practice-accuracy",
            profileEvidence: false,
            bandEstimate: null,
            notice: "Practice only.",
          },
          passages: [
            {
              id: "practice-passage",
              title: "Practice Passage",
              content: "A short original passage for objective practice.",
            },
          ],
          questions: [
            {
              id: "practice-question-1",
              passageId: "practice-passage",
              prompt: "What is the answer?",
              options: ["First", "Second", "Third"],
              questionType: "detail",
            },
          ],
        },
      },
    } as never);
    submitPracticeAnswerMock.mockResolvedValue({
      data: {
        feedback: {
          questionId: "practice-question-1",
          answerIndex: 1,
          correct: true,
          correctAnswerIndex: 1,
          explanation: "Second is supported by the passage.",
        },
        progress: { answered: 1, total: 1, completed: true },
        result: {
          skill: "reading",
          scoreType: "practice-accuracy",
          focusLevel: "foundation",
          correct: 1,
          total: 1,
          accuracyPercent: 100,
          profileEvidence: false,
          bandEstimate: null,
          notice: "Practice feedback only.",
        },
      },
    } as never);

    render(<IeltsLearningLoop refreshKey="initial" />);
    fireEvent.click(
      await screen.findByRole("button", { name: "開始今日 Reading Practice" }),
    );

    expect(await screen.findByText("Practice Passage")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: /Second/ }));
    fireEvent.click(screen.getByRole("button", { name: "提交練習答案" }));

    expect(await screen.findByText("練習答對了")).toBeInTheDocument();
    expect(
      screen.getByText("Second is supported by the passage."),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText("Practice Score：1 / 1 · 100%")).toBeInTheDocument(),
    );
    expect(screen.getByText("不列入 Diagnostic Profile")).toBeInTheDocument();
    expect(submitPracticeAnswerMock).toHaveBeenCalledWith(
      "practice-1",
      "practice-question-1",
      1,
    );
  });
});
