import prisma from "../src/config/prisma.js";

// 益智關卡種子數據
const PUZZLE_LEVELS = [
  {
    title: "記憶配對遊戲 - 初級",
    description: "配對相同的元素符號，訓練記憶力",
    difficulty: "EASY",
    type: "MEMORY",
    puzzleData: JSON.stringify({
      cards: ["🔥", "💧", "🌿", "⚡", "✨", "🌑", "🌙", "⭐"],
      gridSize: 4,
      theme: "elements"
    }),
    solution: JSON.stringify({
      pairs: [
        [0, 8], [1, 9], [2, 10], [3, 11],
        [4, 12], [5, 13], [6, 14], [7, 15]
      ]
    }),
    reward: JSON.stringify({
      xp: 50,
      items: ["經驗糖果"]
    }),
    unlockLevel: 1,
    timeLimit: 90
  },
  {
    title: "邏輯推理 - 圖案序列",
    description: "找出圖案的規律，預測下一個圖案",
    difficulty: "MEDIUM",
    type: "LOGIC",
    puzzleData: JSON.stringify({
      sequence: ["🔥", "💧", "🔥", "💧", "🔥", "?"],
      options: ["🔥", "💧", "🌿", "⚡"],
      pattern: "alternating"
    }),
    solution: JSON.stringify({
      answer: "💧",
      explanation: "火水交替的規律"
    }),
    reward: JSON.stringify({
      xp: 100,
      items: ["糖裹零食"]
    }),
    unlockLevel: 3,
    timeLimit: 60
  },
  {
    title: "數學謎題 - 元素計算",
    description: "計算元素能量的總和",
    difficulty: "MEDIUM",
    type: "MATH",
    puzzleData: JSON.stringify({
      equation: "🔥 + 💧 × 🌿 - ⚡ = ?",
      values: {
        "🔥": 5,
        "💧": 3,
        "🌿": 2,
        "⚡": 4
      }
    }),
    solution: JSON.stringify({
      answer: 7,
      steps: ["3 × 2 = 6", "5 + 6 = 11", "11 - 4 = 7"]
    }),
    reward: JSON.stringify({
      xp: 120,
      items: ["月光石"]
    }),
    unlockLevel: 5,
    timeLimit: 75
  },
  {
    title: "拼圖遊戲 - 精靈圖像",
    description: "將碎片拼湊成完整的精靈圖像",
    difficulty: "HARD",
    type: "PUZZLE",
    puzzleData: JSON.stringify({
      pieces: 16,
      image: "spirit_puzzle",
      rotation: true
    }),
    solution: JSON.stringify({
      positions: [
        [0, 1, 2, 3],
        [4, 5, 6, 7],
        [8, 9, 10, 11],
        [12, 13, 14, 15]
      ]
    }),
    reward: JSON.stringify({
      xp: 200,
      items: ["星辰石", "勇氣戒指"]
    }),
    unlockLevel: 8,
    timeLimit: 120
  },
  {
    title: "記憶大師 - 高級配對",
    description: "記憶更多元素符號並快速配對",
    difficulty: "EXPERT",
    type: "MEMORY",
    puzzleData: JSON.stringify({
      cards: ["🔥", "💧", "🌿", "⚡", "✨", "🌑", "🌙", "⭐", "❄️", "🌀", "🌪️", "🌈"],
      gridSize: 6,
      theme: "advanced_elements"
    }),
    solution: JSON.stringify({
      pairs: [
        [0, 12], [1, 13], [2, 14], [3, 15],
        [4, 16], [5, 17], [6, 18], [7, 19],
        [8, 20], [9, 21], [10, 22], [11, 23]
      ]
    }),
    reward: JSON.stringify({
      xp: 300,
      items: ["星辰石", "占卜水晶"]
    }),
    unlockLevel: 10,
    timeLimit: 150
  }
];

export async function seedPuzzles() {
  const puzzleCount = await prisma.puzzleLevel.count();
  
  if (puzzleCount === 0) {
    for (const puzzle of PUZZLE_LEVELS) {
      await prisma.puzzleLevel.create({
        data: puzzle
      });
    }
    console.log(`已創建 ${PUZZLE_LEVELS.length} 個益智關卡`);
  } else {
    console.log(`資料庫中已有 ${puzzleCount} 個益智關卡`);
  }
}

// 直接執行時
if (import.meta.url === `file://${process.argv[1]}`) {
  seedPuzzles()
    .then(() => {
      console.log("益智關卡種子數據創建完成");
      process.exit(0);
    })
    .catch((error) => {
      console.error("創建種子數據時出錯:", error);
      process.exit(1);
    });
}