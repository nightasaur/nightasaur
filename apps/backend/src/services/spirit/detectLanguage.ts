export type DetectedLanguage = "zh-TW" | "zh-CN" | "en" | "ja" | "ko" | "es" | "unknown";

// 僅收錄繁簡不同的字元，避免誤判
const TRADITIONAL_CHARS = new Set(
  ("嗎麼這來時對個們學習國語愛會說點樣東樂買賣請謝開關發現覺應該實際裡與為傳後門問題馬萬長區" +
   "臺灣體說話東西動頭點兒時問無為經過產進運還開關機電腦網絡數據庫裡從帶說話話") .split("")
);

const SIMPLIFIED_CHARS = new Set(
  ("吗么这来时对个们学习国语爱会说点样东乐买卖请谢开关发现觉应该实际里与为传后门问题马万长区" +
   "台湾体说话东西动头点儿时问无為经过产进运还开关机电脑网络数据库里从带说话话").split("")
);

const KANA = /[\u3040-\u309F\u30A0-\u30FF]/;
const HANGUL = /[\uAC00-\uD7AF\u1100-\u11FF]/;
const LATIN = /[A-Za-z]/;

export function detectLanguage(
  text: string,
  fallback: DetectedLanguage = "zh-TW"
): DetectedLanguage {
  if (!text || text.trim().length === 0) return fallback;

  let tradScore = 0;
  let simpScore = 0;
  for (const ch of text) {
    if (TRADITIONAL_CHARS.has(ch)) tradScore++;
    if (SIMPLIFIED_CHARS.has(ch)) simpScore++;
  }

  if (tradScore > 0 || simpScore > 0) {
    return tradScore >= simpScore ? "zh-TW" : "zh-CN";
  }

  if (KANA.test(text)) return "ja";
  if (HANGUL.test(text)) return "ko";
  if (LATIN.test(text)) return "en";

  return fallback;
}