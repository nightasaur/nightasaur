import prisma from "../src/config/prisma.js";

// ─── 道具 ───
const ITEMS = [
  { name: "火之石", type: "EVOLUTION", rarity: "COMMON", emoji: "🔥", description: "用於火屬性精靈進化", effect: JSON.stringify({ evolveTo: "JUVENILE" }), price: 50 },
  { name: "水之石", type: "EVOLUTION", rarity: "COMMON", emoji: "💧", description: "用於水屬性精靈進化", effect: JSON.stringify({ evolveTo: "JUVENILE" }), price: 50 },
  { name: "月光石", type: "EVOLUTION", rarity: "RARE", emoji: "🌙", description: "高階進化石，提升進化成功率", effect: JSON.stringify({ evolveBoost: 2 }), price: 200 },
  { name: "星辰石", type: "EVOLUTION", rarity: "EPIC", emoji: "⭐", description: "傳說級進化石", effect: JSON.stringify({ evolveBoost: 4 }), price: 500 },
  { name: "經驗糖果", type: "BOOST", rarity: "COMMON", emoji: "🍬", description: "精靈獲得 50 經驗", effect: JSON.stringify({ xp: 50 }), price: 30 },
  { name: "糖裹零食", type: "BOOST", rarity: "RARE", emoji: "🍭", description: "精靈獲得 200 經驗", effect: JSON.stringify({ xp: 200 }), price: 100 },
  { name: "勇氣戒指", type: "COSMETIC", rarity: "RARE", emoji: "💍", description: "精靈配件：勇氣象徵", price: 150 },
  { name: "占卜水晶", type: "COSMETIC", rarity: "EPIC", emoji: "🔮", description: "精靈配件：神秘占卜", price: 300 },
];

// ─── 任務 ───
const QUESTS = [
  { title: "每日對話", description: "跟精靈對話 3 次", type: "DAILY", emoji: "💬", requirement: JSON.stringify({ action: "CHAT", count: 3 }), reward: JSON.stringify({ xp: 50, items: ["經驗糖果"] }) },
  { title: "愛護精靈", description: "幫精靈換裝 1 次", type: "DAILY", emoji: "🎨", requirement: JSON.stringify({ action: "CUSTOMIZE", count: 1 }), reward: JSON.stringify({ xp: 30, items: [] }) },
  { title: "進化之路", description: "完成 1 次精靈進化", type: "WEEKLY", emoji: "🦖", requirement: JSON.stringify({ action: "EVOLVE", count: 1 }), reward: JSON.stringify({ xp: 200, items: ["月光石"] }) },
  { title: "社群達人", description: "分享精靈到 FB/IG 1 次", type: "WEEKLY", emoji: "📱", requirement: JSON.stringify({ action: "SHARE", count: 1 }), reward: JSON.stringify({ xp: 150, items: ["糖裹零食"] }) },
  { title: "孵化新寵", description: "孵化 1 隻新精靈", type: "SPECIAL", emoji: "🥚", requirement: JSON.stringify({ action: "CREATE_SPIRIT", count: 1 }), reward: JSON.stringify({ xp: 100, items: ["水之石"] }) },
];

// ─── 成就 ───
const ACHIEVEMENTS = [
  { code: "FIRST_SPIRIT", title: "初次孵化", description: "孵化第一隻精靈", emoji: "🥚", category: "SPIRIT", tier: "BRONZE", requirement: JSON.stringify({ action: "CREATE_SPIRIT", count: 1 }), reward: JSON.stringify({ xp: 50 }) },
  { code: "CHATTERBOX", title: "話匣子", description: "累計對話 10 次", emoji: "💬", category: "SPIRIT", tier: "BRONZE", requirement: JSON.stringify({ action: "CHAT", count: 10 }), reward: JSON.stringify({ xp: 100, items: ["經驗糖果"] }) },
  { code: "CHAT_MASTER", title: "聊天大師", description: "累計對話 100 次", emoji: "🗣️", category: "SPIRIT", tier: "SILVER", requirement: JSON.stringify({ action: "CHAT", count: 100 }), reward: JSON.stringify({ xp: 500, items: ["糖裹零食"] }) },
  { code: "FIRST_EVOLUTION", title: "初次進化", description: "完成第一次進化", emoji: "🦎", category: "SPIRIT", tier: "BRONZE", requirement: JSON.stringify({ action: "EVOLVE", count: 1 }), reward: JSON.stringify({ xp: 150 }) },
  { code: "EVOLUTION_MASTER", title: "進化大師", description: "累計進化 5 次", emoji: "🦖", category: "SPIRIT", tier: "GOLD", requirement: JSON.stringify({ action: "EVOLVE", count: 5 }), reward: JSON.stringify({ xp: 800, items: ["月光石"] }) },
  { code: "SOCIAL_BUTTERFLY", title: "社交蝴蝶", description: "首次分享到社群", emoji: "📱", category: "SOCIAL", tier: "BRONZE", requirement: JSON.stringify({ action: "SHARE", count: 1 }), reward: JSON.stringify({ xp: 100 }) },
  { code: "FASHIONISTA", title: "時尚達人", description: "換裝 5 次", emoji: "👗", category: "COLLECTION", tier: "SILVER", requirement: JSON.stringify({ action: "CUSTOMIZE", count: 5 }), reward: JSON.stringify({ xp: 200, items: ["勇氣戒指"] }) },
  { code: "LEVEL_5", title: "訓練家 Lv.5", description: "達到訓練家等級 5", emoji: "⭐", category: "SPIRIT", tier: "SILVER", requirement: JSON.stringify({ action: "LEVEL", count: 5 }), reward: JSON.stringify({ xp: 300 }) },
  { code: "LEVEL_10", title: "訓練家 Lv.10", description: "達到訓練家等級 10", emoji: "🏆", category: "SPIRIT", tier: "GOLD", requirement: JSON.stringify({ action: "LEVEL", count: 10 }), reward: JSON.stringify({ xp: 1000, items: ["星辰石"] }) },
];

export async function seedGame() {
  const itemCount = await prisma.item.count();
  if (itemCount === 0) {
    for (const item of ITEMS) await prisma.item.create({ data: item });
    console.log(`Seeded ${ITEMS.length} items`);
  }

  const questCount = await prisma.quest.count();
  if (questCount === 0) {
    for (const q of QUESTS) await prisma.quest.create({ data: q });
    console.log(`Seeded ${QUESTS.length} quests`);
  }

  const achCount = await prisma.achievement.count();
  if (achCount === 0) {
    for (const a of ACHIEVEMENTS) await prisma.achievement.create({ data: a });
    console.log(`Seeded ${ACHIEVEMENTS.length} achievements`);
  }
}

// 直接執行
seedGame().then(() => { console.log("Game seed complete"); process.exit(0); }).catch(e => { console.error(e); process.exit(1); });