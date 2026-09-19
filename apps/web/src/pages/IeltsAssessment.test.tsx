import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ieltsAssessmentAPI } from "../api/client";
import IeltsAssessment from "./IeltsAssessment";

vi.mock("../api/client", () => ({
  ieltsAssessmentAPI: {
    startDiagnostic: vi.fn(),
    submitAnswer: vi.fn(),
  },
}));

const startDiagnosticMock = vi.mocked(ieltsAssessmentAPI.startDiagnostic);
const submitAnswerMock = vi.mocked(ieltsAssessmentAPI.submitAnswer);

const startResponse = {
  sessionId: "session-reading-1",
  status: "in-progress" as const,
  currentQuestion: 0,
  diagnostic: {
    id: "ielts-reading-diagnostic-v1",
    version: "reading-baseline-v1",
    skill: "reading" as const,
    source: "original-ielts-style" as const,
    title: "IELTS-style Reading Diagnostic",
    instructions: "Read and answer.",
    scorePolicy: {
      type: "objective-accuracy" as const,
      bandEstimate: null,
      notice: "Objective accuracy only.",
    },
    passages: [
      {
        id: "passage-1",
        title: "A Test Passage",
        content: "This passage supplies the evidence needed for both questions.",
      },
    ],
    questions: [
      {
        id: "passage-1:0",
        passageId: "passage-1",
        prompt: "What percentage was reported?",
        options: ["10%", "20%", "30%", "40%"],
        questionType: "detail" as const,
      },
      {
        id: "passage-1:1",
        passageId: "passage-1",
        prompt: "What is the main idea?",
        options: ["Option A", "Option B", "Option C", "Option D"],
        questionType: "main-idea" as const,
      },
    ],
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  startDiagnosticMock.mockResolvedValue({ data: startResponse } as never);
});

afterEach(() => {
  cleanup();
});

describe("IELTS Reading Diagnostic", () => {
  it("requires the learning goal before creating a server-side session", async () => {
    render(<MemoryRouter><IeltsAssessment /></MemoryRouter>);

    const startButton = screen.getByRole("button", { name: "建立設定並開始 Reading Diagnostic" });
    expect(startButton).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "7.0" }));
    fireEvent.click(screen.getByRole("button", { name: "45 分鐘" }));
    expect(startButton).toBeEnabled();

    fireEvent.click(startButton);
    expect(await screen.findByText("A Test Passage")).toBeInTheDocument();
    expect(startDiagnosticMock).toHaveBeenCalledTimes(1);
  });

  it("records real answers and shows objective accuracy without a Band estimate", async () => {
    submitAnswerMock
      .mockResolvedValueOnce({
        data: {
          feedback: {
            questionId: "passage-1:0",
            answerIndex: 2,
            correct: true,
            correctAnswerIndex: 2,
            explanation: "The passage reports 30%.",
          },
          progress: { answered: 1, total: 2, completed: false },
          result: null,
        },
      } as never)
      .mockResolvedValueOnce({
        data: {
          feedback: {
            questionId: "passage-1:1",
            answerIndex: 1,
            correct: true,
            correctAnswerIndex: 1,
            explanation: "Option B summarizes the passage.",
          },
          progress: { answered: 2, total: 2, completed: true },
          result: {
            skill: "reading",
            scoreType: "objective-accuracy",
            correct: 2,
            total: 2,
            accuracyPercent: 100,
            bandEstimate: null,
            notice: "Not an official IELTS test or Band estimate.",
          },
        },
      } as never);

    render(<MemoryRouter><IeltsAssessment /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "7.0" }));
    fireEvent.click(screen.getByRole("button", { name: "45 分鐘" }));
    fireEvent.click(screen.getByRole("button", { name: "建立設定並開始 Reading Diagnostic" }));

    await screen.findByText("What percentage was reported?");
    fireEvent.click(screen.getByRole("radio", { name: /30%/ }));
    fireEvent.click(screen.getByRole("button", { name: "提交這一題" }));

    expect(await screen.findByText("答對了")).toBeInTheDocument();
    expect(screen.getByText("The passage reports 30%.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "下一題" }));

    expect(await screen.findByText("What is the main idea?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: /Option B/ }));
    fireEvent.click(screen.getByRole("button", { name: "提交這一題" }));

    await waitFor(() => expect(screen.getAllByText("2 / 2").length).toBeGreaterThan(0));
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByText("不產生")).toBeInTheDocument();
    expect(screen.getByText("Not an official IELTS test or Band estimate.")).toBeInTheDocument();
    expect(submitAnswerMock).toHaveBeenNthCalledWith(1, "session-reading-1", "passage-1:0", 2);
    expect(submitAnswerMock).toHaveBeenNthCalledWith(2, "session-reading-1", "passage-1:1", 1);
  });
});
