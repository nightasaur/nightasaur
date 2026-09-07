import prisma from "../config/prisma.js";

export class GoogleMapsService {
  // Google Maps API 金鑰
  private apiKey = process.env.GOOGLE_MAPS_API_KEY || "";
  
  // 使用 Google Places API 尋找附近的人潮聚集處
  async findNearbyPlaces(
    latitude: number,
    longitude: number,
    radius: number = 1000,
    type?: string
  ) {
    // 模擬 Google Places API 回應
    const placeTypes = [
      "shopping_mall",
      "park", 
      "train_station",
      "tourist_attraction",
      "university",
      "restaurant",
      "cafe",
      "museum"
    ];
    
    const selectedType = type || placeTypes[Math.floor(Math.random() * placeTypes.length)];
    
    // 模擬生成附近地點
    const mockPlaces = this.generateMockPlaces(latitude, longitude, selectedType);
    
    return {
      results: mockPlaces,
      next_page_token: null
    };
  }
  
  // 模擬生成附近地點
  private generateMockPlaces(
    centerLat: number,
    centerLng: number,
    type: string
  ): Array<any> {
    const places = [];
    const placeCount = 5 + Math.floor(Math.random() * 10);
    
    const typeNames = {
      shopping_mall: ["購物中心", "百貨公司", "商場", "Outlet"],
      park: ["公園", "綠地", "森林公園", "河濱公園"],
      train_station: ["火車站", "捷運站", "高鐵站", "轉運站"],
      tourist_attraction: ["觀光景點", "名勝古蹟", "博物館", "美術館"],
      university: ["大學", "學院", "校園", "教育機構"],
      restaurant: ["餐廳", "美食街", "小吃店", "餐館"],
      cafe: ["咖啡廳", "茶館", "飲料店", "甜品店"],
      museum: ["博物館", "美術館", "展覽館", "文化中心"]
    };
    
    const names = typeNames[type] || ["地點", "場所", "位置"];
    
    for (let i = 0; i < placeCount; i++) {
      const latOffset = (Math.random() - 0.5) * 0.01;
      const lngOffset = (Math.random() - 0.5) * 0.01;
      
      const name = `${names[Math.floor(Math.random() * names.length)]} ${i + 1}`;
      const rating = 3 + Math.random() * 2;
      const userRatingsTotal = Math.floor(Math.random() * 1000);
      
      places.push({
        name,
        geometry: {
          location: {
            lat: centerLat + latOffset,
            lng: centerLng + lngOffset
          }
        },
        rating,
        user_ratings_total: userRatingsTotal,
        types: [type],
        vicinity: `台北市某區`,
        place_id: `mock_place_${Date.now()}_${i}`,
        business_status: "OPERATIONAL"
      });
    }
    
    return places;
  }
  
  // 將 Google Places 轉換為遊戲熱點
  async convertPlacesToHotspots(
    places: Array<any>,
    userId?: string
  ): Promise<Array<any>> {
    const hotspots = [];
    
    for (const place of places) {
      const hotspotType = this.mapPlaceTypeToHotspotType(place.types[0]);
      const popularity = this.calculatePopularity(
        place.rating, 
        place.user_ratings_total
      );
      
      const hotspot = {
        name: place.name,
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        type: hotspotType,
        popularity,
        spawnTypes: JSON.stringify(this.getSpawnTypesForHotspotType(hotspotType)),
        bonusRate: 1 + (popularity * 0.1),
        peakHours: JSON.stringify(this.generatePeakHours(hotspotType)),
        isActive: true
      };
      
      hotspots.push(hotspot);
      
      // 如果提供使用者ID，自動創建生成點
      if (userId) {
        await this.createSpawnFromHotspot(hotspot, userId);
      }
    }
    
    return hotspots;
  }
  
  // 將 Google Place 類型映射到遊戲熱點類型
  private mapPlaceTypeToHotspotType(placeType: string): string {
    const typeMapping = {
      "shopping_mall": "SHOPPING",
      "department_store": "SHOPPING",
      "park": "PARK",
      "train_station": "STATION",
      "subway_station": "STATION",
      "tourist_attraction": "TOURIST",
      "museum": "TOURIST",
      "art_gallery": "TOURIST",
      "university": "CAMPUS",
      "school": "CAMPUS",
      "restaurant": "SHOPPING",
      "cafe": "SHOPPING"
    };
    
    return typeMapping[placeType] || "SHOPPING";
  }
  
  // 計算熱門程度
  private calculatePopularity(rating: number, totalRatings: number): number {
    const ratingScore = (rating - 1) / 4 * 5;
    const ratingCountScore = Math.min(totalRatings / 100, 5);
    
    return Math.min(10, Math.max(1, Math.round(ratingScore + ratingCountScore)));
  }
  
  // 根據熱點類型獲取生成類型
  private getSpawnTypesForHotspotType(hotspotType: string): string[] {
    const spawnTypes = {
      SHOPPING: ["SHOPPING", "LUXURY", "MODERN", "TRENDY"],
      PARK: ["PARK", "NATURE", "RELAX", "SCENIC"],
      STATION: ["STATION", "TRANSPORT", "BUSY", "SPEED"],
      TOURIST: ["TOURIST", "CULTURE", "HISTORIC", "ART"],
      CAMPUS: ["CAMPUS", "EDUCATION", "YOUTH", "CREATIVE"]
    };
    
    return spawnTypes[hotspotType] || ["SHOPPING"];
  }
  
  // 生成高峰時段
  private generatePeakHours(hotspotType: string): number[] {
    const peakHours = {
      SHOPPING: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
      PARK: [6, 7, 8, 9, 16, 17, 18, 19],
      STATION: [7, 8, 9, 17, 18, 19, 20],
      TOURIST: [9, 10, 11, 12, 13, 14, 15, 16],
      CAMPUS: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17]
    };
    
    return peakHours[hotspotType] || [10, 11, 12, 13, 14, 15, 16];
  }
  
  // 從熱點創建生成點
  private async createSpawnFromHotspot(hotspot: any, userId: string) {
    try {
      const availableSpirits = this.getSpiritsByLocationType(hotspot.type);
      
      const spawn = await prisma.locationSpawn.create({
        data: {
          latitude: hotspot.latitude + (Math.random() * 0.002 - 0.001),
          longitude: hotspot.longitude + (Math.random() * 0.002 - 0.001),
          name: `${hotspot.name} - 精靈生成點`,
          type: hotspot.type,
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
      
      return spawn;
    } catch (error) {
      console.error("創建生成點失敗:", error);
      return null;
    }
  }
  
  // 根據地點類型獲取精靈
  private getSpiritsByLocationType(locationType: string): Array<any> {
    const spiritsByType = {
      SHOPPING: [
        { name: "閃亮寶石獸", species: "Crystal", element: "✨" },
        { name: "金錢鼠", species: "Gold", element: "💰" },
        { name: "時尚貓", species: "Style", element: "👗" },
        { name: "購物精靈", species: "Shopping", element: "🛍️" }
      ],
      PARK: [
        { name: "森林精靈", species: "Forest", element: "🌿" },
        { name: "花仙子", species: "Flower", element: "🌸" },
        { name: "陽光鳥", species: "Sun", element: "☀️" },
        { name: "自然守護者", species: "Nature", element: "🌳" }
      ],
      STATION: [
        { name: "速度狐狸", species: "Speed", element: "⚡" },
        { name: "鋼鐵守衛", species: "Steel", element: "🔩" },
        { name: "旅行蛙", species: "Travel", element: "🎒" },
        { name: "時刻表精靈", species: "Schedule", element: "⏰" }
      ],
      TOURIST: [
        { name: "古蹟守護者", species: "Ancient", element: "🏛️" },
        { name: "文化精靈", species: "Culture", element: "🎭" },
        { name: "紀念品獸", species: "Souvenir", element: "🎁" },
        { name: "歷史之靈", species: "History", element: "📜" }
      ],
      CAMPUS: [
        { name: "智慧貓頭鷹", species: "Wisdom", element: "📚" },
        { name: "創意精靈", species: "Creative", element: "🎨" },
        { name: "活力兔子", species: "Energy", element: "🏃" },
        { name: "知識守護者", species: "Knowledge", element: "🧠" }
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
  
  // 獲取導航路線
  async getNavigationRoute(
    originLat: number,
    originLng: number,
    destinationLat: number,
    destinationLng: number,
    mode: string = "walking"
  ) {
    const distance = this.calculateDistance(originLat, originLng, destinationLat, destinationLng);
    const duration = Math.floor(distance / 1.4);
    
    return {
      routes: [{
        legs: [{
          distance: { text: `${Math.round(distance)} 米`, value: distance },
          duration: { text: `${Math.floor(duration / 60)} 分鐘`, value: duration },
          steps: [
            {
              html_instructions: `從起點向目的地前進`,
              distance: { text: `${Math.round(distance)} 米`, value: distance },
              duration: { text: `${Math.floor(duration / 60)} 分鐘`, value: duration }
            }
          ]
        }],
        overview_polyline: { points: "" }
      }]
    };
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
  
  // 自動探索附近地點並創建熱點
  async autoExploreAndCreateHotspots(
    userId: string,
    latitude: number,
    longitude: number,
    radius: number = 2000
  ) {
    // 尋找附近地點
    const placesResult = await this.findNearbyPlaces(latitude, longitude, radius);
    
    // 轉換為遊戲熱點
    const hotspots = await this.convertPlacesToHotspots(
      placesResult.results.slice(0, 10),
      userId
    );
    
    // 保存到資料庫
    const createdHotspots = [];
    for (const hotspot of hotspots) {
      const created = await prisma.hotspot.upsert({
        where: {
          name_latitude_longitude: {
            name: hotspot.name,
            latitude: hotspot.latitude,
            longitude: hotspot.longitude
          }
        },
        update: hotspot,
        create: hotspot
      });
      
      createdHotspots.push(created);
    }
    
    return {
      success: true,
      totalPlaces: placesResult.results.length,
      createdHotspots: createdHotspots.length,
      hotspots: createdHotspots
    };
  }
}

export const googleMapsService = new GoogleMapsService();