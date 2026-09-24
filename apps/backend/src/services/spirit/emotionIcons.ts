export type Emotion = "happy" | "sad" | "angry" | "anxious" | "excited" | "neutral";

export const VALID_EMOTIONS: Emotion[] = ["happy", "sad", "angry", "anxious", "excited", "neutral"];

const ICONS: Record<Emotion, string> = {
  happy: "😊",
  sad: "😢",
  angry: "😠",
  anxious: "😰",
  excited: "🤩",
  neutral: "😐",
};

export function getEmotionIcon(emotion: string): string {
  if ((VALID_EMOTIONS as string[]).includes(emotion)) {
    return ICONS[emotion as Emotion];
  }
  return ICONS.neutral;
}

export function normalizeEmotion(raw: unknown): Emotion {
  if (typeof raw === "string") {
    const lower = raw.toLowerCase().trim();
    if ((VALID_EMOTIONS as string[]).includes(lower)) {
      return lower as Emotion;
    }
  }
  return "neutral";
}

export function clampIntensity(raw: unknown): number {
  if (typeof raw !== "number" || !Number.isFinite(raw)) return 0;
  return Math.max(0, Math.min(10, Math.round(raw)));
}