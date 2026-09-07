# 🚀 Nightasaur 遊戲系統 - 本地運行完整指南

## 📋 快速開始

### 方法 1：使用 PowerShell 腳本（推薦）
1. 打開 PowerShell
2. 導航到項目目錄：
   ```powershell
   cd C:\Nightasaur\apps\backend
   ```
3. 運行啟動腳本：
   ```powershell
   .\run.ps1
   ```

### 方法 2：使用批處理文件
1. 打開命令提示符 (cmd)
2. 導航到項目目錄：
   ```
   cd C:\Nightasaur\apps\backend
   ```
3. 運行啟動腳本：
   ```
   run.bat
   ```

### 方法 3：手動步驟
1. 打開終端
2. 安裝依賴：
   ```bash
   npm install
   ```
3. 設定資料庫：
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```
4. 啟動服務器：
   ```bash
   npm run dev
   ```

## 🌐 訪問服務器

服務器啟動後，訪問以下 URL：

### 主要界面
- **主界面**: http://localhost:3000
- **健康檢查**: http://localhost:3000/api/health

### API 端點
- **遊戲系統**: http://localhost:3000/api/game
- **益智系統**: http://localhost:3000/api/puzzles
- **小隊系統**: http://localhost:3000/api/squads
- **AR 探索**: http://localhost:3000/api/ar
- **語言設定**: http://localhost:3000/api/language

## 🛠️ 系統功能測試

### 測試腳本
```bash
# 測試遊戲系統
node testGameSystem.js

# 測試小隊系統
node testSquadSystem.js

# 測試 AR 系統
node testARLocationSystem.js

# 測試語言系統
node testLanguageSystem.js

# 完整系統測試
node testCompleteSystem.js
```

### 數據庫管理
```bash
# 打開 Prisma Studio（可視化數據庫管理）
npx prisma studio

# 運行新的遷移
npx prisma migrate dev

# 生成 Prisma 客戶端
npx prisma generate
```

## 📁 項目結構說明

```
backend/
├── src/                    # 源代碼
│   ├── config/            # 配置文件
│   ├── controllers/       # API 控制器
│   ├── middleware/        # 中間件
│   ├── routes/           # 路由定義
│   ├── services/         # 業務邏輯
│   └── index.ts          # 應用程序入口
├── prisma/               # 數據庫配置
│   ├── schema.prisma     # 數據庫模型
│   ├── seedGame.js       # 遊戲種子數據
│   ├── seedPuzzles.js    # 益智關卡數據
│   ├── seedHotspots.js   # AR 熱點數據
│   └── seedTranslations.js # 語言翻譯數據
├── test*.js              # 各種測試腳本
├── setup*.js             # 各種設定腳本
├── package.json          # 項目配置
├── tsconfig.json         # TypeScript 配置
├── .env                  # 環境變數
├── run.ps1              # PowerShell 啟動腳本
└── run.bat              # 批處理啟動腳本
```

## 🔧 故障排除

### 常見問題 1：Node.js 未安裝
```
❌ 未找到 Node.js
💡 請安裝 Node.js (版本 18+)
```
**解決方案**：
1. 訪問 https://nodejs.org/
2. 下載並安裝 Node.js LTS 版本
3. 重新啟動終端

### 常見問題 2：端口被佔用
```
Error: listen EADDRINUSE: address already in use :::3000
```
**解決方案**：
1. 找到佔用端口的進程：
   ```bash
   netstat -ano | findstr :3000
   ```
2. 結束進程：
   ```bash
   taskkill /PID <進程ID> /F
   ```
3. 重新啟動服務器

### 常見問題 3：數據庫錯誤
```
Prisma error: Database does not exist
```
**解決方案**：
1. 確保在正確的目錄
2. 重新運行數據庫遷移：
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

### 常見問題 4：依賴安裝失敗
```
npm ERR! Cannot find module
```
**解決方案**：
1. 刪除 node_modules 和 package-lock.json：
   ```bash
   rm -rf node_modules package-lock.json
   ```
2. 重新安裝依賴：
   ```bash
   npm install
   ```

## 📚 系統文檔

### 系統指南
- `GAME_SYSTEM_DOCS.md` - 遊戲系統文檔
- `SQUAD_SYSTEM_DOCS.md` - 小隊系統文檔
- `AR_LOCATION_SYSTEM_GUIDE.md` - AR 探索系統指南
- `LANGUAGE_SYSTEM_GUIDE.md` - 語言設定系統指南

### API 文檔
所有 API 端點都有完整的文檔，訪問：
```
http://localhost:3000/api/health
```

## 🎮 開始使用

### 第一步：啟動服務器
```bash
cd C:\Nightasaur\apps\backend
.\run.ps1
```

### 第二步：測試系統
1. 打開瀏覽器訪問：http://localhost:3000
2. 檢查健康狀態：http://localhost:3000/api/health
3. 測試各個 API 端點

### 第三步：開發調試
1. 服務器運行在開發模式，代碼更改會自動重啟
2. 查看控制台輸出以獲取調試信息
3. 使用測試腳本驗證功能

## 📞 支持

如果遇到問題：
1. 檢查控制台錯誤信息
2. 參考對應的系統文檔
3. 運行相關的測試腳本
4. 確保所有依賴已正確安裝

## 🎉 恭喜！

您已成功啟動 Nightasaur 遊戲系統！現在可以：
- 體驗完整的遊戲功能
- 測試各種系統 API
- 開始您的遊戲開發之旅

**開始您的 Nightasaur 冒險吧！** 🦖✨