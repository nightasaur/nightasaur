# AR 位置探索系統 - 完整使用指南

## 🎯 系統概述

本系統結合 Pokémon GO 的 AR 捕捉機制與 Google Maps 地理位置服務，讓玩家可以：
- 前往真實世界的人潮聚集處（購物中心、公園、車站等）
- 透過 AR 模式捕捉精靈小隊成員
- 探索城市並建立個人的精靈收集地圖
- 獲得基於地理位置的探索獎勵

## 🗺️ 系統架構

### 核心模型
1. **LocationSpawn** - 精靈生成點
2. **PlayerLocation** - 玩家位置追蹤
3. **LocationVisit** - 地點造訪記錄
4. **ARCapture** - AR 捕捉記錄
5. **Hotspot** - 熱門地點（人潮聚集處）

### 服務層
1. **ARLocationService** - AR 位置核心服務
2. **GoogleMapsService** - Google Maps 整合服務

## 📡 API 端點

### 位置相關
```http
POST /api/ar/location
```
更新玩家位置，並檢查附近的生成點和熱點。

**請求體：**
```json
{
  "latitude": 25.033964,
  "longitude": 121.564468,
  "accuracy": 10,
  "altitude": 50,
  "speed": 1.5,
  "heading": 90
}
```

### 探索相關
```http
GET /api/ar/spawns/nearby?latitude=25.033964&longitude=121.564468&radius=500
```
獲取附近的精靈生成點。

```http
GET /api/ar/hotspots/nearby?latitude=25.033964&longitude=121.564468&radius=1000
```
獲取附近的熱門地點。

### 造訪與捕捉
```http
POST /api/ar/visit
```
造訪地點並尋找精靈。

```http
POST /api/ar/capture
```
使用 AR 模式捕捉精靈。

### 路線規劃
```http
GET /api/ar/route?latitude=25.033964&longitude=121.564468&radius=2000
```
獲取推薦的探索路線。

### 統計數據
```http
GET /api/ar/stats
```
獲取玩家的探索統計數據。

## 🎮 遊戲流程

### 1. 啟動探索
```javascript
// 更新玩家位置
const location = await fetch('/api/ar/location', {
  method: 'POST',
  body: JSON.stringify({
    latitude: 25.033964,
    longitude: 121.564468
  })
});

// 獲取附近熱點
const hotspots = await fetch('/api/ar/hotspots/nearby?latitude=25.033964&longitude=121.564468');
```

### 3. 造訪地點
```javascript
// 到達熱點後造訪
const visitResult = await fetch('/api/ar/visit', {
  method: 'POST',
  body: JSON.stringify({
    locationId: "location-id",
    latitude: 25.033964,
    longitude: 121.564468
  })
});

if (visitResult.spiritFound) {
  console.log("找到精靈！", visitResult.spirit);
}
```

### 4. AR 捕捉
```javascript
// 開啟 AR 模式捕捉精靈
const captureResult = await fetch('/api/ar/capture', {
  method: 'POST',
  body: JSON.stringify({
    spiritId: "spirit-id",
    locationId: "location-id",
    latitude: 25.033964,
    longitude: 121.564468,
    arData: { /* AR 捕捉數據 */ },
    captureTime: 15.5, // 捕捉花費時間（秒）
    accuracy: 0.95 // 捕捉準確度
  })
});

console.log("捕捉成功！獲得經驗值:", captureResult.xpEarned);
```

## 🌟 特色功能

### 1. 智能熱點探索
- 自動識別人潮聚集處（購物中心、公園、車站等）
- 根據地點類型生成對應的精靈
- 熱門程度影響精靈稀有度

### 2. AR 捕捉系統
- 基於準確度的獎勵機制
- 捕捉時間影響經驗值
- 稀有度加成系統

### 3. 探索路線規劃
- 智能路線建議
- 距離和時間估算
- 熱點優先級排序

### 4. 統計與進度
- 探索成就系統
- 地點收集進度
- 精靈捕捉統計

## 🏪 熱點類型與精靈對應

| 熱點類型 | 地點範例 | 對應精靈 | 稀有度加成 |
|---------|---------|---------|-----------|
| SHOPPING | 購物中心、百貨公司 | 閃亮寶石獸、金錢鼠、時尚貓 | 高 |
| PARK | 公園、綠地 | 森林精靈、花仙子、陽光鳥 | 中 |
| STATION | 車站、轉運站 | 速度狐狸、鋼鐵守衛、旅行蛙 | 中 |
| TOURIST | 觀光景點、博物館 | 古蹟守護者、文化精靈、紀念品獸 | 高 |
| CAMPUS | 學校、大學 | 智慧貓頭鷹、創意精靈、活力兔子 | 中 |

## 🎯 獎勵系統

### 經驗值計算
```javascript
經驗值 = (基礎經驗 + 時間獎勵 + 準確度獎勵) × 稀有度倍率
```

### 道具獎勵
- **經驗糖果**：基礎獎勵
- **糖裹零食**：準確度 ≥ 80%
- **月光石**：準確度 ≥ 90%
- **星辰石**：準確度 ≥ 95%

## 🔧 開發設定

### 1. 環境變數
```bash
GOOGLE_MAPS_API_KEY=your_api_key_here
```

### 2. 資料庫設定
```bash
# 運行遷移
npx prisma migrate deploy

# 生成 Prisma 客戶端
npx prisma generate

# 載入種子數據
node prisma/seedHotspots.js
```

## 📱 前端整合範例

### React 組件範例
```jsx
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

const ARExploration = ({ userId }) => {
  const [playerLocation, setPlayerLocation] = useState(null);
  const [nearbyHotspots, setNearbyHotspots] = useState([]);
  
  useEffect(() => {
    // 獲取玩家位置
    navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        updatePlayerLocation(latitude, longitude);
      },
      (error) => console.error('位置獲取失敗:', error),
      { enableHighAccuracy: true }
    );
  }, []);
  
  const updatePlayerLocation = async (latitude, longitude) => {
    const response = await fetch('/api/ar/location', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude, longitude })
    });
    
    const data = await response.json();
    setPlayerLocation(data.location);
    
    // 獲取附近熱點
    const hotspotsResponse = await fetch(
      `/api/ar/hotspots/nearby?latitude=${latitude}&longitude=${longitude}`
    );
    const hotspotsData = await hotspotsResponse.json();
    setNearbyHotspots(hotspotsData.hotspots);
  };
  
  return (
    <div className="ar-exploration">
      <h2>AR 探索模式</h2>
      
      {playerLocation && (
        <MapContainer center={[playerLocation.latitude, playerLocation.longitude]} zoom={15}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          
          {/* 玩家位置 */}
          <Marker position={[playerLocation.latitude, playerLocation.longitude]}>
            <Popup>您的位置</Popup>
          </Marker>
          
          {/* 附近熱點 */}
          {nearbyHotspots.map((hotspot, index) => (
            <Marker key={index} position={[hotspot.latitude, hotspot.longitude]}>
              <Popup>
                <h3>{hotspot.name}</h3>
                <p>類型: {hotspot.type}</p>
                <p>距離: {Math.round(hotspot.distance)} 米</p>
                <button onClick={() => visitHotspot(hotspot.id)}>
                  造訪此熱點
                </button>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}
    </div>
  );
};
```

## 🚀 快速開始

### 步驟 1：安裝依賴
```bash
npm install
```

### 步驟 2：設定資料庫
```bash
npx prisma migrate deploy
npx prisma generate
```

### 步驟 3：載入熱點數據
```bash
node prisma/seedHotspots.js
```

### 步驟 4：啟動服務
```bash
npm run dev
```

### 步驟 5：測試系統
```bash
node testARLocationSystem.js
```

## 📊 系統優點

1. **真實世界互動**：結合地理位置的遊戲體驗
2. **社交探索**：鼓勵玩家外出探索真實世界
3. **健康促進**：步行探索促進身體活動
4. **教育價值**：認識城市地標和歷史
5. **無限擴展**：可持續添加新的熱點和精靈

## 🔮 未來擴展

1. **社群功能**：分享探索路線和捕捉成果
2. **活動系統**：限時地點活動和特殊精靈
3. **交易系統**：精靈和道具交易
4. **成就系統**：探索成就和獎勵
5. **AR 增強**：更豐富的 AR 互動體驗

---

**開始您的 AR 探索之旅吧！** 🦖🗺️✨