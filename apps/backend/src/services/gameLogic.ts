import prisma from "../config/prisma.js";
import { gameService } from "./game.js";
import { puzzleService } from "./puzzle.js";
import { squadService } from "./squad.js";

export class GameLogicService {
  // 獲取完整遊戲狀態（包含小隊）
  async getFullGameState(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        spirits: {
          where: { isActive: true },
          take: 1
        }
      }
    });
    
    if (!user) throw new Error("使用者不存在");
    
    // 獲取小隊資訊
    const squad = await squadService.getSquad(userId);
    const squadStats = await squadService.getSquadStats(userId);
    
    // 獲取任務
    const quests = await gameService.getQuests(userId);
    
    // 獲取每日益智
    const dailyPuzzle = await puzzleService.getDailyPuzzle().catch(() => null);
    
    return {
      user: {
        id: user.id,
        username: user.username,
        trainerLevel: user.trainerLevel,
        trainerXp: user.trainerXp,
        gems: user.gems,
        coins: user.coins
      },
      activeSpirit: user.spirits[0] || null,
      quests: quests.slice(0, 3),
      dailyPuzzle,
      squad: squad ? {
        ...squad,
        stats: squadStats
      } : null
    };
  }
  
  // 小隊協同益智挑戰
  async squadPuzzleChallenge(userId: string, puzzleId: string) {
    const squad = await squadService.getSquad(userId);
    if (!squad) throw new Error("請先創建小隊");
    
    if (squad.members.length < 2) {
      throw new Error("至少需要2隻精靈才能進行小隊挑戰");
    }
    
    const puzzle = await prisma.puzzleLevel.findUnique({ 
      where: { id: puzzleId } 
    });
    if (!puzzle) throw new Error("益智關卡不存在");
    
    const results = [];
    const synergyBonus = 1 + (squad.members.length * 0.15);
    
    for (const member of squad.members) {
      if (member.isActive) {
        try {
          const puzzleResult = await puzzleService.attemptPuzzle(
            userId,
            member.spiritId,
            puzzleId,
            JSON.parse(puzzle.solution),
            30
          );
          
          results.push({
            spiritId: member.spiritId,
            spiritName: member.spirit.name,
            success: puzzleResult.success,
            score: Math.floor(puzzleResult.score * synergyBonus),
            reward: puzzleResult.reward
          });
        } catch (error) {
          results.push({
            spiritId: member.spiritId,
            spiritName: member.spirit.name,
            success: false,
            error: error.message
          });
        }
      }
    }
    
    // 追蹤小隊挑戰動作
    await gameService.trackAction(userId, "SQUAD_CHALLENGE", 1);
    
    return {
      success: true,
      synergyBonus,
      puzzleTitle: puzzle.title,
      results
    };
  }
  
  // 小隊日常訓練
  async squadDailyTraining(userId: string) {
    const squad = await squadService.getSquad(userId);
    if (!squad) throw new Error("請先創建小隊");
    
    const trainingTypes = ["COMBAT", "INTELLIGENCE", "AGILITY", "DEFENSE"];
    const dailyTraining = trainingTypes[Math.floor(Math.random() * trainingTypes.length)];
    
    const results = [];
    
    for (const member of squad.members) {
      try {
        const trainingResult = await squadService.trainSquadSpirit(
          userId,
          member.spiritId,
          dailyTraining,
          15
        );
        
        results.push({
          spiritId: member.spiritId,
          spiritName: member.spirit.name,
          trainingType: dailyTraining,
          xpGained: trainingResult.xpGained,
          levelUp: trainingResult.spiritLevelUp
        });
      } catch (error) {
        results.push({
          spiritId: member.spiritId,
          spiritName: member.spirit.name,
          error: error.message
        });
      }
    }
    
    // 追蹤訓練動作
    const questResult = await gameService.trackAction(userId, "SQUAD_TRAINING", 1);
    
    return {
      success: true,
      dailyTraining,
      results,
      completedQuests: questResult.completedQuests
    };
  }
  
  // 自動創建小隊（新使用者）
  async autoCreateSquad(userId: string) {
    const existingSquad = await squadService.getSquad(userId);
    if (existingSquad) return existingSquad;
    
    // 創建預設小隊
    const squad = await squadService.createSquad(userId, "我的冒險小隊");
    
    // 獲取使用者的精靈
    const spirits = await prisma.spirit.findMany({
      where: { userId },
      take: 4 // 最多添加4隻
    });
    
    // 添加精靈到小隊
    for (let i = 0; i < Math.min(spirits.length, 4); i++) {
      await squadService.addSpiritToSquad(userId, spirits[i].id, i + 1);
    }
    
    // 設置第一個精靈為活躍
    if (spirits.length > 0) {
      await squadService.switchActiveSpirit(userId, spirits[0].id);
    }
    
    return squad;
  }
  
  // 小隊快速切換
  async quickSquadSwitch(userId: string) {
    const squad = await squadService.getSquad(userId);
    if (!squad) throw new Error("請先創建小隊");
    
    if (squad.members.length < 2) {
      throw new Error("小隊需要至少2隻精靈才能切換");
    }
    
    // 找出當前活躍精靈
    const activeMember = squad.members.find(m => m.isActive);
    if (!activeMember) throw new Error("沒有活躍精靈");
    
    // 找出下一個精靈
    const nextIndex = (squad.members.indexOf(activeMember) + 1) % squad.members.length;
    const nextMember = squad.members[nextIndex];
    
    // 切換精靈
    const result = await squadService.switchActiveSpirit(userId, nextMember.spiritId);
    
    return {
      success: true,
      previousSpirit: activeMember.spirit.name,
      currentSpirit: nextMember.spirit.name,
      result
    };
  }
}

export const gameLogicService = new GameLogicService();