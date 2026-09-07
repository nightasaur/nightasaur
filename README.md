# 🌙 Nightasaur — AI 數位精靈平台

> 每位使用者註冊即可生成一隻專屬 AI 精靈，像數碼寶貝般進化養成、賈維斯般對話陪伴，一鍵分享到 FB/IG/APP。

---

## Phase 3 完成 ✅

| Phase | 項目 | 狀態 |
|-------|------|:--:|
| 1 | 後端 + 資料庫 + Web 後台 | ✅ |
| 2 | AI Engine (Ollama) + FB/IG API | ✅ |
| 3 | ComfyUI + 排程 + LoRA + RN APP | ✅ |

---

## 🏗️ 架構

```
nightasaur/
├── apps/
│   ├── ai-engine/          # Python + FastAPI
│   │   ├── routers/        # generation, dialogue
│   │   ├── services/       # comfyui, llm (Ollama)
│   │   ├── workflows/      # ComfyUI 生圖工作流
│   │   └── training/       # LoRA 訓練腳本
│   ├── backend/            # Node.js + Express + Prisma
│   │   └── src/
│   │       ├── jobs/       # 排程系統 (圖片生成佇列)
│   │       ├── services/   # auth, spirit, ai, social, imagegen
│   │       ├── controllers/
│   │       ├── routes/     # auth, spirits, social, generate
│   │       └── middleware/
│   ├── web/                # React + Vite + Tailwind (8 頁面)
│   └── mobile/             # React Native + Expo (6 螢幕)
├── docs/
│   └── FB-IG-SETUP.md      # FB/IG API 設定指南
├── scripts/
│   └── setup-comfyui.bat   # ComfyUI 一鍵安裝
└── packages/shared/
```

---

## 🚀 快速啟動

### 環境需求

| 工具 | 版本 | 用途 |
|------|------|------|
| Node.js | ≥ 20 | 後端 + 前端 |
| Python | ≥ 3.11 | AI Engine |
| Ollama | 最新 | 本地 LLM |
| GTX 3070+ | 8GB+ VRAM | ComfyUI 生圖 (選用) |

### 啟動

```bash
# 終端 1：AI Engine
cd apps\ai-engine && python main.py
# → http://localhost:8000

# 終端 2：後端
cd apps\backend && npx tsx src\index.ts
# → http://localhost:3000

# 終端 3：前端
cd apps\web && npx vite
# → http://localhost:5173
```

---

## 📡 API 總覽 (25+ 端點)

| 模組 | 路徑 | 說明 |
|------|------|------|
| Auth | `/api/auth/register`, `/login`, `/logout`, `GET /me` | 認證 |
| Spirits | `POST /api/spirits`, `GET /`, `GET /:id`, `POST /:id/evolve` | 精靈 CRUD + 進化 |
| Dialogue | `POST /api/dialogue` | AI 對話 (Ollama) |
| Social | `POST /api/social/posts`, `GET /test/fb`, `GET /test/ig` | FB/IG 發文 + 測試 |
| Generate | `POST /api/generate/spirit/:id`, `POST /process`, `GET /status` | AI 生圖 + 佇列 |
| AI Engine | `POST /api/generate/image`, `POST /api/dialogue/chat`, `GET /api/health` | Python AI 服務 |

---

##  Web 頁面 (10 頁)

| 頁面 | 路徑 | 功能 |
|------|------|------|
| 首頁 | `/` | Landing page + 屬性展示 |
| 註冊 | `/register` | 註冊即生精靈 |
| 登入 | `/login` | JWT 認證 |
| 儀表板 | `/dashboard` | 精靈概覽 |
| 精靈列表 | `/spirits` | 精靈卡牌 |
| 孵化 | `/spirits/new` | 選屬性 + 命名 |
| 精靈詳情 | `/spirits/:id` | 狀態 + 進化 + AI 對話 |
| 社群 | `/social` | FB/IG 發文 |
| API 設定 | `/settings/api` | FB/IG 連線測試 |

---

##  精靈系統

```
Lv.1 蛋 → Lv.5 幼體 → Lv.15 少年體 → Lv.30 成年體 → Lv.60 究極體 → 傳說體

10 種屬性：🔥火 💧水 ✨光 🌑暗 ⭐星 🦊幻 🌙月 🌿自然 ⚡雷 ❄️冰
```

---

## 🎨 AI 生成管線

```
使用者孵化精靈 → 自動建立 GenerationTask
                      ↓
排程器 (每 5 分鐘) → imagegen.ts → AI Engine → ComfyUI
                      ↓
精靈收到圖片 → spirit.imageUrl 更新
```

---

## 🧪 LoRA 訓練

```bash
cd apps\ai-engine\training
pip install Pillow
python train_lora.py
# → 預處理你的 10 張怪獸圖 + 產生標註
# → 依指示安裝 Kohya SS 訓練
# → LoRA 輸出到 ComfyUI/models/loras/
```

---

## 🎮 示範帳號

| 角色 | Email | 密碼 |
|------|-------|------|
| 管理員 | admin@nightasaur.com | admin123! |
| 訓練家 | demo@nightasaur.com | demo1234 |

---

## ️ 下一步 (Phase 4 — 營運上線)

1. ComfyUI 安裝 + dreamshaper_8 模型下載
2. LoRA 訓練 (你的 10 張怪獸圖)
3. FB/IG API 審核 + Token 設定
4. React Native APP 編譯上架
5. Cloudflare 部署 (Pages + Worker)
6. 網域 nightasaur.com 設定

---

**Made with 🌙 by Nightasaur Team | 86 source files | 3 languages (TS + Python + React)**