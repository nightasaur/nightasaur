# 🦖 Nightasaur - 智慧精靈遊戲平台

## 🎯 項目概述

Nightasaur 是一個結合益智遊戲、精靈養成、AR 探索和多語言設定的智慧遊戲平台。

## ✨ 核心功能

### 🧩 益智升級系統
- 4 種益智類型：記憶、邏輯、數學、拼圖
- 5 種難度等級：初級到專家
- 智能解鎖機制和獎勵系統

### 👥 隨從小隊系統
- 最多 4 隻精靈的小隊管理
- 主精靈即時切換（外觀/種族）
- 4 種訓練類型：戰鬥、智力、敏捷、防御
- 小隊協同加成機制

### 🗺️ AR 位置探索系統
- Pokémon GO 風格的 AR 捕捉機制
- Google Maps 地理位置整合
- 前往人潮聚集處獲取精靈小隊成員
- 真實世界探索和獎勵系統

### 🌍 多語言設定系統
- 支援 5 種語言：繁體中文、簡體中文、英文、日文、韓文
- 3 種顯示模式：單一語言、雙語顯示、自動切換
- 主題和字體大小自定義
- 學習輔助功能（拼音、羅馬拼音、英文提示）

## 🚀 快速開始

### 環境要求
- Node.js 18+
- npm 9+

### 啟動步驟

#### 方法 1：使用 PowerShell（推薦）
```powershell
cd C:\Nightasaur\apps\backend
.\run.ps1
```

#### 方法 2：使用批處理文件
```cmd
cd C:\Nightasaur\apps\backend
run.bat
```

#### 方法 3：手動啟動
```bash
# 安裝依賴
npm install

# 設定資料庫
npx prisma migrate deploy
npx prisma generate

# 啟動服務器
npm run dev
```

## 🌐 訪問服務器

服務器啟動後，訪問以下 URL：

- **主界面**: http://localhost:3000
- **健康檢查**: http://localhost:3000/api/health
- **API 文檔**: 查看各系統文檔

### 主要 API 端點
- `GET /api/game` - 遊戲系統
- `GET /api/puzzles` - 益智系統
- `GET /api/squads` - 小隊系統
- `GET /api/ar` - AR 探索系統
- `GET /api/language` - 語言設定系統

## 📊 系統測試

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

## 📁 項目結構

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
│   └── seed*.js         # 各種種子數據
├── test*.js              # 測試腳本
├── setup*.js             # 設定腳本
├── *GUIDE.md            # 系統指南文檔
├── package.json          # 項目配置
├── tsconfig.json         # TypeScript 配置
├── .env                  # 環境變數
├── run.ps1              # PowerShell 啟動腳本
└── run.bat              # 批處理啟動腳本
```

## 📚 系統文檔

### 核心文檔
1. `GAME_SYSTEM_DOCS.md` - 遊戲系統完整文檔
2. `SQUAD_SYSTEM_DOCS.md` - 小隊系統使用指南
3. `AR_LOCATION_SYSTEM_GUIDE.md` - AR 探索系統指南
4. `LANGUAGE_SYSTEM_GUIDE.md` - 語言設定系統指南
5. `LOCALHOST_SETUP_GUIDE.md` - 本地運行指南

### 快速指南
- `SQUAD_QUICK_GUIDE.md` - 小隊系統快速入門
- `RUN_LOCALHOST_GUIDE.md` - 快速啟動指南

## 🔧 開發命令

```bash
# 開發模式（熱重載）
npm run dev

# 生產構建
npm run build

# 啟動生產服務器
npm start

# 數據庫遷移
npm run db:migrate

# 數據庫種子
npm run db:seed

# Prisma Studio（可視化數據庫管理）
npm run db:studio
```

## 🛠️ 技術棧

### 後端
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: SQLite (Prisma ORM)
- **Authentication**: JWT

### 開發工具
- **Package Manager**: npm
- **Build Tool**: TypeScript Compiler
- **Development**: tsx (TypeScript execution)
- **Testing**: 自定義測試腳本

## 🎮 遊戲體驗

### 遊戲循環
1. **對話互動** → 與精靈和其他角色對話
2. **任務完成** → 接受並完成各種任務
3. **益智挑戰** → 解決益智遊戲提升智力
4. **AR 探索** → 前往真實世界捕捉精靈
5. **小隊管理** → 培養和訓練精靈小隊
6. **獎勵獲得** → 獲得經驗、道具和成就

### 特色玩法
- **學習與遊戲結合**：益智遊戲提升認知能力
- **真實世界互動**：AR 探索鼓勵戶外活動
- **多語言學習**：雙語模式輔助語言學習
- **社交元素**：分享探索成果和小隊成就

## 🤝 貢獻指南

1. Fork 項目
2. 創建功能分支
3. 提交更改
4. 推送到分支
5. 創建 Pull Request

## 📄 許可證

MIT License

## 📞 支持

如有問題，請：
1. 查看對應的系統文檔
2. 運行相關測試腳本
3. 檢查控制台錯誤信息

## 🎉 開始冒險！

準備好開始您的 Nightasaur 冒險了嗎？立即啟動服務器，探索這個充滿驚喜的智慧精靈世界！

**啟動命令：**
```bash
cd C:\Nightasaur\apps\backend
.\run.ps1
```

**訪問地址：**
http://localhost:3000

**祝您遊戲愉快！** 🦖✨