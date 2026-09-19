import { IELTS_ARTICLES } from "./ieltsReading.js";
import type { IeltsReadingQuestion } from "./ieltsReading.js";

export const IELTS_READING_PRACTICE_PREFIX = "ielts-reading-practice-v1";
export const IELTS_READING_PRACTICE_VERSION = "reading-practice-v1";

export type IeltsReadingFocusLevel =
  | "foundation"
  | "consolidation"
  | "maintenance";

export type IeltsPracticeQuestionType = IeltsReadingQuestion["questionType"];

export interface StoredIeltsPracticeQuestion {
  id: string;
  passageId: string;
  passageTitle: string;
  passageContent: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
  questionType: IeltsPracticeQuestionType;
}

interface PublicIeltsPracticePassage {
  id: string;
  title: string;
  content: string;
}

interface PublicIeltsPracticeQuestion {
  id: string;
  passageId: string;
  prompt: string;
  options: string[];
  questionType: IeltsPracticeQuestionType;
}

const PRACTICE_ARTICLE_BY_FOCUS: Record<IeltsReadingFocusLevel, string> = {
  foundation: "edu-1",
  consolidation: "society-1",
  maintenance: "eco-1",
};

const VALID_FOCUS_LEVELS = new Set<IeltsReadingFocusLevel>([
  "foundation",
  "consolidation",
  "maintenance",
]);

export function getIeltsReadingPracticeCourseId(
  focusLevel: IeltsReadingFocusLevel,
): string {
  return `${IELTS_READING_PRACTICE_PREFIX}:${focusLevel}`;
}

export function parseIeltsReadingPracticeCourseId(
  courseId: string,
): IeltsReadingFocusLevel | null {
  const prefix = `${IELTS_READING_PRACTICE_PREFIX}:`;
  if (!courseId.startsWith(prefix)) return null;

  const focusLevel = courseId.slice(prefix.length);
  return VALID_FOCUS_LEVELS.has(focusLevel as IeltsReadingFocusLevel)
    ? (focusLevel as IeltsReadingFocusLevel)
    : null;
}

export function buildIeltsReadingPractice(
  focusLevel: IeltsReadingFocusLevel,
): StoredIeltsPracticeQuestion[] {
  const articleId = PRACTICE_ARTICLE_BY_FOCUS[focusLevel];
  const article = IELTS_ARTICLES.find((candidate) => candidate.id === articleId);
  if (!article) {
    throw new Error(`IELTS practice article is missing: ${articleId}`);
  }

  return article.questions.map((question, questionIndex) => ({
    id: `${IELTS_READING_PRACTICE_VERSION}:${focusLevel}:${article.id}:${questionIndex}`,
    passageId: article.id,
    passageTitle: article.title,
    passageContent: article.content,
    prompt: question.question,
    options: [...question.options],
    answer: question.answer,
    explanation: question.explanation,
    questionType: question.questionType,
  }));
}

export function toPublicIeltsReadingPractice(
  focusLevel: IeltsReadingFocusLevel,
  storedQuestions: StoredIeltsPracticeQuestion[],
) {
  const passages = new Map<string, PublicIeltsPracticePassage>();

  for (const question of storedQuestions) {
    passages.set(question.passageId, {
      id: question.passageId,
      title: question.passageTitle,
      content: question.passageContent,
    });
  }

  return {
    id: getIeltsReadingPracticeCourseId(focusLevel),
    version: IELTS_READING_PRACTICE_VERSION,
    skill: "reading" as const,
    source: "original-ielts-style" as const,
    focusLevel,
    title: "IELTS-style Reading Practice",
    instructions:
      "Read the original passage and answer every question in order. Objective feedback appears after each answer.",
    scorePolicy: {
      type: "practice-accuracy" as const,
      profileEvidence: false,
      bandEstimate: null,
      notice:
        "Practice accuracy is formative feedback only. It does not replace diagnostic evidence or estimate an official IELTS Band.",
    },
    passages: [...passages.values()],
    questions: storedQuestions.map(
      (question): PublicIeltsPracticeQuestion => ({
        id: question.id,
        passageId: question.passageId,
        prompt: question.prompt,
        options: [...question.options],
        questionType: question.questionType,
      }),
    ),
  };
}

export function isStoredIeltsPracticeQuestion(
  value: unknown,
): value is StoredIeltsPracticeQuestion {
  if (!value || typeof value !== "object") return false;
  const question = value as Partial<StoredIeltsPracticeQuestion>;

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
    ["main-idea", "detail", "vocabulary", "inference"].includes(
      question.questionType ?? "",
    )
  );
}
