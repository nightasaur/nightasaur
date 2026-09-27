import prisma from "../config/prisma.js";

// 訓練家�?級�?驗�?�?
export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5));
}

export class GameService {
  // ?��??�?�活躍任??+ 使用?�進度
  async getQuests(userId: string) {
    const quests = await prisma.quest.findMany({ where: { isActive: true } });
    const progress = await prisma.questProgress.findMany({ where: { userId } });
    return quests.map(q => ({
      ...q,
      progress: progress.find(p => p.questId === q.id) || null,
    }));
  }

  // ?�新任�??�度 (對話?�進�??��?享�?觸發)
  async trackAction(userId: string, action: string, amount = 1) {
    const quests = await prisma.quest.findMany({ where: { isActive: true } });
    let awardedXp = 0;
    const awardedItems: string[] = [];

    for (const q of quests) {
      const req = JSON.parse(q.requirement || "{}");
      if (req.action !== action) continue;
      const target = req.count || 1;

      const existing = await prisma.questProgress.findUnique({
        where: { userId_questId: { userId, questId: q.id } },
      });

      if (existing?.claimed) continue;

      const newProgress = Math.min(target, (existing?.progress || 0) + amount);
      const completed = newProgress >= target;

      await prisma.questProgress.upsert({
        where: { userId_questId: { userId, questId: q.id } },
        create: { questId: q.id, userId, progress: newProgress, completed },
        update: { progress: newProgress, completed, completedAt: completed ? new Date() : null },
      });

      // ?��??�放?�勵
      if (completed && !existing?.claimed) {
        const reward = JSON.parse(q.reward || "{}");
        if (reward.xp) awardedXp += reward.xp;
        if (reward.items) awardedItems.push(...reward.items);
        await prisma.questProgress.update({
          where: { userId_questId: { userId, questId: q.id } },
          data: { claimed: true },
        });
      }
    }

    if (awardedXp) await this.addXp(userId, awardedXp);
    if (awardedItems.length) await this.grantItems(userId, awardedItems);

    return { xpAwarded: awardedXp, itemsAwarded: awardedItems };
  }

  // 訓練家�?�?+ ?��?
  async addXp(userId: string, xp: number) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;
    let { trainerXp, trainerLevel } = user;
    trainerXp += xp;
    while (trainerXp >= xpForLevel(trainerLevel)) {
      trainerXp -= xpForLevel(trainerLevel);
      trainerLevel += 1;
    }
    await prisma.user.update({ where: { id: userId }, data: { trainerXp, trainerLevel } });
    // 檢查等�??�就
    await this.checkAchievements(userId, "LEVEL", trainerLevel);
    return trainerLevel;
  }

  // ?��??�就 + 使用?�解?��???
  async getAchievements(userId: string) {
    const achievements = await prisma.achievement.findMany();
    const userAch = await prisma.userAchievement.findMany({ where: { userId } });
    return achievements.map(a => ({
      ...a,
      progress: userAch.find(u => u.achievementId === a.id)?.progress || 0,
      unlocked: userAch.find(u => u.achievementId === a.id)?.unlocked || false,
    }));
  }

  // 檢查並解?��?�?
  async checkAchievements(userId: string, action: string, value = 1) {
    const achievements = await prisma.achievement.findMany();
    for (const a of achievements) {
      const req = JSON.parse(a.requirement || "{}");
      if (req.action !== action) continue;
      const target = req.count || 1;
      const existing = await prisma.userAchievement.findUnique({
        where: { userId_achievementId: { userId, achievementId: a.id } },
      });
      if (existing?.unlocked) continue;
      const newProgress = Math.min(target, (existing?.progress || 0) + value);
      const unlocked = newProgress >= target;
      await prisma.userAchievement.upsert({
        where: { userId_achievementId: { userId, achievementId: a.id } },
        create: { userId, achievementId: a.id, progress: newProgress, unlocked, unlockedAt: unlocked ? new Date() : null },
        update: { progress: newProgress, unlocked, unlockedAt: unlocked ? new Date() : null },
      });
      if (unlocked) {
        const reward = JSON.parse(a.reward || "{}");
        if (reward.xp) await this.addXp(userId, reward.xp);
        if (reward.items) await this.grantItems(userId, reward.items);
      }
    }
  }

  // 給�??�具
  async grantItems(userId: string, itemNames: string[]) {
    for (const name of itemNames) {
      const item = await prisma.item.findFirst({ where: { name } });
      if (!item) continue;
      await prisma.userItem.upsert({
        where: { userId_itemId: { userId, itemId: item.id } },
        create: { userId, itemId: item.id, quantity: 1 },
        update: { quantity: { increment: 1 } },
      });
    }
  }

  // ?��??��?
  async getInventory(userId: string) {
    return prisma.userItem.findMany({ where: { userId }, include: { item: true } });
  }

  // Use item
  async useItem(userId: string, spiritId: string, itemId: string) {
    return prisma.$transaction(async tx => {
      const spirit = await tx.spirit.findFirst({
        where: { id: spiritId, userId, isActive: true },
        select: { id: true },
      });
      if (!spirit) {
        throw Object.assign(new Error("精靈不存在或不屬於您"), { statusCode: 404 });
      }
      const userItem = await tx.userItem.findFirst({
        where: { userId, itemId },
        include: { item: true },
      });
      if (!userItem) throw Object.assign(new Error("道具不足"), { statusCode: 400 });
      const consumed = await tx.userItem.updateMany({
        where: { id: userItem.id, userId, quantity: { gt: 0 } },
        data: { quantity: { decrement: 1 } },
      });
      if (consumed.count !== 1) {
        throw Object.assign(new Error("道具不足"), { statusCode: 400 });
      }
      const effect = userItem.item.effect ? JSON.parse(userItem.item.effect) : {};
      if (typeof effect.xp === "number" && Number.isSafeInteger(effect.xp) && effect.xp > 0) {
        await tx.spirit.update({
          where: { id: spirit.id },
          data: { experience: { increment: Math.min(effect.xp, 10_000) } },
        });
      }
      return { success: true, effect };
    });
  }
}

export const gameService = new GameService();
