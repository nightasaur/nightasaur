import prisma from "../src/config/prisma.js";

// 熱點種子數據（以台北為例）
const HOTSPOTS = [
  {
    name: "台北101購物中心",
    latitude: 25.033964,
    longitude: 121.564468,
    type: "SHOPPING",
    popularity: 9,
    spawnTypes: JSON.stringify(["SHOPPING", "LUXURY", "MODERN"]),
    bonusRate: 1.5,
    peakHours: JSON.stringify([10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]),
    isActive: true
  },
  {
    name: "大安森林公園",
    latitude: 25.029393,
    longitude: 121.536017,
    type: "PARK",
    popularity: 8,
    spawnTypes: JSON.stringify(["PARK", "NATURE", "RELAX"]),
    bonusRate: 1.3,
    peakHours: JSON.stringify([6, 7, 8, 9, 16, 17, 18, 19]),
    isActive: true
  },
  {
    name: "台北車站",
    latitude: 25.047760,
    longitude: 121.517049,
    type: "STATION",
    popularity: 10,
    spawnTypes: JSON.stringify(["STATION", "TRANSPORT", "BUSY"]),
    bonusRate: 1.8,
    peakHours: JSON.stringify([7, 8, 9, 17, 18, 19, 20]),
    isActive: true
  },
  {
    name: "故宮博物院",
    latitude: 25.102419,
    longitude: 121.548454,
    type: "TOURIST",
    popularity: 7,
    spawnTypes: JSON.stringify(["TOURIST", "CULTURE", "HISTORIC"]),
    bonusRate: 1.2,
    peakHours: JSON.stringify([9, 10, 11, 12, 13, 14, 15, 16]),
    isActive: true
  },
  {
    name: "台灣大學",
    latitude: 25.017110,
    longitude: 121.539751,
    type: "CAMPUS",
    popularity: 6,
    spawnTypes: JSON.stringify(["CAMPUS", "EDUCATION", "YOUTH"]),
    bonusRate: 1.1,
    peakHours: JSON.stringify([8, 9, 10, 11, 12, 13, 14, 15, 16, 17]),
    isActive: true
  },
  {
    name: "西門町商圈",
    latitude: 25.042179,
    longitude: 121.506870,
    type: "SHOPPING",
    popularity: 8,
    spawnTypes: JSON.stringify(["SHOPPING", "YOUTH", "TRENDY"]),
    bonusRate: 1.4,
    peakHours: JSON.stringify([14, 15, 16, 17, 18, 19, 20, 21, 22]),
    isActive: true
  },
  {
    name: "陽明山國家公園",
    latitude: 25.182967,
    longitude: 121.560844,
    type: "PARK",
    popularity: 7,
    spawnTypes: JSON.stringify(["PARK", "MOUNTAIN", "SCENIC"]),
    bonusRate: 1.3,
    peakHours: JSON.stringify([6, 7, 8, 9, 15, 16, 17]),
    isActive: true
  },
  {
    name: "松山文創園區",
    latitude: 25.043847,
    longitude: 121.560652,
    type: "TOURIST",
    popularity: 6,
    spawnTypes: JSON.stringify(["TOURIST", "ART", "CREATIVE"]),
    bonusRate: 1.2,
    peakHours: JSON.stringify([10, 11, 12, 13, 14, 15, 16, 17]),
    isActive: true
  }
];

export async function seedHotspots() {
  const hotspotCount = await prisma.hotspot.count();
  
  if (hotspotCount === 0) {
    for (const hotspot of HOTSPOTS) {
      await prisma.hotspot.create({
        data: hotspot
      });
    }
    console.log(`已創建 ${HOTSPOTS.length} 個熱點`);
  } else {
    console.log(`資料庫中已有 ${hotspotCount} 個熱點`);
  }
}

// 直接執行時
if (import.meta.url === `file://${process.argv[1]}`) {
  seedHotspots()
    .then(() => {
      console.log("熱點種子數據創建完成");
      process.exit(0);
    })
    .catch((error) => {
      console.error("創建種子數據時出錯:", error);
      process.exit(1);
    });
}