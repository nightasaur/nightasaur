// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Nightasaur Team

/**
 * 益智問答題庫系統
 * 依主題分類，答對攻擊敵方，答錯被反擊
 */

export interface QuizQuestion {
  id: string;
  category: "ELEMENT" | "SPIRIT" | "MATH" | "LOGIC" | "GENERAL" | "SPECIES";
  question: string;
  options: string[];
  answer: number;
  explanation: string;
  element?: string;
  hard?: boolean;
}

const ELEMENT_ICONS: Record<string, string> = {
  FIRE: "🔥", WATER: "💧", LIGHT: "✨", SHADOW: "🌑", STAR: "⭐",
  ILLUSION: "🦊", MOON: "🌙", NATURE: "🌿", THUNDER: "⚡", ICE: "❄️",
};

const ELEMENT_QUESTIONS: QuizQuestion[] = [
  { id: "el1", category: "ELEMENT", question: "🔥 火焰屬性剋制哪個屬性？", options: ["🌿 自然", "💧 水流", "🔥 火焰", "🌙 月光"], answer: 0, explanation: "火剋自然：火焰能燒燬森林！", element: "FIRE" },
  { id: "el2", category: "ELEMENT", question: "💧 水流屬性剋制哪個屬性？", options: ["🌙 月光", "⚡ 雷電", "🔥 火焰", "⭐ 星辰"], answer: 2, explanation: "水剋火：水能撲滅火焰！", element: "WATER" },
  { id: "el3", category: "ELEMENT", question: "✨ 光屬性剋制哪個屬性？", options: ["🌑 暗影", "⭐ 星辰", "🦊 幻象", "🌿 自然"], answer: 0, explanation: "光剋暗：光明驅散黑暗！", element: "LIGHT" },
  { id: "el4", category: "ELEMENT", question: "🌿 自然屬性會被哪個屬性剋制？", options: ["💧 水流", "🔥 火焰", "❄️ 冰霜", "🌙 月光"], answer: 1, explanation: "火燒森林，自然怕火！", element: "NATURE" },
  { id: "el5", category: "ELEMENT", question: "⚡ 雷電屬性的克制目標是？", options: ["🌿 自然", "💧 水流", "❄️ 冰霜", "🔥 火焰"], answer: 1, explanation: "雷電在水中傳導效果加倍！", element: "THUNDER" },
  { id: "el6", category: "ELEMENT", question: "❄️ 冰霜屬性剋制誰？", options: ["🌿 自然", "🔥 火焰", "⭐ 星辰", "🦊 幻象"], answer: 0, explanation: "冰凍煞損植物，冰剋自然！", element: "ICE" },
  { id: "el7", category: "ELEMENT", question: "🌑 暗影屬性會被誰剋制？", options: ["🦊 幻象", "✨ 光明", "🌙 月光", "⭐ 星辰"], answer: 1, explanation: "光明驅散暗影！", element: "SHADOW" },
  { id: "el8", category: "ELEMENT", question: "Nightasaur 共有幾種屬性？", options: ["6 種", "8 種", "10 種", "12 種"], answer: 2, explanation: "火、水、光、暗、星、幻、月、自然、雷、冰，共10種！" },
  { id: "el9", category: "ELEMENT", question: "🦊 幻象屬性的特點是？", options: ["力量強", "速度快", "防禦高", "回復強"], answer: 1, explanation: "幻象精靈以速度著稱！", element: "ILLUSION" },
  { id: "el10", category: "ELEMENT", question: "🌙 月光屬性的成長傾向是？", options: ["高攻擊", "高速度", "耐久型", "低魔力"], answer: 2, explanation: "月光精靈是耐久型！", element: "MOON" },
];

const SPIRIT_QUESTIONS: QuizQuestion[] = [
  { id: "sp1", category: "SPIRIT", question: "精靈從蛋到傳說體，共幾個階段？", options: ["4 個", "5 個", "6 個", "7 個"], answer: 2, explanation: "蛋→幼體→少年體→成年體→究極體→傳說體！" },
  { id: "sp2", category: "SPIRIT", question: "進化到少年體需要幾級？", options: ["Lv.3", "Lv.5", "Lv.10", "Lv.15"], answer: 1, explanation: "Lv.5 進化到少年體！" },
  { id: "sp3", category: "SPIRIT", question: "傳說體需要在幾級達成？", options: ["Lv.30", "Lv.45", "Lv.60", "Lv.80"], answer: 2, explanation: "進化到傳說體需要 Lv.60！" },
  { id: "sp4", category: "SPIRIT", question: "哪個屬性不是 Nightasaur 的屬性？", options: ["🌑 暗影", "🌿 自然", "🐉 天空", "❄️ 冰霜"], answer: 2, explanation: "天空（SKY）不在十大屬性！" },
  { id: "sp5", category: "SPIRIT", question: "孵化精靈的理想溫度是？", options: ["20-25°C", "25-35°C", "35-40°C", "40-45°C"], answer: 1, explanation: "25-35°C 效率1.5倍！" },
  { id: "sp6", category: "SPIRIT", question: "小隊最多容納幾隻精靈？", options: ["2 隻", "3 隻", "4 隻", "6 隻"], answer: 2, explanation: "一個小隊最多 4 隻！" },
  { id: "sp7", category: "SPIRIT", question: "哪種互動孵化效果最佳？", options: ["敲打", "搖動", "唱歌", "不理會"], answer: 2, explanation: "唱歌增加最多進度！" },
];
const MATH_QUESTIONS: QuizQuestion[] = [
  { id: "ma1", category: "MATH", question: "火焰傷害 45，屬性剋制 2 倍，總傷害是？", options: ["45", "70", "90", "135"], answer: 2, explanation: "45 × 2 = 90！屬性剋制讓傷害加倍！" },
  { id: "ma2", category: "MATH", question: "精靈等級10，升級需 100×等級，升到11級需要多少經驗？", options: ["800", "1000", "1100", "1200"], answer: 1, explanation: "100 × 10 = 1000 經驗值！" },
  { id: "ma3", category: "MATH", question: "水槍傷害 40，被自然抵抗（0.5倍），實際傷害？", options: ["10", "20", "30", "40"], answer: 1, explanation: "40 × 0.5 = 20！抵抗減半！" },
  { id: "ma4", category: "MATH", question: "小隊4隻精靈，Lv.12/15/10/9，平均等級？", options: ["10", "11", "11.5", "12"], answer: 2, explanation: "(12+15+10+9) ÷ 4 = 11.5！" },
  { id: "ma5", category: "MATH", question: "攻擊 +30%，原本100傷害，現在？", options: ["110", "120", "130", "150"], answer: 2, explanation: "100 × 1.3 = 130！" },
  { id: "ma6", category: "MATH", question: "獲得200經驗，累積800，升級需1000，升級後剩餘？", options: ["0", "50", "100", "200"], answer: 0, explanation: "800+200=1000，剛好升級！" },
];

const LOGIC_QUESTIONS: QuizQuestion[] = [
  { id: "lo1", category: "LOGIC", question: "🔥火剋🌿自然，🌿自然剋💧水，💧水剋🔥火。敵人是水屬性，用誰攻擊？", options: ["🔥 火焰", "🌿 自然", "⚡ 雷電", "❄️ 冰霜"], answer: 1, explanation: "自然剋水！" },
  { id: "lo2", category: "LOGIC", question: "A剋B，B剋C，那C應該？", options: ["也剋A", "被B剋", "剋B", "無法判斷"], answer: 2, explanation: "如果循環成立，C 剋 A！" },
  { id: "lo3", category: "LOGIC", question: "對方用🌿草屬性，手上有火/水/草/雷精靈，派出誰？", options: ["🔥 火焰", "💧 水流", "🌿 自然", "⚡ 雷電"], answer: 0, explanation: "火剋草！" },
  { id: "lo4", category: "LOGIC", question: "孵蛋溫度30°C濕度80%，缺什麼？", options: ["溫度太高", "濕度太高", "都正常", "無法判斷"], answer: 1, explanation: "理想濕度是40-60%！" },
  { id: "lo5", category: "LOGIC", question: "A速度>B，B速度>C，誰最慢？", options: ["A", "B", "C", "無法判斷"], answer: 2, explanation: "A>B>C，C 最慢！" },
];

const SPECIES_QUESTIONS: QuizQuestion[] = [
  { id: "se1", category: "SPECIES", question: "火屬性精靈常見外觀特徵？", options: ["藍色鰭", "紅色鱗片", "白色翅膀", "灰色毛皮"], answer: 1, explanation: "火焰精靈有紅色火屬性特徵！" },
  { id: "se2", category: "SPECIES", question: "水系精靈適合棲息在哪裡？", options: ["火山", "湖泊", "沙漠", "洞穴"], answer: 1, explanation: "水系精靈生活在湖泊河流！" },
  { id: "se3", category: "SPECIES", question: "哪種屬性精靈通常像狐狸？", options: ["🔥 火焰", "💧 水流", "🦊 幻象", "⚡ 雷電"], answer: 2, explanation: "幻象屬性以狐狸為原型！" },
  { id: "se4", category: "SPECIES", question: "冰霜精靈主要生活在？", options: ["沙漠", "雨林", "雪地", "火山口"], answer: 2, explanation: "冰霜精靈適合冰天雪地！" },
];

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  ...ELEMENT_QUESTIONS, ...SPIRIT_QUESTIONS, ...MATH_QUESTIONS, ...LOGIC_QUESTIONS, ...SPECIES_QUESTIONS,
];

export function getQuizQuestions(count: number, element?: string): QuizQuestion[] {
  let pool = QUIZ_QUESTIONS;
  if (element && Math.random() > 0.3) {
    const eq = QUIZ_QUESTIONS.filter(q => q.element === element);
    if (eq.length >= 2) pool = [...eq, ...QUIZ_QUESTIONS];
  }
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export function getElementIcon(element: string): string {
  return ELEMENT_ICONS[element] || "❓";
}

export function calcQuizDamage(question: QuizQuestion, playerElement: string, enemyElement: string, level: number): { damage: number; effective: number; critical: boolean } {
  const adv: Record<string, string[]> = {
    FIRE: ["NATURE", "ICE"], WATER: ["FIRE", "THUNDER"], LIGHT: ["SHADOW"],
    SHADOW: ["MOON", "ILLUSION"], STAR: ["ILLUSION"], ILLUSION: ["THUNDER", "MOON"],
    MOON: ["STAR"], NATURE: ["WATER", "LIGHT"], THUNDER: ["WATER"], ICE: ["NATURE"],
  };
  const effective = adv[playerElement]?.includes(enemyElement) ? 2 : 1;
  const critical = Math.random() < 0.15;
  const categoryMult = question.category === "MATH" || question.category === "LOGIC" ? 1.5 : 1;
  const base = 15 + level * 3;
  const damage = Math.floor(base * categoryMult * effective * (critical ? 1.5 : 1));
  return { damage, effective, critical };
}

export function calcEnemyDamage(enemyLevel: number, playerDef: number): number {
  const base = Math.max(1, Math.floor(((15 + enemyLevel * 2) / (playerDef || 10)) * 12));
  return base + Math.floor(Math.random() * 5);
}