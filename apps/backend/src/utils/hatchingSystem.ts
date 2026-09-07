import { z } from "zod";

// 孵化系統配置
export const HATCHING_SYSTEM_CONFIG = {
  // 孵化階段
  STAGES: [
    "EGG",          // 蛋階段
    "HATCHING",     // 孵化中
    "HATCHLING"     // 幼體
  ] as const,
  
  // 孵化條件
  CONDITIONS: {
    MIN_TEMPERATURE: 20,    // 最低溫度 (°C)
    MAX_TEMPERATURE: 40,    // 最高溫度 (°C)
    MIN_HUMIDITY: 30,       // 最低濕度 (%)
    MAX_HUMIDITY: 80,       // 最高濕度 (%)
    HATCHING_TIME: 24,      // 孵化時間 (小時)
    INTERACTION_COUNT: 5,   // 需要互動次數
  },
  
  // 孵化事件
  EVENTS: [
    "TEMPERATURE_CHANGE",   // 溫度變化
    "HUMIDITY_CHANGE",      // 濕度變化
    "INTERACTION",          // 玩家互動
    "TIME_PASSED",          // 時間流逝
    "SPECIAL_EVENT"         // 特殊事件
  ] as const,
  
  // 孵化獎勵
  REWARDS: {
    BASE_XP: 100,
    BASE_COINS: 50,
    RARE_ITEM_CHANCE: 0.1,  // 10% 機率獲得稀有物品
  }
} as const;

// 孵化請求模式
export const hatchingRequestSchema = z.object({
  spiritId: z.string(),
  temperature: z.number().min(HATCHING_SYSTEM_CONFIG.CONDITIONS.MIN_TEMPERATURE)
                         .max(HATCHING_SYSTEM_CONFIG.CONDITIONS.MAX_TEMPERATURE),
  humidity: z.number().min(HATCHING_SYSTEM_CONFIG.CONDITIONS.MIN_HUMIDITY)
                      .max(HATCHING_SYSTEM_CONFIG.CONDITIONS.MAX_HUMIDITY),
  incubationTime: z.number().min(1).max(168).optional(), // 1-168小時
});

// 孵化互動模式
export const hatchingInteractionSchema = z.object({
  spiritId: z.string(),
  interactionType: z.enum(["TAP", "SHAKE", "WHISPER", "SING", "STORY"]),
  intensity: z.number().min(1).max(10).optional(),
});

// 孵化狀態模式
export const hatchingStatusSchema = z.object({
  spiritId: z.string(),
  includeEvents: z.boolean().optional(),
});

export type HatchingRequest = z.infer<typeof hatchingRequestSchema>;
export type HatchingInteraction = z.infer<typeof hatchingInteractionSchema>;
export type HatchingStatus = z.infer<typeof hatchingStatusSchema>;

// 孵化事件類型
export interface HatchingEvent {
  id: string;
  spiritId: string;
  eventType: typeof HATCHING_SYSTEM_CONFIG.EVENTS[number];
  data: any;
  timestamp: Date;
  significance: number; // 1-10，事件重要性
}

// 孵化狀態
export interface HatchingState {
  spiritId: string;
  stage: typeof HATCHING_SYSTEM_CONFIG.STAGES[number];
  progress: number; // 0-100
  temperature: number;
  humidity: number;
  interactionCount: number;
  startTime: Date;
  estimatedHatchTime: Date;
  events: HatchingEvent[];
  conditionsMet: {
    temperature: boolean;
    humidity: boolean;
    interactions: boolean;
    time: boolean;
  };
}