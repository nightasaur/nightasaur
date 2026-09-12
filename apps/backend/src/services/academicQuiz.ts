// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Nightasaur Team

export type AcademicCategory = "LITERATURE" | "PHYSICS" | "CHEMISTRY" | "MEDICINE" | "MATHEMATICS";
export type Lang = "zh-TW";

export interface AcademicQuestion {
  id: string;
  category: AcademicCategory;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
  level: number;
}

// 題庫
const QUESTIONS = {
  LITERATURE: [
    { question: "《紅樓夢》的作者是誰？", options: ["曹雪芹", "施耐庵", "羅貫中", "吳承恩"], answer: 0, explanation: "《紅樓夢》的作者是清代作家曹雪芹。", level: 1 },
    { question: "莎士比亞的四大悲劇不包括哪一部？", options: ["哈姆雷特", "奧賽羅", "李爾王", "羅密歐與朱麗葉"], answer: 3, explanation: "莎士比亞的四大悲劇是《哈姆雷特》、《奧賽羅》、《李爾王》、《馬克白》。", level: 2 },
  ],
  PHYSICS: [
    { question: "牛頓第一定律又稱為什麼定律？", options: ["慣性定律", "作用力反作用力定律", "萬有引力定律", "動量守恆定律"], answer: 0, explanation: "牛頓第一定律也稱為慣性定律。", level: 1 },
    { question: "光的傳播速度在真空中約為多少？", options: ["3×10^8 m/s", "3×10^5 m/s", "3×10^3 m/s", "3×10^10 m/s"], answer: 0, explanation: "光在真空中的傳播速度約為每秒3×10^8米。", level: 1 },
  ],
  CHEMISTRY: [
    { question: "水的化學式是什麼？", options: ["H2O", "CO2", "NaCl", "O2"], answer: 0, explanation: "水的化學式是H₂O。", level: 1 },
    { question: "元素週期表的第一個元素是什麼？", options: ["氫", "氦", "鋰", "氧"], answer: 0, explanation: "元素週期表的第一個元素是氫（H）。", level: 1 },
  ],
  MEDICINE: [
    { question: "人體有多少塊骨骼？", options: ["206塊", "300塊", "150塊", "250塊"], answer: 0, explanation: "成人人體共有206塊骨骼。", level: 1 },
    { question: "以下哪個是人體最大的器官？", options: ["皮膚", "肝臟", "肺", "心臟"], answer: 0, explanation: "皮膚是人體最大的器官。", level: 1 },
  ],
  MATHEMATICS: [
    { question: "圓周率π的近似值是多少？", options: ["3.1416", "2.7183", "1.4142", "1.7321"], answer: 0, explanation: "圓周率π約等於3.1416。", level: 1 },
    { question: "直角三角形的斜邊平方等於什麼？", options: ["兩直角邊平方和", "兩直角邊平方差", "兩直角邊積", "兩直角邊和"], answer: 0, explanation: "畢達哥拉斯定理：直角三角形的斜邊平方等於兩直角邊平方和。", level: 1 },
  ],
};

function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function generateAcademicQuestions(
  count: number,
  level: number,
  lang: Lang = "zh-TW",
  categories?: AcademicCategory[]
): AcademicQuestion[] {
  const allCategories: AcademicCategory[] = ["LITERATURE", "PHYSICS", "CHEMISTRY", "MEDICINE", "MATHEMATICS"];
  const selectedCategories = categories || allCategories;
  
  let allQuestions: AcademicQuestion[] = [];
  
  for (const category of selectedCategories) {
    const questions = QUESTIONS[category];
    const filtered = questions.filter(q => q.level <= level);
    
    const academicQuestions: AcademicQuestion[] = filtered.map((q, index) => ({
      id: `${category}-${level}-${index}`,
      category,
      question: q.question,
      options: q.options,
      answer: q.answer,
      explanation: q.explanation,
      level: q.level,
    }));
    
    allQuestions.push(...academicQuestions);
  }
  
  if (allQuestions.length < count) {
    const needed = count - allQuestions.length;
    for (let i = 0; i < needed; i++) {
      const category = selectedCategories[Math.floor(Math.random() * selectedCategories.length)];
      const qs = QUESTIONS[category];
      const q = qs[Math.floor(Math.random() * qs.length)];
      
      allQuestions.push({
        id: `gen-${category}-${i}`,
        category,
        question: q.question,
        options: shuffle([...q.options]),
        answer: q.answer,
        explanation: q.explanation,
        level: Math.max(1, level - 1),
      });
    }
  }
  
  return shuffle(allQuestions).slice(0, count);
}

export function getQuestionsByCategory(
  category: AcademicCategory,
  count: number,
  level: number = 1
): AcademicQuestion[] {
  const questions = QUESTIONS[category];
  const filtered = questions.filter(q => q.level <= level);
  
  const result: AcademicQuestion[] = filtered.map((q, index) => ({
    id: `${category}-${level}-${index}`,
    category,
    question: q.question,
    options: q.options,
    answer: q.answer,
    explanation: q.explanation,
    level: q.level,
  }));
  
  if (result.length < count) {
    const needed = count - result.length;
    for (let i = 0; i < needed; i++) {
      const q = questions[Math.floor(Math.random() * questions.length)];
      result.push({
        id: `${category}-extra-${i}`,
        category,
        question: q.question,
        options: shuffle([...q.options]),
        answer: q.answer,
        explanation: q.explanation,
        level: Math.max(1, level - 1),
      });
    }
  }
  
  return shuffle(result).slice(0, count);
}

export function getCategoryStats() {
  return {
    LITERATURE: { name: "文學", icon: "📚", total: QUESTIONS.LITERATURE.length },
    PHYSICS: { name: "物理", icon: "⚛️", total: QUESTIONS.PHYSICS.length },
    CHEMISTRY: { name: "化學", icon: "🧪", total: QUESTIONS.CHEMISTRY.length },
    MEDICINE: { name: "醫學", icon: "🏥", total: QUESTIONS.MEDICINE.length },
    MATHEMATICS: { name: "數學", icon: "🧮", total: QUESTIONS.MATHEMATICS.length },
  };
}