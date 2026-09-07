# 🦖 夜龍遊戲系統 - 隨從小隊系統 API 文檔

## 快速指南

### 基礎端點
- `POST /api/squads` - 創建小隊
- `GET /api/squads` - 獲取小隊資訊
- `POST /api/squads/auto-create` - 自動創建小隊

### 成員管理
- `POST /api/squads/members` - 添加精靈
- `DELETE /api/squads/members/:spiritId` - 移除精靈
- `POST /api/squads/switch-active` - 切換主精靈
- `POST /api/squads/quick-switch` - 快速切換

### 訓練系統
- `POST /api/squads/train` - 訓練單隻精靈
- `POST /api/squads/training/daily` - 小隊日常訓練
- `POST /api/squads/challenge/puzzle` - 小隊益智挑戰

### 統計查詢
- `GET /api/squads/stats` - 小隊統計
- `GET /api/squads/full-state` - 完整遊戲狀態

## 核心功能

### 1. 小隊組成
- 每個玩家一個小隊
- 最多4隻精靈
- 隨時切換主精靈外觀

### 2. 訓練類型
- **COMBAT**: 戰鬥訓練
- **INTELLIGENCE**: 智力訓練  
- **AGILITY**: 敏捷訓練
- **DEFENSE**: 防禦訓練

### 3. 協同加成
- 小隊成員越多，加成越高
- 每隻精靈增加10%經驗
- 共同挑戰獲得額外獎勵

## 快速開始

```bash
# 1. 安裝
npm install
npx prisma generate
npx prisma migrate deploy

# 2. 種子數據
node prisma/seedGame.js
node prisma/seedPuzzles.js

# 3. 測試
node testCompleteSystem.js

# 4. 啟動
npm run dev
```

## 使用範例

```javascript
// 自動創建小隊
const squad = await fetch('/api/squads/auto-create', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
});

// 日常訓練
const training = await fetch('/api/squads/training/daily', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
});

// 快速切換精靈
const switchResult = await fetch('/api/squads/quick-switch', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
});
```

## 系統特色
✅ 最多4隻精靈的小隊系統
✅ 主精靈外觀/種族即時切換
✅ 四種訓練類型提升能力
✅ 小隊協同加成系統
✅ 完整遊戲狀態管理
✅ 自動化小隊創建
✅ 快速精靈切換功能