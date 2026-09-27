import prisma from "../config/prisma.js";
import { pathToFileURL } from "node:url";

// 預設英語訓練主題
const defaultTopics = [
  // 日常生活主題
  {
    name: "日常問候",
    category: "daily",
    description: "學習基本的日常問候和簡單對話",
    difficulty: "BEGINNER",
    prompts: JSON.stringify([
      "Hello, how are you today?",
      "What's your name?",
      "Where are you from?",
      "What do you do for a living?",
      "How was your day?",
      "What are your hobbies?",
    ]),
    vocabulary: JSON.stringify({
      greetings: ["hello", "hi", "good morning", "good afternoon", "good evening"],
      feelings: ["good", "fine", "great", "okay", "tired", "busy"],
      occupations: ["student", "teacher", "engineer", "doctor", "artist"],
    }),
    grammarTips: JSON.stringify([
      "使用 'How are you?' 詢問對方近況",
      "回答時可以說 'I'm fine, thank you.'",
      "'What do you do?' 是詢問職業的常用說法",
    ]),
    order: 1,
  },
  {
    name: "餐廳點餐",
    category: "daily",
    description: "學習在餐廳點餐和詢問菜單",
    difficulty: "BEGINNER",
    prompts: JSON.stringify([
      "I'd like to order a hamburger.",
      "Could I see the menu, please?",
      "What do you recommend?",
      "Can I have the bill, please?",
      "Is there vegetarian food?",
      "Do you have any specials today?",
    ]),
    vocabulary: JSON.stringify({
      food: ["hamburger", "pizza", "salad", "soup", "dessert"],
      drinks: ["water", "coffee", "tea", "juice", "soda"],
      restaurant: ["menu", "bill", "waiter", "table", "order"],
    }),
    grammarTips: JSON.stringify([
      "使用 'I'd like...' 來表達想要什麼",
      "'Could I...' 是禮貌的請求方式",
      "詢問建議時用 'What do you recommend?'",
    ]),
    order: 2,
  },

  // 旅行主題
  {
    name: "機場對話",
    category: "travel",
    description: "學習在機場的常用對話",
    difficulty: "BEGINNER",
    prompts: JSON.stringify([
      "Where is the check-in counter?",
      "How many bags can I check in?",
      "Is this flight on time?",
      "Where is the boarding gate?",
      "Can I have a window seat?",
      "How long is the flight?",
    ]),
    vocabulary: JSON.stringify({
      airport: ["check-in", "boarding", "gate", "terminal", "security"],
      flight: ["departure", "arrival", "delay", "boarding pass", "luggage"],
      seats: ["window", "aisle", "middle", "exit row", "premium"],
    }),
    grammarTips: JSON.stringify([
      "使用 'Where is...?' 來詢問位置",
      "'How many...' 詢問數量",
      "'Can I...' 表達請求",
    ]),
    order: 5,
  },
  {
    name: "飯店住宿",
    category: "travel",
    description: "學習在飯店的對話",
    difficulty: "BEGINNER",
    prompts: JSON.stringify([
      "I have a reservation under the name...",
      "What time is check-in/check-out?",
      "Is breakfast included?",
      "Could I have a room with a view?",
      "How do I get to the city center?",
      "Could you call a taxi for me?",
    ]),
    vocabulary: JSON.stringify({
      hotel: ["reservation", "reception", "room service", "housekeeping", "lobby"],
      room: ["single", "double", "suite", "view", "balcony"],
      services: ["wifi", "breakfast", "parking", "gym", "pool"],
    }),
    grammarTips: JSON.stringify([
      "使用 'I have a reservation...' 來告知訂房",
      "詢問時間用 'What time is...?'",
      "請求協助用 'Could you...?'",
    ]),
    order: 6,
  },

  // 商務主題
  {
    name: "商務談判",
    category: "business",
    description: "學習商務談判的對話技巧",
    difficulty: "ADVANCED",
    prompts: JSON.stringify([
      "Let's discuss the terms of the contract.",
      "What's your best offer?",
      "We need to find a win-win solution.",
      "Could we extend the deadline?",
      "I propose we meet halfway.",
      "Let's schedule another meeting to finalize.",
    ]),
    vocabulary: JSON.stringify({
      negotiation: ["terms", "offer", "counteroffer", "agreement", "deadline"],
      business: ["contract", "partnership", "collaboration", "investment", "profit"],
      strategy: ["compromise", "solution", "proposal", "condition", "requirement"],
    }),
    grammarTips: JSON.stringify([
      "使用 'Let's discuss...' 來開啟討論",
      "提出建議用 'I propose...'",
      "尋找解決方案用 'We need to find...'",
    ]),
    order: 7,
  },

  // 社交主題
  {
    name: "社交派對",
    category: "social",
    description: "學習在社交場合的對話",
    difficulty: "INTERMEDIATE",
    prompts: JSON.stringify([
      "Nice to meet you! What brings you here?",
      "How do you know the host?",
      "What kind of music do you like?",
      "Have you tried the food here?",
      "What do you do for fun?",
      "We should meet up again sometime!",
    ]),
    vocabulary: JSON.stringify({
      social: ["host", "guest", "party", "gathering", "networking"],
      interests: ["music", "movies", "sports", "travel", "food"],
      conversation: ["introduce", "connect", "share", "discuss", "exchange"],
    }),
    grammarTips: JSON.stringify([
      "初次見面用 'Nice to meet you!'",
      "詢問關係用 'How do you know...?'",
      "提出建議用 'We should...'",
    ]),
    order: 8,
  },
];

async function seedEnglishTopics() {
  console.log("開始建立英語訓練主題...");

  try {
    // 檢查是否已有主題
    const existingTopics = await prisma.englishTopic.findMany();
    
    if (existingTopics.length > 0) {
      console.log("已有英語訓練主題，跳過建立");
      return;
    }

    // 建立主題
    for (const topic of defaultTopics) {
      await prisma.englishTopic.create({
        data: topic,
      });
      console.log(`已建立主題: ${topic.name}`);
    }

    console.log("英語訓練主題建立完成！");
    console.log(`共建立了 ${defaultTopics.length} 個主題`);
  } catch (error) {
    console.error("建立英語訓練主題時發生錯誤:", error);
    throw error;
  }
}

// 執行種子
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  seedEnglishTopics()
    .then(() => {
      console.log("種子執行完成");
      process.exit(0);
    })
    .catch((error) => {
      console.error("種子執行失敗:", error);
      process.exit(1);
    });
}

export { seedEnglishTopics };
