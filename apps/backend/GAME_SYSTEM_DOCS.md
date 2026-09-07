# 🦖 夜龍遊戲系統 API 文檔

## 概述
夜龍遊戲系統是一個完整的精靈培育平台，結合了益智升級系統、任務系統、成就系統和 AI 對話功能。

## 基礎資訊
- **Base URL**: `http://localhost:3000/api`
- **認證**: 所有 API 都需要 Bearer Token（除了健康檢查）

## API 端點

### 遊戲邏輯系統

#### 1. 執行遊戲循環
```
POST /api/game-logic/cycle
```

**請求體**:
```json
{
  "spiritId": "string",
  "action": "CHAT|COMPLETE_QUEST|SOLVE_PUZZLE"
}
```

**回應**:
```json
{
  "dialogue": {
    "conversationId": "string",
    "xpGained": 10
  },
  "quests": [
    {
      "questId": "string",
      "title": "string",
      "progress": 1,
      "completed": false
    }
  ],
  "puzzle": {
    "puzzleId": "string",
    "title": "string",
    "description": "string",
    "difficulty": "EASY|MEDIUM|HARD|EXPERT",
    "type": "PUZZLE|MEMORY|LOGIC|MATH",
    "reward": {
      "xp": 50,
      "items": ["string"]
    }
  },
  "rewards": [
    {
      "type": "ACHIEVEMENT|LEVEL_UP|TRAINER_LEVEL_UP",
      "name": "string",
      "description": "string",
      "reward": { "xp": 100, "items": ["string"] }
    }
  ]
}
```

#### 2. 獲取遊戲概覽
```
GET /api/game-logic/overview
```

**回應**:
```json
{
  "user": {
    "id": "string",
    "username": "string",
    "trainerLevel": 1,
    "trainerXp": 0,
    "gems": 0,
    "coins": 0
  },
  "stats": {
    "totalSpirits": 1,
    "totalConversations": 0,
    "totalPuzzlesCompleted": 0,
    "totalQuestsCompleted": 0,
    "dailyStreak": 1
  },
  "activeSpirit": {
    "id": "string",
    "name": "string",
    "species": "string",
    "element": "string",
    "level": 1,
    "experience": 0,
    "stage": "HATCHLING"
  },
  "quests": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "type": "DAILY|WEEKLY|ACHIEVEMENT",
      "reward": { "xp": 100, "items": ["string"] },
      "progress": 0,
      "required": 5,
      "completed": false
    }
  ],
  "dailyPuzzle": {
    "id": "string",
    "title": "string",
    "description": "string",
    "difficulty": "MEDIUM",
    "type": "MEMORY",
    "puzzleData": {},
    "streakBonus": 1
  },
  "notifications": [
    {
      "type": "QUEST_EXPIRING|NEW_PUZZLE",
      "message": "string",
      "data": { "questId": "string" }
    }
  ]
}
```

#### 3. 快速開始遊戲
```
POST /api/game-logic/quick-start
```

**回應**:
```json
{
  "success": true,
  "spirit": {
    "id": "string",
    "name": "string",
    "species": "string"
  },
  "results": {
    // 同遊戲循環回應
  }
}
```

### 益智升級系統

#### 1. 獲取可用的益智關卡
```
GET /api/puzzles/spirits/:spiritId/puzzles
```

**回應**:
```json
{
  "puzzles": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "difficulty": "EASY|MEDIUM|HARD|EXPERT",
      "type": "PUZZLE|MEMORY|LOGIC|MATH",
      "puzzleData": {},
      "unlockLevel": 1,
      "timeLimit": 60,
      "progress": {
        "attempts": 0,
        "completed": false,
        "bestTime": null,
        "score": 0,
        "lastAttempt": null
      }
    }
  ]
}
```

#### 2. 獲取每日益智
```
GET /api/puzzles/daily
```

**回應**:
```json
{
  "dailyPuzzle": {
    "id": "string",
    "title": "string",
    "description": "string",
    "difficulty": "MEDIUM",
    "type": "MEMORY",
    "puzzleData": {},
    "streakBonus": 1
  }
}
```

#### 3. 嘗試解決益智
```
POST /api/puzzles/spirits/:spiritId/puzzles/:puzzleId/attempt
```

**請求體**:
```json
{
  "solution": {},
  "timeSpent": 30
}
```

**回應**:
```json
{
  "success": true,
  "score": 120,
  "reward": [
    { "type": "XP", "amount": 50 },
    { "type": "ITEM", "name": "經驗糖果", "amount": 1 }
  ],
  "progress": {
    "attempts": 1,
    "completed": true,
    "bestTime": 30,
    "score": 120
  }
}
```

#### 4. 獲取精靈升級狀態
```
GET /api/puzzles/spirits/:spiritId/upgrades
```

**回應**:
```json
{
  "upgrades": [
    {
      "type": "INTELLIGENCE|CREATIVITY|LOGIC|MEMORY",
      "level": 1,
      "xp": 50,
      "xpForNextLevel": 100,
      "unlocked": true,
      "unlockedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 遊戲系統

#### 1. 獲取任務
```
GET /api/game/quests
```

**回應**:
```json
{
  "quests": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "type": "DAILY|WEEKLY|ACHIEVEMENT",
      "reward": { "xp": 100, "items": ["string"] },
      "progress": 0,
      "required": 5,
      "completed": false
    }
  ]
}
```

#### 2. 追蹤遊戲動作
```
POST /api/game/track
```

**請求體**:
```json
{
  "action": "CHAT|COMPLETE_QUEST|SOLVE_PUZZLE",
  "amount": 1
}
```

**回應**:
```json
{
  "completedQuests": [
    {
      "questId": "string",
      "title": "string",
      "reward": { "xp": 100, "items": ["string"] }
    }
  ]
}
```

## 遊戲機制

### 精靈升級系統
1. **經驗獲取**:
   - 對話: 10 XP
   - 完成益智: 50-300 XP
   - 完成任務: 100-500 XP

2. **進化階段**:
   - 等級 5: HATCHLING → JUVENILE
   - 等級 10: JUVENILE → ADULT
   - 等級 20: ADULT → ULTIMATE
   - 等級 50: ULTIMATE → LEGENDARY

### 益智升級系統
1. **能力類型**:
   - **智力**: 解謎遊戲提升
   - **創造力**: 數學遊戲提升
   - **邏輯**: 邏輯推理遊戲提升
   - **記憶**: 記憶配對遊戲提升

2. **分數計算**:
   ```
   基礎分數 = 100 × 難度倍率
   時間獎勵 = (時間限制 - 花費時間) × 10
   總分數 = 基礎分數 + 時間獎勵
   ```

3. **難度倍率**:
   - EASY: 1x
   - MEDIUM: 2x
   - HARD: 3x
   - EXPERT: 5x

### 每日挑戰
1. **每日益智**: 每天一個隨機中等難度關卡
2. **連續獎勵**: 連續完成每日益智獲得額外獎勵
3. **排行榜**: 全球玩家分數排名

## 錯誤碼
- `400`: 請求參數錯誤
- `401`: 未授權
- `403`: 權限不足
- `404`: 資源不存在
- `500`: 伺服器內部錯誤

## 快速開始

### 1. 安裝與設定
```bash
# 安裝依賴
npm install

# 生成 Prisma 客戶端
npx prisma generate

# 執行資料庫遷移
npx prisma migrate deploy

# 種子遊戲數據
node prisma/seedGame.js
node prisma/seedPuzzles.js
```

### 2. 測試系統
```bash
node testGameSystem.js
```

### 3. 啟動伺服器
```bash
npm run dev
```

### 4. 使用 API
```bash
# 健康檢查
curl http://localhost:3000/api/health

# 獲取遊戲概覽 (需要認證)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/game-logic/overview

# 執行遊戲循環
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"spiritId":"SPIRIT_ID","action":"CHAT"}' \
  http://localhost:3000/api/game-logic/cycle
```

## 開發指南

### 添加新的益智關卡
1. 在 `prisma/seedPuzzles.ts` 中添加新的關卡數據
2. 執行 `node prisma/seedPuzzles.js` 更新資料庫

### 添加新的任務
1. 在 `prisma/seedGame.ts` 中添加新的任務數據
2. 執行 `node prisma/seedGame.js` 更新資料庫

### 擴展遊戲邏輯
1. 修改 `src/services/gameLogic.ts` 中的遊戲循環邏輯
2. 添加新的成就檢查邏輯

## 系統架構
```
┌─────────────────────────────────────┐
│          前端介面 (React)           │
├─────────────────────────────────────┤
│          遊戲邏輯控制器             │
│  • 遊戲循環執行                    │
│  • 成就檢查                        │
│  • 升級系統                        │
├─────────────────────────────────────┤
│          服務層                    │
│  • 益智服務 (puzzle.ts)            │
│  • 遊戲服務 (game.ts)              │
│  • AI 對話服務 (ai.ts)             │
│  • 精靈服務 (spirit.ts)            │
├─────────────────────────────────────┤
│          資料存取層                │
│  • Prisma ORM                      │
│  • PostgreSQL 資料庫               │
└─────────────────────────────────────┘
```

## 版本歷史
- **v1.0.0** (2024-01-01): 初始版本
  - 精靈培育系統
  - 益智升級系統
  - 任務與成就系統
  - 每日挑戰與排行榜