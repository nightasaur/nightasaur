import { z } from "zod";

// 命名系統配置
export const NAMING_SYSTEM_CONFIG = {
  // 語言偏好
  LANGUAGES: ["zh-TW", "zh-CN", "en-US", "ja-JP", "ko-KR"] as const,
  
  // 命名風格
  STYLES: [
    "CLASSIC",      // 經典：小烈焰、潮汐兒
    "MYTHICAL",     // 神話：麒麟、鳳凰
    "NATURE",       // 自然：翠葉、星塵
    "MODERN",       // 現代：電光、數據
    "CUTE",         // 可愛：布丁、棉花糖
    "MYSTERIOUS",   // 神秘：暗影、幽靈
    "SCIENTIFIC",   // 科學：量子、弦論
    "CULTURAL"      // 文化：武士、忍者
  ] as const,
  
  // 元素對應的命名詞庫
  ELEMENT_NAMING_THEMES: {
    FIRE: ["炎", "焰", "燚", "灼", "熔", "烈", "燼", "烽"],
    WATER: ["潮", "汐", "浪", "波", "瀾", "濤", "漣", "滄"],
    LIGHT: ["光", "輝", "曜", "曦", "晝", "明", "燦", "炫"],
    SHADOW: ["影", "暗", "冥", "幽", "魅", "魑", "魍", "魎"],
    STAR: ["星", "辰", "宿", "曜", "宇", "宙", "銀", "河"],
    ILLUSION: ["幻", "夢", "虛", "妄", "鏡", "蜃", "魅", "惑"],
    MOON: ["月", "朔", "望", "弦", "魄", "蟾", "桂", "娥"],
    NATURE: ["葉", "林", "森", "草", "花", "果", "藤", "根"],
    THUNDER: ["雷", "霆", "電", "霹", "靂", "閃", "震", "轟"],
    ICE: ["冰", "雪", "霜", "凜", "寒", "凍", "凝", "冽"]
  },
  
  // 命名規則
  RULES: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 20,
    ALLOWED_CHARACTERS: /^[\u4e00-\u9fa5a-zA-Z0-9\s\-·]+$/,
    BANNED_WORDS: ["admin", "root", "system", "null", "undefined", "test"]
  }
} as const;

// 命名請求模式
export const namingRequestSchema = z.object({
  element: z.enum(["FIRE", "WATER", "LIGHT", "SHADOW", "STAR", "ILLUSION", "MOON", "NATURE", "THUNDER", "ICE"]),
  style: z.enum(NAMING_SYSTEM_CONFIG.STYLES).optional(),
  language: z.enum(NAMING_SYSTEM_CONFIG.LANGUAGES).optional(),
  gender: z.enum(["MALE", "FEMALE", "NEUTRAL"]).optional(),
  length: z.number().min(2).max(20).optional()
});

// 命名建議模式
export const namingSuggestionSchema = z.object({
  element: z.enum(["FIRE", "WATER", "LIGHT", "SHADOW", "STAR", "ILLUSION", "MOON", "NATURE", "THUNDER", "ICE"]),
  count: z.number().min(1).max(10).optional().default(5)
});

// 命名驗證模式
export const namingValidationSchema = z.object({
  name: z.string()
    .min(NAMING_SYSTEM_CONFIG.RULES.MIN_LENGTH)
    .max(NAMING_SYSTEM_CONFIG.RULES.MAX_LENGTH)
    .regex(NAMING_SYSTEM_CONFIG.RULES.ALLOWED_CHARACTERS, "名稱包含無效字符")
    .refine((name) => !NAMING_SYSTEM_CONFIG.RULES.BANNED_WORDS.some(word => 
      name.toLowerCase().includes(word.toLowerCase())
    ), "名稱包含禁止詞彙"),
  userId: z.string().optional()
});

export type NamingRequest = z.infer<typeof namingRequestSchema>;
export type NamingSuggestion = z.infer<typeof namingSuggestionSchema>;
export type NamingValidation = z.infer<typeof namingValidationSchema>;