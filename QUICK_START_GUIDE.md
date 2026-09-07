# Nightasaur 新系統快速入門指南

## 🚀 快速開始

### 1. 啟動新系統
```bash
# 方法1: 使用批處理文件 (Windows)
start-spirit-system.bat

# 方法2: 使用 PowerShell
.\start-spirit-system.ps1

# 方法3: 手動啟動
cd apps/backend
npm install
node complete-spirit-server.ts
```

### 2. 訪問系統
- 網頁界面: http://localhost:3001
- API 文檔: http://localhost:3001 (查看網頁)
- 健康檢查: http://localhost:3001/api/health

## 📝 命名系統使用示例

### 獲取命名建議
```bash
# 獲取火屬性精靈的命名建議
curl "http://localhost:3001/api/spirit-systems/naming/suggestions?element=FIRE&count=5"

# 使用特定語言和風格
curl "http://localhost:3001/api/spirit-systems/naming/suggestions?element=WATER&language=ja-JP&style=MYTHICAL"
```

### 驗證名稱
```bash
curl -X POST "http://localhost:3001/api/spirit-systems/naming/validate" \
  -H "Content-Type: application/json" \
  -d '{"name": "小烈焰", "userId": "user_123"}'
```

## 🥚 孵化系統使用示例

### 開始孵化
```bash
curl -X POST "http://localhost:3001/api/spirit-systems/hatching/start" \
  -H "Content-Type: application/json" \
  -d '{
    "spiritId": "spirit_123",
    "temperature": 30,
    "humidity": 50
  }'
```

### 與蛋互動
```bash
# 拍打蛋
curl -X POST "http://localhost:3001/api/spirit-systems/hatching/interact" \
  -H "Content-Type: application/json" \
  -d '{
    "spiritId": "spirit_123",
    "interactionType": "TAP",
    "intensity": 5
  }'

# 講故事給蛋聽
curl -X POST "http://localhost:3001/api/spirit-systems/hatching/interact" \
  -H "Content-Type: application/json" \
  -d '{
    "spiritId": "spirit_123",
    "interactionType": "STORY",
    "intensity": 8
  }'
```

### 檢查孵化狀態
```bash
curl "http://localhost:3001/api/spirit-systems/hatching/status/spirit_123"
```

## 🎨 外觀系統 (開發中)

### 生成外觀
```javascript
// 基於動物園動物生成外觀
const appearance = {
  baseAnimal: "獅子",
  category: "MAMMALS",
  element: "FIRE",
  colors: {
    primary: "RED",
    secondary: "ORANGE",
    accent: "GOLD"
  },
  textures: ["FURRY", "SMOOTH"],
  size: {
    height: 1.2,
    weight: 45.5
  }
};
```

## 🔧 開發者指南

### 項目結構
```
apps/backend/
├── src/
│   ├── controllers/     # 控制器層
│   ├── services/       # 業務邏輯層
│   ├── utils/          # 工具和配置
│   ├── routes/         # 路由定義
│   └── middleware/     # 中間件
├── prisma/             # 數據庫ORM
└── complete-spirit-server.ts  # 主服務器
```

### 添加新功能
1. 在 `src/utils/` 創建系統配置
2. 在 `src/services/` 實現業務邏輯
3. 在 `src/controllers/` 創建控制器
4. 在 `src/routes/spiritSystems.ts` 添加路由
5. 更新數據庫模型 (如果需要)

### 測試新功能
```bash
# 運行單元測試
node test-new-systems.js

# 手動測試API
使用 curl 或 Postman 測試API端點
```

## 📊 系統配置

### 環境變量
```bash
PORT=3001                    # 服務器端口
NODE_ENV=development         # 環境模式
DATABASE_URL=file:./dev.db   # 數據庫URL
```

### 自定義配置
1. **命名系統**: 編輯 `src/utils/namingSystem.ts`
2. **孵化系統**: 編輯 `src/utils/hatchingSystem.ts`
3. **外觀系統**: 編輯 `src/utils/appearanceSystem.ts`

## 🐛 故障排除

### 常見問題

#### 1. 端口被佔用
```bash
# 檢查端口使用情況
netstat -ano | findstr :3001

# 殺死佔用進程
taskkill /PID [PID] /F
```

#### 2. 依賴安裝失敗
```bash
# 清除緩存並重新安裝
npm cache clean --force
npm ci
```

#### 3. 數據庫錯誤
```bash
# 重新生成Prisma客戶端
npx prisma generate
npx prisma migrate dev
```

#### 4. TypeScript編譯錯誤
```bash
# 檢查TypeScript配置
npx tsc --noEmit

# 安裝缺失的類型定義
npm install @types/node @types/express --save-dev
```

### 獲取幫助
1. 查看控制台錯誤信息
2. 檢查系統日誌
3. 參考 `SYSTEM_REBUILD_GUIDE.md`
4. 運行測試腳本驗證功能

## 🎯 下一步

### 短期任務
- [ ] 完善外觀系統實現
- [ ] 添加用戶界面
- [ ] 創建管理面板
- [ ] 添加更多測試

### 長期目標
- [ ] 整合AR探索系統
- [ ] 添加社交分享功能
- [ ] 實現基因培育系統
- [ ] 創建移動應用

---

**開始你的 Nightasaur 精靈養成之旅吧！** 🦖✨