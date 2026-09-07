import prisma from "../config/prisma.js";

export class SquadService {
  // 創建小隊
  async createSquad(userId: string, name: string) {
    const existingSquad = await prisma.squad.findUnique({ where: { userId } });
    if (existingSquad) throw new Error("每個使用者只能有一個小隊");
    
    return await prisma.squad.create({
      data: { userId, name, maxSize: 4 }
    });
  }
  
  // 獲取小隊資訊
  async getSquad(userId: string) {
    return await prisma.squad.findUnique({
      where: { userId },
      include: {
        members: {
          include: { spirit: true },
          orderBy: { position: "asc" }
        }
      }
    });
  }
  
  // 添加精靈到小隊
  async addSpiritToSquad(userId: string, spiritId: string, position?: number) {
    const squad = await prisma.squad.findUnique({ where: { userId } });
    if (!squad) throw new Error("請先創建小隊");
    
    const spirit = await prisma.spirit.findUnique({ 
      where: { id: spiritId, userId } 
    });
    if (!spirit) throw new Error("精靈不存在或不屬於您");
    
    const memberCount = await prisma.squadMember.count({ 
      where: { squadId: squad.id } 
    });
    if (memberCount >= squad.maxSize) throw new Error("小隊已滿");
    
    const existingMember = await prisma.squadMember.findFirst({ 
      where: { spiritId } 
    });
    if (existingMember) throw new Error("精靈已在其他小隊中");
    
    let targetPosition = position;
    if (!targetPosition) {
      const positions = await prisma.squadMember.findMany({
        where: { squadId: squad.id },
        select: { position: true }
      });
      const usedPositions = positions.map(p => p.position);
      for (let i = 1; i <= squad.maxSize; i++) {
        if (!usedPositions.includes(i)) {
          targetPosition = i;
          break;
        }
      }
      if (!targetPosition) throw new Error("沒有可用的位置");
    }
    
    return await prisma.squadMember.create({
      data: {
        squadId: squad.id,
        spiritId,
        position: targetPosition,
        isActive: true
      },
      include: { spirit: true }
    });
  }
  
  // 從小隊中移除精靈
  async removeSpiritFromSquad(userId: string, spiritId: string) {
    const squad = await prisma.squad.findUnique({ where: { userId } });
    if (!squad) throw new Error("小隊不存在");
    
    const squadMember = await prisma.squadMember.findFirst({
      where: { squadId: squad.id, spiritId }
    });
    if (!squadMember) throw new Error("精靈不在小隊中");
    
    await prisma.squadMember.delete({ where: { id: squadMember.id } });
    return true;
  }
  
  // 切換主精靈
  async switchActiveSpirit(userId: string, spiritId: string) {
    const squad = await prisma.squad.findUnique({
      where: { userId },
      include: { members: true }
    });
    if (!squad) throw new Error("請先創建小隊");
    
    const targetMember = squad.members.find(m => m.spiritId === spiritId);
    if (!targetMember) throw new Error("精靈不在小隊中");
    
    await prisma.squadMember.updateMany({
      where: { squadId: squad.id },
      data: { isActive: false }
    });
    
    await prisma.squadMember.update({
      where: { id: targetMember.id },
      data: { isActive: true }
    });
    
    await prisma.user.update({
      where: { id: userId },
      data: { activeSpiritId: spiritId }
    });
    
    return { success: true, activeSpiritId: spiritId };
  }

  // 訓練小隊精靈
  async trainSquadSpirit(userId: string, spiritId: string, trainingType: string, duration: number) {
    const squad = await prisma.squad.findUnique({ where: { userId } });
    if (!squad) throw new Error("請先創建小隊");
    
    const squadMember = await prisma.squadMember.findFirst({
      where: { squadId: squad.id, spiritId }
    });
    if (!squadMember) throw new Error("精靈不在小隊中");
    
    const xpGained = this.calculateTrainingXp(duration, trainingType);
    
    let training = await prisma.squadTraining.findUnique({
      where: {
        squadId_spiritId_trainingType: {
          squadId: squad.id,
          spiritId,
          trainingType
        }
      }
    });
    
    if (!training) {
      training = await prisma.squadTraining.create({
        data: {
          squadId: squad.id,
          spiritId,
          trainingType,
          xp: xpGained,
          lastTrained: new Date()
        }
      });
    } else {
      const newXp = training.xp + xpGained;
      const xpForNextLevel = 100 * training.level;
      let newLevel = training.level;
      
      if (newXp >= xpForNextLevel) {
        newLevel += 1;
      }
      
      training = await prisma.squadTraining.update({
        where: { id: training.id },
        data: {
          xp: newXp,
          level: newLevel,
          lastTrained: new Date()
        }
      });
    }
    
    await prisma.spirit.update({
      where: { id: spiritId },
      data: { experience: { increment: xpGained } }
    });
    
    const levelUp = await this.checkSpiritLevelUp(spiritId);
    
    return { training, xpGained, spiritLevelUp: levelUp };
  }
  
  // 計算訓練經驗值
  private calculateTrainingXp(duration: number, trainingType: string): number {
    const baseXp = {
      COMBAT: 15,
      INTELLIGENCE: 12,
      AGILITY: 10,
      DEFENSE: 8
    };
    
    const multiplier = Math.floor(duration / 5);
    return (baseXp[trainingType] || 10) * multiplier;
  }
  
  // 檢查精靈升級
  private async checkSpiritLevelUp(spiritId: string) {
    const spirit = await prisma.spirit.findUnique({ where: { id: spiritId } });
    if (!spirit) return null;
    
    const xpForNextLevel = 100 * spirit.level;
    
    if (spirit.experience >= xpForNextLevel) {
      const newLevel = spirit.level + 1;
      
      await prisma.spirit.update({
        where: { id: spiritId },
        data: {
          level: newLevel,
          experience: spirit.experience - xpForNextLevel
        }
      });
      
      return { success: true, newLevel, previousLevel: spirit.level };
    }
    
    return null;
  }
  
  // 獲取小隊統計
  async getSquadStats(userId: string) {
    const squad = await prisma.squad.findUnique({
      where: { userId },
      include: {
        members: {
          include: {
            spirit: true,
            trainings: true
          }
        }
      }
    });
    
    if (!squad) return null;
    
    const stats = {
      totalMembers: squad.members.length,
      averageLevel: 0,
      totalCombatLevel: 0,
      totalIntelligenceLevel: 0,
      totalAgilityLevel: 0,
      totalDefenseLevel: 0,
      activeSpirit: null
    };
    
    if (squad.members.length > 0) {
      const totalLevel = squad.members.reduce((sum, member) => sum + member.spirit.level, 0);
      stats.averageLevel = Math.round(totalLevel / squad.members.length);
      
      squad.members.forEach(member => {
        member.trainings.forEach(training => {
          switch (training.trainingType) {
            case "COMBAT": stats.totalCombatLevel += training.level; break;
            case "INTELLIGENCE": stats.totalIntelligenceLevel += training.level; break;
            case "AGILITY": stats.totalAgilityLevel += training.level; break;
            case "DEFENSE": stats.totalDefenseLevel += training.level; break;
          }
        });
      });
      
      const activeMember = squad.members.find(m => m.isActive);
      if (activeMember) {
        stats.activeSpirit = activeMember.spirit;
      }
    }
    
    return stats;
  }
}

export const squadService = new SquadService();