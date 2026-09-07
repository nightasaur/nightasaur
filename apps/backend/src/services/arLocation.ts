import prisma from "../config/prisma.js";

export class ARLocationService {
  // 更新玩家位置
  async updatePlayerLocation(
    userId: string, 
    latitude: number, 
    longitude: number, 
    accuracy?: number,
    altitude?: number,
    speed?: number,
    heading?: number
  ) {
    const location = await prisma.playerLocation.upsert({
      where: { userId },
      update: {
        latitude,
        longitude,
        accuracy,
        altitude,
        speed,
        heading,
        lastUpdate: new Date()
      },
      create: {
        userId,
        latitude,
        longitude,
        accuracy,
        altitude,
        speed,
        heading
      }
    });
    
    // 檢查附近的生成點
    const nearbySpawns = await this.getNearbySpawns(latitude, longitude, 500);
    const nearbyHotspots = await this.getNearbyHotspots(latitude, longitude, 1000);
    
    return {
      location,
      nearbySpawns: nearbySpawns.length,
      nearbyHotspots: nearbyHotspots.length
    };
  }
  
  // 獲取附近的精靈生成點
  async getNearbySpawns(
    latitude: number, 
    longitude: number, 
    radius: number = 500
  ) {
    const allSpawns = await prisma.locationSpawn.findMany({
      where: {
        OR: [
          { activeSpawn: { not: null } },
          { spawnStartTime: { lte: new Date() } },
          { spawnEndTime: { gte: new Date() } }
        ]
      }
    });
    
    // 計算距離並過濾
    return allSpawns.filter(spawn => {
      const distance = this.calculateDistance(
        latitude, 
        longitude, 
        spawn.latitude, 
        spawn.longitude
      );
      return distance <= radius;
    }).map(spawn => ({
      ...spawn,
      availableSpirits: JSON.parse(spawn.availableSpirits),
      activeSpawn: spawn.activeSpawn ? JSON.parse(spawn.activeSpawn) : null,
      distance: this.calculateDistance(latitude, longitude, spawn.latitude, spawn.longitude)
    }));
  }
  
  // 獲取附近的熱點
  async getNearbyHotspots(
    latitude: number, 
    longitude: number, 
    radius: number = 1000
  ) {
    const hotspots = await prisma.hotspot.findMany({
      where: { isActive: true }
    });
    
    return hotspots.filter(hotspot => {
      const distance = this.calculateDistance(
        latitude, 
        longitude, 
        hotspot.latitude, 
        hotspot.longitude
      );
      return distance <= radius;
    }).map(hotspot => ({
      ...hotspot,
      spawnTypes: JSON.parse(hotspot.spawnTypes),
      peakHours: JSON.parse(hotspot.peakHours),
      distance: this.calculateDistance(latitude, longitude, hotspot.latitude, hotspot.longitude)
    }));
  }
  
  // 造訪地點並尋找精靈
  async visitLocation(
    userId: string, 
    locationId: string, 
    latitude: number, 
    longitude: number
  ) {
    const location = await prisma.locationSpawn.findUnique({
      where: { id: locationId }
    });
    
    if (!location) {
      throw new Error("地點不存在");
    }
    
    // 計算距離
    const distance = this.calculateDistance(
      latitude, 
      longitude, 
      location.latitude, 
      location.longitude
    );
    
    // 檢查是否在範圍內
    if (distance > location.radius) {
      throw new Error(`距離太遠，請靠近到 ${location.radius} 米範圍內`);
    }
    
    // 檢查冷卻時間
    const lastVisit = await prisma.locationVisit.findFirst({
      where: {
        userId,
        locationId,
        visitedAt: {
          gte: new Date(Date.now() - location.cooldownHours * 60 * 60 * 1000)
        }
      },
      orderBy: { visitedAt: "desc" }
    });
    
    if (lastVisit) {
      const hoursLeft = location.cooldownHours - 
        Math.floor((Date.now() - lastVisit.visitedAt.getTime()) / (60 * 60 * 1000));
      throw new Error(`地點冷卻中，請等待 ${hoursLeft} 小時`);
    }
    
    // 檢查是否有活躍的精靈生成
    let spiritFound = false;
    let foundSpirit = null;
    let spiritId = null;
    
    if (location.activeSpawn) {
      const activeSpawn = JSON.parse(location.activeSpawn);
      const spawnChance = location.spawnRate * (Math.random() * 0.3 + 0.85);
      
      if (Math.random() < spawnChance) {
        spiritFound = true;
        
        // 從可用精靈中隨機選擇
        const availableSpirits = JSON.parse(location.availableSpirits);
        const selectedSpirit = availableSpirits[
          Math.floor(Math.random() * availableSpirits.length)
        ];
        
        // 創建精靈
        const spirit = await prisma.spirit.create({
          data: {
            userId,
            name: selectedSpirit.name,
            species: selectedSpirit.species,
            element: selectedSpirit.element,
            level: 1,
            experience: 0,
            stage: "HATCHLING",
            isActive: false,
            source: "AR_CAPTURE"
          }
        });
        
        spiritId = spirit.id;
        foundSpirit = spirit;
        
        // 清空當前生成
        await prisma.locationSpawn.update({
          where: { id: locationId },
          data: { activeSpawn: null }
        });
      }
    }
    
    // 記錄造訪
    const visit = await prisma.locationVisit.create({
      data: {
        userId,
        locationId,
        distance,
        spiritFound,
        spiritId
      },
      include: {
        spirit: true,
        location: true
      }
    });
    
    // 更新地點統計
    await prisma.locationSpawn.update({
      where: { id: locationId },
      data: {
        totalVisits: { increment: 1 },
        totalSpawns: spiritFound ? { increment: 1 } : undefined,
        lastSpawnTime: spiritFound ? new Date() : undefined
      }
    });
    
    return {
      visit,
      spiritFound,
      foundSpirit: spiritFound ? foundSpirit : null,
      cooldownRemaining: cooldownHours > 0 ? cooldownHours : 0
    };
  }
  
  // AR 捕捉精靈
  async captureSpiritAR(
    userId: string,
    spiritId: string,
    locationId: string,
    latitude: number,
    longitude: number,
    arData: any,
    captureTime: number,
    accuracy: number
  ) {
    const spirit = await prisma.spirit.findUnique({
      where: { id: spiritId, userId }
    });
    
    if (!spirit) {
      throw new Error("精靈不存在或不屬於您");
    }
    
    const location = await prisma.locationSpawn.findUnique({
      where: { id: locationId }
    });
    
    if (!location) {
      throw new Error("地點不存在");
    }
    
    // 計算距離
    const distance = this.calculateDistance(
      latitude,
      longitude,
      location.latitude,
      location.longitude
    );
    
    if (distance > location.radius) {
      throw new Error("距離太遠，無法進行 AR 捕捉");
    }
    
    // 計算獎勵
    const xpEarned = this.calculateARCaptureXP(captureTime, accuracy, location.rarity);
    const itemsFound = this.generateARCaptureItems(accuracy);
    
    // 記錄 AR 捕捉
    const capture = await prisma.ARCapture.create({
      data: {
        userId,
        spiritId,
        locationId,
        latitude,
        longitude,
        arData: JSON.stringify(arData),
        captureTime,
        accuracy,
        xpEarned,
        itemsFound: JSON.stringify(itemsFound)
      },
      include: {
        spirit: true,
        location: true
      }
    });
    
    // 更新精靈經驗
    await prisma.spirit.update({
      where: { id: spiritId },
      data: { experience: { increment: xpEarned } }
    });
    
    // 給予道具
    for (const item of itemsFound) {
      const existingItem = await prisma.item.findFirst({ 
        where: { name: item.name } 
      });
      
      if (existingItem) {
        await prisma.userItem.upsert({
          where: { userId_itemId: { userId, itemId: existingItem.id } },
          create: { userId, itemId: existingItem.id, quantity: item.amount },
          update: { quantity: { increment: item.amount } }
        });
      }
    }
    
    return {
      capture,
      xpEarned,
      itemsFound,
      levelUp: await this.checkSpiritLevelUp(spiritId)
    };
  }
  
  // 計算 AR 捕捉經驗值
  private calculateARCaptureXP(
    captureTime: number, 
    accuracy: number, 
    rarity: string
  ): number {
    const rarityMultiplier = {
      COMMON: 1,
      UNCOMMON: 1.5,
      RARE: 2,
      EPIC: 3,
      LEGENDARY: 5
    };
    
    const baseXP = 100;
    const timeBonus = Math.max(0, 30 - captureTime) * 2;
    const accuracyBonus = accuracy * 50;
    
    return Math.floor(
      (baseXP + timeBonus + accuracyBonus) * (rarityMultiplier[rarity] || 1)
    );
  }
  
  // 生成 AR 捕捉道具
  private generateARCaptureItems(accuracy: number): Array<{name: string, amount: number}> {
    const items = [];
    
    items.push({ name: "經驗糖果", amount: 1 });
    
    if (accuracy >= 0.8) {
      items.push({ name: "糖裹零食", amount: 1 });
    }
    
    if (accuracy >= 0.9) {
      items.push({ name: "月光石", amount: 1 });
    }
    
    if (accuracy >= 0.95) {
      items.push({ name: "星辰石", amount: 1 });
    }
    
    return items;
  }
  
  // 檢查精靈升級
  private async checkSpiritLevelUp(spiritId: string) {
    const spirit = await prisma.spirit.findUnique({
      where: { id: spiritId }
    });
    
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
      
      return {
        success: true,
        newLevel,
        previousLevel: spirit.level
      };
    }
    
    return null;
  }
  
  // 計算兩個坐標點之間的距離（米）
  private calculateDistance(
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): number {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
  }
  
  // 獲取推薦的探索路線
  async getExplorationRoute(
    userId: string, 
    latitude: number, 
    longitude: number, 
    radius: number = 2000
  ) {
    const hotspots = await this.getNearbyHotspots(latitude, longitude, radius);
    const spawns = await this.getNearbySpawns(latitude, longitude, radius);
    
    // 按熱門程度排序
    const sortedHotspots = hotspots.sort((a, b) => b.popularity - a.popularity);
    
    // 生成探索路線
    const route = [];
    let currentLat = latitude;
    let currentLon = longitude;
    
    for (const hotspot of sortedHotspots.slice(0, 5)) {
      const distance = this.calculateDistance(
        currentLat, 
        currentLon, 
        hotspot.latitude, 
        hotspot.longitude
      );
      
      route.push({
        hotspot,
        distanceFromCurrent: distance,
        estimatedTime: Math.floor(distance / 80),
        nearbySpawns: spawns.filter(spawn => 
          this.calculateDistance(
            hotspot.latitude, 
            hotspot.longitude, 
            spawn.latitude, 
            spawn.longitude
          ) <= 300
        ).length
      });
      
      currentLat = hotspot.latitude;
      currentLon = hotspot.longitude;
    }
    
    return {
      startingPoint: { latitude, longitude },
      totalHotspots: route.length,
      totalDistance: route.reduce((sum, point) => sum + point.distanceFromCurrent, 0),
      estimatedTime: route.reduce((sum, point) => sum + point.estimatedTime, 0),
      route
    };
  }
  
  // 生成新的精靈生成
  async generateNewSpawns() {
    const hotspots = await prisma.hotspot.findMany({
      where: { isActive: true }
    });
    
    const generatedSpawns = [];
    
    for (const hotspot of hotspots) {
      // 檢查高峰時段
      const peakHours = JSON.parse(hotspot.peakHours);
      const currentHour = new Date().getHours();
      const isPeakHour = peakHours.includes(currentHour);
      
      // 計算生成機率
      let spawnChance = 0.3;
      if (isPeakHour) spawnChance *= 1.5;
      spawnChance *= hotspot.bonusRate;
      
      if (Math.random() < spawnChance) {
        const spawnTypes = JSON.parse(hotspot.spawnTypes);
        const selectedType = spawnTypes[Math.floor(Math.random() * spawnTypes.length)];
        
        // 根據熱點類型選擇精靈
        const availableSpirits = this.getSpiritsByLocationType(hotspot.type);
        
        // 創建生成點
        const spawn = await prisma.locationSpawn.create({
          data: {
            latitude: hotspot.latitude + (Math.random() * 0.002 - 0.001),
            longitude: hotspot.longitude + (Math.random() * 0.002 - 0.001),
            name: `${hotspot.name} - ${selectedType} 生成點`,
            type: selectedType,
            rarity: this.getRarityByHotspotPopularity(hotspot.popularity),
            spawnRate: 0.5 + (Math.random() * 0.3),
            radius: 100,
            availableSpirits: JSON.stringify(availableSpirits),
            activeSpawn: JSON.stringify(
              availableSpirits[Math.floor(Math.random() * availableSpirits.length)]
            ),
            spawnStartTime: new Date(),
            spawnEndTime: new Date(Date.now() + 6 * 60 * 60 * 1000),
            cooldownHours: 24
          }
        });
        
        generatedSpawns.push(spawn);
      }
    }
    
    return generatedSpawns;
  }
  
  // 根據地點類型獲取精靈
  private getSpiritsByLocationType(locationType: string): Array<any> {
    const spiritsByType = {
      SHOPPING: [
        { name: "閃亮寶石獸", species: "Crystal", element: "✨" },
        { name: "金錢鼠", species: "Gold", element: "💰" },
        { name: "時尚貓", species: "Style", element: "👗" }
      ],
      PARK: [
        { name: "森林精靈", species: "Forest", element: "🌿" },
        { name: "花仙子", species: "Flower", element: "🌸" },
        { name: "陽光鳥", species: "Sun", element: "☀️" }
      ],
      STATION: [
        { name: "速度狐狸", species: "Speed", element: "⚡" },
        { name: "鋼鐵守衛", species: "Steel", element: "🔩" },
        { name: "旅行蛙", species: "Travel", element: "🎒" }
      ],
      TOURIST: [
        { name: "古蹟守護者", species: "Ancient", element: "🏛️" },
        { name: "文化精靈", species: "Culture", element: "🎭" },
        { name: "紀念品獸", species: "Souvenir", element: "🎁" }
      ],
      CAMPUS: [
        { name: "智慧貓頭鷹", species: "Wisdom", element: "📚" },
        { name: "創意精靈", species: "Creative", element: "🎨" },
        { name: "活力兔子", species: "Energy", element: "🏃" }
      ]
    };
    
    return spiritsByType[locationType] || [
      { name: "普通精靈", species: "Normal", element: "⭐" }
    ];
  }
  
  // 根據熱點熱門程度獲取稀有度
  private getRarityByHotspotPopularity(popularity: number): string {
    if (popularity >= 9) return "LEGENDARY";
    if (popularity >= 7) return "EPIC";
    if (popularity >= 5) return "RARE";
    if (popularity >= 3) return "UNCOMMON";
    return "COMMON";
  }
  
  // 獲取玩家探索統計
  async getPlayerExplorationStats(userId: string) {
    const visits = await prisma.locationVisit.findMany({
      where: { userId },
      include: { location: true, spirit: true }
    });
    
    const captures = await prisma.ARCapture.findMany({
      where: { userId },
      include: { location: true, spirit: true }
    });
    
    const uniqueLocations = [...new Set(visits.map(v => v.locationId))];
    const spiritsFound = visits.filter(v => v.spiritFound).length;
    
    return {
      totalVisits: visits.length,
      uniqueLocations: uniqueLocations.length,
      spiritsFound,
      totalCaptures: captures.length,
      totalXPEarned: captures.reduce((sum, c) => sum + c.xpEarned, 0),
      recentVisits: visits.slice(0, 10),
      recentCaptures: captures.slice(0, 10)
    };
  }
}

export const arLocationService = new ARLocationService();