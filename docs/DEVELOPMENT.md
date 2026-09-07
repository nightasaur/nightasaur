# 🔧 Nightasaur 開發指南

> 版本：1.0.0 | 更新日期：2026-09-07

## 目錄

1. [環境需求](#環境需求)
2. [專案結構](#專案結構)
3. [快速開始](#快速開始)
4. [開發工作流程](#開發工作流程)
5. [程式碼規範](#程式碼規範)
6. [測試](#測試)
7. [常見問題](#常見問題)

---

## 環境需求

| 工具 | 最低版本 | 用途 |
|------|---------|------|
| Node.js | ≥ 20.0.0 | 後端 + 前端 |
| Python | ≥ 3.11 | AI Engine |
| PostgreSQL | ≥ 14 | 資料庫 |
| npm | ≥ 10 | 套件管理 |
| Git | ≥ 2.40 | 版本控制 |
| Ollama | 最新 | 本地 LLM（可選） |
| ComfyUI | 最新 | AI 生圖（可選） |

### 推薦硬體
- **RAM**: ≥ 16GB
- **GPU**: NVIDIA GTX 3070+ (8GB+ VRAM) — 用於 ComfyUI
- **儲存**: ≥ 20GB 可用空間

---

## 專案結構

```
nightasaur/
├── apps/
│   ├── backend/              # Node.js + Express + Prisma
│   │   ├── prisma/           # Schema + Migrations
│   │   ├── src/
│   │   │   ├── controllers/  # 路由控制器
│   │   │   ├── routes/       # API 路由定義
│   │   │   ├── services/     # 業務邏輯
│   │   │   ├── jobs/         # 排程任務
│   │   │   └── middleware/   # 中間件
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── web/                  # React + Vite + Tailwind
│   │   ├── src/
│   │   │   ├── pages/        # 頁面元件（10 頁）
│   │   │   ├── components/   # 共用元件
│   │   │   ├── api/          # API 客戶端
│   │   │   ├── contexts/     # Context Provider
│   │   │   ├── hooks/        # 自訂 Hooks
│   │   │   └── styles/       # 樣式
│   │   ├── index.html
│   │   └── vite.config.ts
│   │
│   ├── ai-engine/            # Python + FastAPI
│   │   ├── routers/          # API 路由
│   │   ├── services/         # LLM、ComfyUI 服務
│   │   ├── training/         # LoRA 訓練腳本
│   │   ├── workflows/        # ComfyUI 工作流
│   │   ├── main.py
│   │   └── config.py
│   │
│   └── mobile/               # React Native + Expo
│       └── src/screens/      # 6 個螢幕
│
├── packages/shared/          # 共用工具
---

## 快速開始

### 一次性設定

```bash
# 1. 複製專案
git clone https://github.com/nightasaur/nightasaur.git
cd nightasaur

# 2. 安裝所有依賴
npm install

# 3. 設定環境變數
cp .env.example .env
# 編輯 .env 填入資料庫連線資訊等

# 4. 設定資料庫
npm run db:migrate
npm run db:seed
```

### 啟動開發伺服器

需要開啟三個終端：

**終端 1 — 後端 API：**
```bash
npm run dev:backend
# → http://localhost:3002
```

**終端 2 — 前端：**
```bash
npm run dev:web
# → http://localhost:5173
```

**終端 3 — AI Engine（選擇性）：**
```bash
npm run dev:ai
# → http://localhost:8000
```

**Ollama（選擇性）：**
```bash
ollama serve
ollama pull qwen2.5:3b   # 下載繁體中文模型
```

### 一鍵啟動全部
```bash
npm run dev              # 同時啟動後端 + 前端
```

---

## 開發工作流程

### 分支策略

```
main           # 生產分支
├── develop    # 開發主分支
├── feat/*     # 功能分支 (feat/ai-assistant)
├── fix/*      # 修復分支 (fix/login-error)
└── docs/*     # 文檔分支 (docs/api-docs)
```

### 開發週期

```bash
# 1. 同步最新代碼
git checkout develop
git pull origin develop

# 2. 創建功能分支
git checkout -b feat/your-feature

# 3. 開發並提交
git add .
git commit -m "feat: add new feature"

# 4. 合併回 develop
git checkout develop
git merge feat/your-feature

# 5. 發佈到 main
git checkout main
git merge develop
git tag v1.1.0
git push origin main --tags
```

### 提交訊息格式

採用 Conventional Commits：
```
<type>(<scope>): <description>

類型:
  feat:    新功能
  fix:     Bug 修復
  docs:    文檔更新
  style:   程式碼格式
  refactor:程式碼重構
  test:    測試相關
  chore:   建置/依賴

範例:
  feat(api): add personal AI assistant endpoints
  fix(db): resolve migration conflict
  docs(readme): update deployment guide
```
├── deploy/                   # 部署配置
├── docs/                     # 文檔
├── scripts/                  # 開發腳本
├── docker-compose.yml        # Docker 配置
├── package.json              # Monorepo 根配置
└── README.md
```
---

## 程式碼規範

### TypeScript
- 嚴格模式 (`strict: true`)
- 使用 ESLint + Prettier
- 避免 `any`，盡量使用型別推導

### Python
- PEP 8 規範
- 使用 type hints
- 非同步處理使用 `async/await`

### CSS
- Tailwind CSS 工具類優先
- 自訂樣式放在 `styles/index.css`
- 使用 `glass-card`、`btn-primary` 等共用類

### 命名慣例
| 項目 | 慣例 | 範例 |
|------|------|------|
| 元件 | PascalCase | `SpiritDetail.tsx` |
| 函數 | camelCase | `sendChat()` |
| API 路由 | kebab-case | `/api/social/posts` |
| 資料庫欄位 | snake_case | `created_at` |
| Python 檔案 | snake_case | `assistant_llm.py` |

---

## 測試

### 後端測試
```bash
# 執行所有測試
npm -w apps/backend test

# 執行單個測試
npm -w apps/backend test -- --grep "auth"
```

### 前端測試
```bash
npm -w apps/web test
npm -w apps/web test -- --coverage
```

### API 測試（手動）
```bash
# 健康檢查
curl http://localhost:3002/api/health

# 註冊
curl -X POST http://localhost:3002/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","username":"測試","password":"test1234"}'

# 登入
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@nightasaur.com","password":"demo1234"}'
```

---

## 常見問題

### Q: 啟動後端口被佔用？
修改對應服務的 port 設定：
- 後端：環境變數 `PORT`
- 前端：`vite.config.ts` 中的 `server.port`
- AI Engine：`config.py` 中的 `PORT`

### Q: 資料庫連線失敗？
確認 PostgreSQL 正在運行，且 `.env` 中的 `DATABASE_URL` 正確：
```
DATABASE_URL="postgresql://user:password@localhost:5432/nightasaur"
```

### Q: AI Engine 無法連線 Ollama？
```bash
# 確認 Ollama 是否運行
ollama list

# 如果沒運行
ollama serve
```

### Q: 前端畫面空白？
檢查瀏覽器 Console 的錯誤訊息，通常是 API 路徑問題或 CORS 設定不正確。

### Q: 如何重置資料庫？
```bash
npm run db:migrate
npm run db:seed
```

---

## 相關資源

- [專案 README](../README.md)
- [API 文檔](API.md)
- [部署指南](DEPLOYMENT.md)
- [架構概覽](ARCHITECTURE.md)
- [貢獻指南](../CONTRIBUTING.md)

---