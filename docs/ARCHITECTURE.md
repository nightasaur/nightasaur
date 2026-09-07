# 🏗️ Nightasaur 系統架構

> 版本：1.0.0 | 更新日期：2026-09-07

## 整體架構

```
┌──────────────────────────────────────────────────────────────┐
│                      使用者瀏覽器                              │
│              React App (Vite) + React Native                 │
└─────┬──────────────────────┬──────────────────────┬──────────┘
      │                      │                      │
      │ HTTP/HTTPS           │ WebSocket            │ HTTP
      ▼                      ▼                      ▼
┌──────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  🌐 前端 Web  │  │  📱 行動端 App   │  │  🔧 後端 API      │
│  React+Vite  │  │  React Native    │  │  Node.js+Express │
│  Tailwind    │  │  Expo            │  │  Prisma ORM      │
│  TypeScript  │  │  TypeScript      │  │  TypeScript      │
│  10 頁面     │  │  6 螢幕          │  │  25+ 端點       │
└──────┬───────┘  └────────┬─────────┘  └────────┬─────────┘
       │                   │                      │
       └───────────────────┴──────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │  🧠 AI Engine          │
              │  Python + FastAPI      │
              │  Async/await           │
              ├───────────┬────────────┤
              │  🤖 Ollama │  🎨 ComfyUI│
              │  Local LLM │  AI 生圖   │
              └───────────┴────────────┘
```

---

## 前端架構 (Web)

### 技術棧
- **框架**: React 18 + TypeScript
- **建置**: Vite 5
- **樣式**: Tailwind CSS 3
- **路由**: React Router v6
- **狀態**: React Context + Hooks
- **HTTP**: Axios

### 頁面路由

| 路徑 | 頁面 | 說明 |
|------|------|------|
| `/` | Home | Landing page |
| `/login` | Login | 登入 |
| `/register` | Register | 註冊（自動生成精靈） |
| `/dashboard` | Dashboard | 精靈概覽 |
| `/spirits` | Spirits | 精靈卡牌列表 |
| `/spirits/new` | CreateSpirit | 孵化精靈 |
| `/spirits/:id` | SpiritDetail | 精靈詳情 + 對話 + 自訂 |
| `/assistant` | Assistant | AI 助手（4 種模式） |
| `/social` | Social | FB/IG 社群 |
| `/settings/api` | APISettings | API 設定 |
| `/settings/language` | LanguageSettings | 語言設定 |
| `/privacy` | Privacy | 隱私政策 |

### 元件樹
```
App
├── LanguageProvider (Context)
└── AppContent
    ├── Navbar
    │   ├── Logo + 連結
    │   ├── LanguageSwitcher
    │   └── 登入/登出按鈕
    └── Routes
        ├── Home (公開)
        ├── Login/Register (公開)
        ├── Dashboard (受保護)
        ├── Spirits (受保護)
        ├── SpiritDetail (受保護)
        ├── Assistant (受保護)
        └── ...
```
---

## 後端架構 (Backend)

### 技術棧
- **運行時**: Node.js 20+
- **框架**: Express 4
- **語言**: TypeScript (嚴格模式)
- **ORM**: Prisma 5
- **資料庫**: PostgreSQL 14+
- **快取**: Redis 7
- **認證**: JWT + bcryptjs

### 服務層
```
src/
├── index.ts              # 入口點
├── routes/
│   ├── auth.ts           # 認證路由
│   ├── spirits.ts        # 精靈路由
│   ├── dialogue.ts       # AI 對話代理
│   ├── social.ts         # 社群路由
│   ├── language.ts       # 語言路由
│   └── generation.ts     # 圖片生成代理
├── controllers/
│   ├── authController.ts
│   ├── spiritController.ts
│   └── ...
├── services/
│   ├── authService.ts    # 認證邏輯
│   ├── spiritService.ts  # 精靈邏輯
│   └── ...
├── jobs/
│   └── imageGenJob.ts    # 排程生圖
└── middleware/
    ├── auth.ts           # JWT 驗證
    └── error.ts          # 錯誤處理
```

### API 代理模式
後端作為前端和 AI Engine 之間的代理：
```
前端 → 後端 API (proxy) → AI Engine (FastAPI)
                     ↓
               Ollama / ComfyUI
```

---

## AI Engine 架構

### 技術棧
- **框架**: FastAPI (Python 3.11+)
- **LLM**: Ollama (qwen2.5:3b)
- **生圖**: ComfyUI (dreamshaper_8)
- **非同步**: httpx + uvicorn

### 服務模組

| 服務 | 職責 | 依賴 |
|------|------|------|
| `LLMService` | 精靈對話、故事生成 | Ollama |
| `AssistantLLMService` | 通用問答、程式碼、翻譯、文件分析 | Ollama |
| `ComfyUIService` | AI 生圖、工作流管理 | ComfyUI |

### 路由
```
/api/
├── dialogue/chat      → LLMService (精靈對話)
├── dialogue/story     → LLMService (故事生成)
├── assistant/chat     → AssistantLLMService (通用問答)
├── assistant/code     → AssistantLLMService (程式碼)
├── assistant/translate → AssistantLLMService (翻譯)
├── assistant/document → AssistantLLMService (文件)
├── generate/image     → ComfyUIService (生圖)
└── health             → 系統狀態
```
---

## 資料庫架構 (PostgreSQL)

### ER 圖（主要模型）

```
User ────has───> Spirit
 │                 │
 │                 ├─── has ───> Evolution
 │                 ├─── has ───> Customization
 │                 └─── has ───> GenerationTask
 │
 ├─── has ───> SocialPost
 ├─── has ───> UserLanguage
 └─── has ───> UserSettings
```

### 主要資料表

**User** — 使用者帳戶
| 欄位 | 類型 | 說明 |
|------|------|------|
| id | UUID | 主鍵 |
| email | String | 電子郵件（唯一）|
| username | String | 使用者名稱 |
| password | String | bcrypt 加密密碼 |
| createdAt | DateTime | 建立時間 |

**Spirit** — 精靈
| 欄位 | 類型 | 說明 |
|------|------|------|
| id | UUID | 主鍵 |
| userId | UUID | 外鍵 → User |
| name | String | 精靈名稱 |
| element | Enum | 屬性 (FIRE/WATER/...) |
| species | String | 種族 |
| stage | Enum | 階段 (EGG/BABY/...) |
| level | Int | 等級 |
| xp | Int | 經驗值 |
| personality | String | 性格 |
| backstory | Text | 背景故事 |
| imageUrl | String | 圖片網址 |

**Evolution** — 進化記錄
| 欄位 | 類型 | 說明 |
|------|------|------|
| id | UUID | 主鍵 |
| spiritId | UUID | 外鍵 → Spirit |
| fromStage | Enum | 進化前 |
| toStage | Enum | 進化後 |
| timestamp | DateTime | 進化時間 |

---

## 資料流程

### 精靈對話流程
```
使用者輸入 → React 前端
  → POST /api/dialogue (後端代理)
    → POST /api/dialogue/chat (AI Engine)
      → LLMService.generate_dialogue()
        → Ollama API /api/chat
          → qwen2.5:3b 模型
  ← 精靈回覆文字
← 顯示在聊天介面
```

### AI 生圖流程
```
使用者孵化精靈
  → 自動建立 GenerationTask
    → 排程器 (每 5 分鐘檢查)
      → imagegen.ts (後端)
        → POST /api/generate/image (AI Engine)
          → ComfyUIService
            → ComfyUI Pipeline
              → dreamshaper_8 模型
  ← 精靈收到圖片
  ← spirit.imageUrl 更新
```

### AI 助手流程
```
使用者輸入問題 → React 前端
  → POST /api/assistant/chat (後端代理)
    → POST /api/assistant/chat (AI Engine)
      → AssistantLLMService.general_chat()
        → Ollama API /api/chat
          → 通用 prompt + 歷史上下文
  ← AI 助手回覆
← 顯示在助手介面 (支援 4 種模式)
```
---

## 安全性架構

### 認證流程
```
1. 使用者登入 → POST /api/auth/login
2. 伺服器驗證密碼 (bcrypt)
3. 產生 JWT Token (24小時有效)
4. 前端儲存 Token 在 localStorage
5. 每次請求透過 Authorization Header 帶入
```

### 權限控制
- **公開**: 註冊、登入、首頁
- **使用者**: 自己的精靈、貼文
- **管理員**: 所有貼文、系統設定

### 資料保護
- 密碼：bcrypt (12 rounds)
- Token：JWT (HS256)
- API：CORS 限定來源
- 資料庫：參數化查詢 (Prisma)

---

## 可擴展性

### 水平擴展
```
負載均衡器
├── Web Server 1 (Vercel Edge)
├── Web Server 2 (Vercel Edge)
└── Web Server N (Vercel Edge)
         │
    API Gateway
         │
    ┌────┴────┐
    │         │
API Server 1  API Server 2
    │         │
    └────┬────┘
         │
    PostgreSQL (Read Replica)
         │
    PostgreSQL (Primary)
```

### 快取策略
| 層級 | 快取 | 時效 |
|------|------|------|
| 前端 | React Query | 5 分鐘 |
| API | Redis | 1 小時 |
| 資料庫 | Prisma 快取 | 依查詢 |

### 隊列系統
- **圖片生成**: Bull Queue + Redis
- **排程檢查**: 每 5 分鐘
- **重試機制**: 失敗 3 次後通知管理員

---

## 監控與日誌

### 監控指標
- API 回應時間 (p50, p95, p99)
- 錯誤率
- 活躍使用者數
- 精靈對話次數
- AI 生圖數量

### 日誌層級
| 層級 | 用途 |
|------|------|
| ERROR | 系統錯誤、例外 |
| WARN | 參數驗證失敗、API 逾時 |
| INFO | 請求記錄、使用者操作 |
| DEBUG | 開發除錯資訊 |

---

## 技術決策記錄

### 為什麼選擇這個技術棧？

| 決策 | 選擇 | 原因 |
|------|------|------|
| 前端框架 | React | 生態系大、社群活躍 |
| 建置工具 | Vite | 開發速度快、HMR 優秀 |
| 樣式方案 | Tailwind | 開發效率高、一致性好 |
| 後端框架 | Express | 輕量、彈性高 |
| ORM | Prisma | TypeScript 一流支援 |
| 資料庫 | PostgreSQL | 穩定、功能完整 |
| AI 框架 | FastAPI | Python 非同步支援佳 |
| LLM | Ollama | 本地部署、隱私保護 |
| 部署前端 | Vercel | 免費、Edge Network |
| 部署後端 | Railway | 免費額度、簡單好用 |

### 為什麼不選？
- **Next.js**: 本案需要獨立後端 API
- **MongoDB**: 關聯式資料更適合精靈系統
- **OpenAI API**: 成本高、無法本地部署

---

## 相關文檔

- [API 文檔](API.md)
- [開發指南](DEVELOPMENT.md)
- [部署指南](DEPLOYMENT.md)
- [貢獻指南](../CONTRIBUTING.md)