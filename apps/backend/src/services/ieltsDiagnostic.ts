import { IELTS_ARTICLES } from "./ieltsReading.js";
import type { IeltsReadingQuestion } from "./ieltsReading.js";

export const IELTS_READING_DIAGNOSTIC_ID = "ielts-reading-diagnostic-v1";
export const IELTS_READING_DIAGNOSTIC_VERSION = "reading-baseline-v1";

export type IeltsDiagnosticQuestionType = IeltsReadingQuestion["questionType"];

export interface StoredIeltsDiagnosticQuestion {
  id: string;
  passageId: string;
  passageTitle: string;
  passageContent: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
  questionType: IeltsDiagnosticQuestionType;
}

export interface PublicIeltsDiagnosticPassage {
  id: string;
  title: string;
  content: string;
}

export interface PublicIeltsDiagnosticQuestion {
  id: string;
  passageId: string;
  prompt: string;
  options: string[];
  questionType: IeltsDiagnosticQuestionType;
}

export interface PublicIeltsReadingDiagnostic {
  id: typeof IELTS_READING_DIAGNOSTIC_ID;
  version: typeof IELTS_READING_DIAGNOSTIC_VERSION;
  skill: "reading";
  source: "original-ielts-style";
  title: string;
  instructions: string;
  scorePolicy: {
    type: "objective-accuracy";
    bandEstimate: null;
    notice: string;
  };
  passages: PublicIeltsDiagnosticPassage[];
  questions: PublicIeltsDiagnosticQuestion[];
}

const DIAGNOSTIC_BLUEPRINT = [
  { articleId: "env-1", questionIndexes: [0, 1, 3] },
  { articleId: "ai-health-1", questionIndexes: [0, 1, 2] },
] as const;

export function buildIeltsReadingDiagnostic(): StoredIeltsDiagnosticQuestion[] {
  return DIAGNOSTIC_BLUEPRINT.flatMap(({ articleId, questionIndexes }) => {
    const article = IELTS_ARTICLES.find((candidate) => candidate.id === articleId);
    if (!article) {
      throw new Error(`IELTS diagnostic article is missing: ${articleId}`);
    }

    return questionIndexes.map((questionIndex) => {
      const question = article.questions[questionIndex];
      if (!question) {
        throw new Error(`IELTS diagnostic question is missing: ${articleId}:${questionIndex}`);
      }

      return {
        id: `${article.id}:${questionIndex}`,
        passageId: article.id,
        passageTitle: article.title,
        passageContent: article.content,
        prompt: question.question,
        options: [...question.options],
        answer: question.answer,
        explanation: question.explanation,
        questionType: question.questionType,
      };
    });
  });
}

export function toPublicIeltsReadingDiagnostic(
  storedQuestions: StoredIeltsDiagnosticQuestion[],
): PublicIeltsReadingDiagnostic {
  const passages = new Map<string, PublicIeltsDiagnosticPassage>();

  for (const question of storedQuestions) {
    passages.set(question.passageId, {
      id: question.passageId,
      title: question.passageTitle,
      content: question.passageContent,
    });
  }

  return {
    id: IELTS_READING_DIAGNOSTIC_ID,
    version: IELTS_READING_DIAGNOSTIC_VERSION,
    skill: "reading",
    source: "original-ielts-style",
    title: "IELTS-style Reading Diagnostic",
    instructions: "Read both original passages and answer every question. Submit answers in order.",
    scorePolicy: {
      type: "objective-accuracy",
      bandEstimate: null,
      notice: "This baseline reports objective accuracy only. It is not an official IELTS test or Band estimate.",
    },
    passages: [...passages.values()],
    questions: storedQuestions.map((question) => ({
      id: question.id,
      passageId: question.passageId,
      prompt: question.prompt,
      options: [...question.options],
      questionType: question.questionType,
    })),
  };
}

export function isStoredIeltsDiagnosticQuestion(
  value: unknown,
): value is StoredIeltsDiagnosticQuestion {
  if (!value || typeof value !== "object") return false;
  const question = value as Partial<StoredIeltsDiagnosticQuestion>;

  return (
    typeof question.id === "string" &&
    typeof question.passageId === "string" &&
    typeof question.passageTitle === "string" &&
    typeof question.passageContent === "string" &&
    typeof question.prompt === "string" &&
    Array.isArray(question.options) &&
    question.options.length >= 2 &&
    question.options.every((option) => typeof option === "string") &&
    Number.isInteger(question.answer) &&
    (question.answer as number) >= 0 &&
    (question.answer as number) < question.options.length &&
    typeof question.explanation === "string" &&
    ["main-idea", "detail", "vocabulary", "inference"].includes(question.questionType ?? "")
  );
}
