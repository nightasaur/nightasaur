import { z } from "zod";

// 精靈外觀系統配置
export const APPEARANCE_SYSTEM_CONFIG = {
  // 動物園動物分類
  ZOO_ANIMAL_CATEGORIES: [
    "MAMMALS",      // 哺乳類
    "BIRDS",        // 鳥類
    "REPTILES",     // 爬蟲類
    "AMPHIBIANS",   // 兩棲類
    "FISH",         // 魚類
    "INSECTS",      // 昆蟲類
    "MYTHICAL"      // 神話生物
  ] as const,
  
  // 身體部位
  BODY_PARTS: [
    "HEAD",         // 頭部
    "BODY",         // 身體
    "LEGS",         // 腿部
    "WINGS",        // 翅膀
    "TAIL",         // 尾巴
    "HORNS",        // 角
    "EARS",         // 耳朵
    "EYES",         // 眼睛
    "MOUTH",        // 嘴巴
    "PATTERN"       // 花紋
  ] as const,
  
  // 顏色系統
  COLORS: {
    PRIMARY: [
      "RED", "ORANGE", "YELLOW", "GREEN", "BLUE", "PURPLE", "PINK", "BROWN", "BLACK", "WHITE"
    ],
    SECONDARY: [
      "CRIMSON", "AMBER", "GOLD", "EMERALD", "AQUA", "VIOLET", "ROSE", "CHOCOLATE", "GRAPHITE", "SILVER"
    ],
    ACCENT: [
      "NEON_RED", "SUNSET_ORANGE", "LEMON_YELLOW", "LIME_GREEN", "SKY_BLUE", 
      "LAVENDER", "HOT_PINK", "SANDY_BROWN", "CHARCOAL", "PEARL_WHITE"
    ]
  },
  
  // 紋理類型
  TEXTURES: [
    "SMOOTH",       // 光滑
    "SCALY",        // 鱗片
    "FURRY",        // 毛茸茸
    "FEATHERY",     // 羽毛
    "SLIMY",        // 黏滑
    "CRYSTALLINE",  // 水晶
    "METALLIC",     // 金屬
    "GLOWING",      // 發光
    "TRANSLUCENT",  // 半透明
    "SHIMMERING"    // 閃爍
  ] as const,
  
  // 尺寸範圍
  SIZES: {
    HEIGHT: { min: 0.1, max: 3.0 },    // 公尺
    WEIGHT: { min: 0.1, max: 100.0 }   // 公斤
  },
  
  // 基因系統
  GENES: {
    DOMINANT_TRAITS: ["FIRE", "LIGHT", "THUNDER", "RED", "BLACK", "SCALY"],
    RECESSIVE_TRAITS: ["WATER", "SHADOW", "ICE", "BLUE", "WHITE", "FURRY"],
    MUTATION_RATE: 0.05,  // 5% 突變機率
    INHERITANCE_RATE: 0.7 // 70% 遺傳父母特徵
  }
} as const;