import prisma from "../config/prisma.js";

export class PuzzleService {
  // 獲取可用的益智關卡
  async getAvailablePuzzles(userId: string, spiritId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("使用者不存在");
    
    const spirit = await prisma.spirit.findUnique({ 
      where: { id: spiritId, userId } 
    });
    if (!spirit) throw new Error("精靈不存在");
    
    // 獲取所有關卡
    const puzzles = await prisma.puzzleLevel.findMany({
      where: {
        unlockLevel: { lte: user.trainerLevel }
      },
      orderBy: [
        { difficulty: "asc" },
        { unlockLevel: "asc" }
      ]
    });
    
    // 獲取精靈的進度
    const progress = await prisma.spiritPuzzleProgress.findMany({
      where: { spiritId },
      include: { puzzle: true }
    });
    
    return puzzles.map(puzzle => {
      const p = progress.find(prog => prog.puzzleId === puzzle.id);
      return {
        ...puzzle,
        puzzleData: JSON.parse(puzzle.puzzleData),
        progress: p ? {
          attempts: p.attempts,
          completed: p.completed,
          bestTime: p.bestTime,
          score: p.score,
          lastAttempt: p.lastAttempt
        } : null
      };
    });
  }
  
  // 獲取每日益智
  async getDailyPuzzle() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let dailyPuzzle = await prisma.dailyPuzzle.findUnique({
      where: { date: today },
      include: { puzzle: true }
    });
    
    // 如果沒有今天的每日益智，創建一個
    if (!dailyPuzzle) {
      // 隨機選擇一個中等難度的關卡
      const puzzles = await prisma.puzzleLevel.findMany({
        where: { difficulty: "MEDIUM" },
        take: 10
      });
      
      if (puzzles.length === 0) {
        throw new Error("沒有可用的益智關卡");
      }
      
      const randomPuzzle = puzzles[Math.floor(Math.random() * puzzles.length)];
      
      dailyPuzzle = await prisma.dailyPuzzle.create({
        data: {
          puzzleId: randomPuzzle.id,
          date: today
        },
        include: { puzzle: true }
      });
    }
    
    return {
      ...dailyPuzzle.puzzle,
      puzzleData: JSON.parse(dailyPuzzle.puzzle.puzzleData),
      streakBonus: dailyPuzzle.streakBonus
    };
  }
  
  // 嘗試解決益智
  async attemptPuzzle(
    userId: string, 
    spiritId: string, 
    puzzleId: string, 
    solution: any, 
    timeSpent: number
  ) {
    const puzzle = await prisma.puzzleLevel.findUnique({ where: { id: puzzleId } });
    if (!puzzle) throw new Error("益智關卡不存在");
    
    const correctSolution = JSON.parse(puzzle.solution);
    const isCorrect = this.checkSolution(solution, correctSolution);
    
    // 獲取或創建進度記錄
    let progress = await prisma.spiritPuzzleProgress.findUnique({
      where: { spiritId_puzzleId: { spiritId, puzzleId } }
    });
    
    if (!progress) {
      progress = await prisma.spiritPuzzleProgress.create({
        data: {
          spiritId,
          puzzleId,
          attempts: 1,
          lastAttempt: new Date()
        }
      });
    } else {
      progress = await prisma.spiritPuzzleProgress.update({
        where: { id: progress.id },
        data: {
          attempts: { increment: 1 },
          lastAttempt: new Date()
        }
      });
    }
    
    let score = 0;
    let reward = null;
    
    if (isCorrect) {
      // 計算分數（基於時間和難度）
      score = this.calculateScore(puzzle.difficulty, timeSpent, puzzle.timeLimit);
      
      // 更新進度
      progress = await prisma.spiritPuzzleProgress.update({
        where: { id: progress.id },
        data: {
          completed: true,
          bestTime: progress.bestTime 
            ? Math.min(progress.bestTime, timeSpent) 
            : timeSpent,
          score: Math.max(progress.score, score),
          completedAt: new Date()
        }
      });
      
      // 更新關卡統計
      await prisma.puzzleLevel.update({
        where: { id: puzzleId },
        data: {
          attempts: { increment: 1 },
          completed: { increment: 1 },
          successRate: (puzzle.completed + 1) / (puzzle.attempts + 1)
        }
      });
      
      // 發放獎勵
      const rewardData = JSON.parse(puzzle.reward);
      reward = await this.grantReward(userId, spiritId, rewardData, score);
      
      // 更新精靈升級
      await this.updateSpiritUpgrades(spiritId, puzzle.type, score);
    } else {
      // 更新關卡統計（僅嘗試）
      await prisma.puzzleLevel.update({
        where: { id: puzzleId },
        data: {
          attempts: { increment: 1 },
          successRate: puzzle.completed / (puzzle.attempts + 1)
        }
      });
    }
    
    return {
      success: isCorrect,
      score,
      reward,
      progress: {
        attempts: progress.attempts,
        completed: progress.completed,
        bestTime: progress.bestTime,
        score: progress.score
      }
    };
  }

  // 檢查解答是否正確
  private checkSolution(userSolution: any, correctSolution: any): boolean {
    // 簡化的解答檢查邏輯
    // 實際實現會根據不同的益智類型有所不同
    return JSON.stringify(userSolution) === JSON.stringify(correctSolution);
  }
  
  // 計算分數
  private calculateScore(
    difficulty: string, 
    timeSpent: number, 
    timeLimit?: number
  ): number {
    const difficultyMultiplier = {
      EASY: 1,
      MEDIUM: 2,
      HARD: 3,
      EXPERT: 5
    };
    
    let baseScore = 100 * (difficultyMultiplier[difficulty] || 1);
    
    // 時間獎勵
    if (timeLimit && timeSpent <= timeLimit) {
      const timeBonus = Math.max(0, timeLimit - timeSpent) * 10;
      baseScore += timeBonus;
    }
    
    return Math.round(baseScore);
  }
  
  // 發放獎勵
  private async grantReward(
    userId: string, 
    spiritId: string, 
    rewardData: any, 
    score: number
  ) {
    const rewards = [];
    
    if (rewardData.xp) {
      // 增加精靈經驗
      const xpAmount = rewardData.xp + Math.floor(score / 10);
      await prisma.spirit.update({
        where: { id: spiritId },
        data: { experience: { increment: xpAmount } }
      });
      rewards.push({ type: "XP", amount: xpAmount });
    }
    
    if (rewardData.items && Array.isArray(rewardData.items)) {
      // 給予道具
      for (const itemName of rewardData.items) {
        const item = await prisma.item.findFirst({ where: { name: itemName } });
        if (item) {
          await prisma.userItem.upsert({
            where: { userId_itemId: { userId, itemId: item.id } },
            create: { userId, itemId: item.id, quantity: 1 },
            update: { quantity: { increment: 1 } }
          });
          rewards.push({ type: "ITEM", name: itemName, amount: 1 });
        }
      }
    }
    
    return rewards;
  }
  
  // 更新精靈升級
  private async updateSpiritUpgrades(
    spiritId: string, 
    puzzleType: string, 
    score: number
  ) {
    const upgradeTypeMap = {
      PUZZLE: "INTELLIGENCE",
      MEMORY: "MEMORY",
      LOGIC: "LOGIC",
      MATH: "CREATIVITY"
    };
    
    const upgradeType = upgradeTypeMap[puzzleType] || "INTELLIGENCE";
    
    let upgrade = await prisma.spiritUpgrade.findUnique({
      where: { spiritId_upgradeType: { spiritId, upgradeType } }
    });
    
    if (!upgrade) {
      upgrade = await prisma.spiritUpgrade.create({
        data: {
          spiritId,
          upgradeType,
          xp: score,
          unlockedAt: new Date()
        }
      });
    } else {
      const newXp = upgrade.xp + score;
      const xpForNextLevel = 100 * upgrade.level;
      
      if (newXp >= xpForNextLevel) {
        upgrade = await prisma.spiritUpgrade.update({
          where: { id: upgrade.id },
          data: {
            xp: newXp - xpForNextLevel,
            level: { increment: 1 }
          }
        });
      } else {
        upgrade = await prisma.spiritUpgrade.update({
          where: { id: upgrade.id },
          data: { xp: newXp }
        });
      }
    }
    
    return upgrade;
  }
  
  // 獲取精靈升級狀態
  async getSpiritUpgrades(spiritId: string) {
    const upgrades = await prisma.spiritUpgrade.findMany({
      where: { spiritId },
      orderBy: { upgradeType: "asc" }
    });
    
    // 確保所有升級類型都存在
    const allTypes = ["INTELLIGENCE", "CREATIVITY", "LOGIC", "MEMORY"];
    const result = [];
    
    for (const type of allTypes) {
      const upgrade = upgrades.find(u => u.upgradeType === type);
      result.push({
        type,
        level: upgrade?.level || 0,
        xp: upgrade?.xp || 0,
        xpForNextLevel: 100 * (upgrade?.level || 0),
        unlocked: !!upgrade?.unlockedAt,
        unlockedAt: upgrade?.unlockedAt
      });
    }
    
    return result;
  }
  
  // 獲取排行榜
  async getLeaderboard(puzzleId?: string, limit: number = 10) {
    let query: any = {
      where: { completed: true },
      include: {
        spirit: {
          include: {
            user: { select: { username: true } }
          }
        },
        puzzle: true
      },
      orderBy: { score: "desc" },
      take: limit
    };
    
    if (puzzleId) {
      query.where.puzzleId = puzzleId;
    }
    
    const leaderboard = await prisma.spiritPuzzleProgress.findMany(query);
    
    return leaderboard.map((entry, index) => ({
      rank: index + 1,
      username: entry.spirit.user.username,
      spiritName: entry.spirit.name,
      score: entry.score,
      bestTime: entry.bestTime,
      attempts: entry.attempts,
      completedAt: entry.completedAt,
      puzzleTitle: entry.puzzle.title
    }));
  }
}

export const puzzleService = new PuzzleService();