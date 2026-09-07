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
        where: { questId_userId: { questId: q.id, userId } },
      });

      if (existing?.claimed) continue;

      const newProgress = Math.min(target, (existing?.progress || 0) + amount);
      const completed = newProgress >= target;

      await prisma.questProgress.upsert({
        where: { questId_userId: { questId: q.id, userId } },
        create: { questId: q.id, userId, progress: newProgress, completed },
        update: { progress: newProgress, completed, completedAt: completed ? new Date() : null },
      });

      // ?��??�放?�勵
      if (completed && !existing?.claimed) {
        const reward = JSON.parse(q.reward || "{}");
        if (reward.xp) awardedXp += reward.xp;
        if (reward.items) awardedItems.push(...reward.items);
        await prisma.questProgress.update({
          where: { questId_userId: { questId: q.id, userId } },
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

  // 完�?任�?
  async completeQuest(userId: string, questId: string) {
    const quest = await prisma.quest.findUnique({ where: { id: questId } });
    if (!quest) throw new Error("Quest not found");
    
    const req = JSON.parse(quest.requirement || "{}");
    await this.trackAction(userId, req.action || "GENERIC", req.count || 1);
  }

  // Use item
  async useItem(userId: string, spiritId: string, itemId: string) {
    const userItem = await prisma.userItem.findFirst({
      where: { userId, itemId },
      include: { item: true }
    });
    
    if (!userItem || userItem.quantity < 1) {
      throw new Error("Item not enough");
    }
    
    // Reduce item quantity
    await prisma.userItem.update({
      where: { id: userItem.id },
      data: { quantity: { decrement: 1 } }
    });
    
    // Apply item effect
    const effect = userItem.item.effect ? JSON.parse(userItem.item.effect) : {};
    
    if (effect.xp) {
      // Add spirit experience
      await prisma.spirit.update({
        where: { id: spiritId },
        data: { experience: { increment: effect.xp } }
      });
    }
    
    if (effect.evolveBoost) {
      // Evolution boost
      console.log(`Evolution boost: ${effect.evolveBoost}`);
    }
    
    return { success: true, effect };
  }

  // Claim quest reward
  async claimQuest(userId: string, questId: string) {
    const p = await prisma.questProgress.findUnique({
      where: { questId_userId: { questId, userId } },
    });
    if (!p || !p.completed || p.claimed) return null;
    const q = await prisma.quest.findUnique({ where: { id: questId } });
    if (!q) return null;
    const reward = JSON.parse(q.reward || "{}");
    if (reward.xp) await this.addXp(userId, reward.xp);
    if (reward.items) await this.grantItems(userId, reward.items);
    await prisma.questProgress.update({
      where: { questId_userId: { questId, userId } },
      data: { claimed: true },
    });
    return reward;
  }
}

export const gameService = new GameService();
