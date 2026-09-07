# 🚀 Nightasaur 完整部署指南

## 部署架構

```
┌──────────────────────────────────┐
│          使用者瀏覽器              │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│  🌐 Vercel (Frontend)            │
│  https://nightasaur-web.vercel.app│
├──────────────────────────────────┤
│  🔧 Railway (Backend API)        │
│  https://nightasaur-api.up.railway.app│
├──────────────┬───────────────────┤
│  🗄️ PostgreSQL │ 📦 Redis        │
├──────────────┴───────────────────┤
│  🧠 Railway (AI Engine)          │
│  https://nightasaur-ai.up.railway.app│
├──────────────────────────────────┤
│  🤖 Ollama (on VPS)              │
│  http://your-vps-ip:11434        │
└──────────────────────────────────┘
```

---
## 第一步：部署後端 (Railway)

### 1.1 安裝 Railway CLI
```bash
npm install -g @railway/cli
```

### 1.2 登入 Railway
```bash
railway login
```

### 1.3 初始化專案
```bash
cd c:\Nightasaur
railway init
```
專案名稱: `nightasaur`

### 1.4 創建 PostgreSQL
```bash
railway add postgres
```

### 1.5 創建 Redis
```bash
railway add redis
```

### 1.6 部署後端
```bash
cd c:\Nightasaur\apps\backend
railway up --service nightasaur-backend -d .
```

### 1.7 設定環境變數
```bash
railway env set JWT_SECRET=$(openssl rand -base64 32)
railway env set CORS_ORIGIN=https://nightasaur-web.vercel.app
railway env set AI_ENGINE_URL=https://nightasaur-ai.up.railway.app
railway env set PORT=3002
```

### 1.8 資料庫遷移
```bash
railway run npx prisma migrate deploy
```

### 1.9 驗證後端
```bash
curl https://nightasaur-api.up.railway.app/api/health
```

---

## 第二步：部署前端 (Vercel)

### 2.1 安裝 Vercel CLI
```bash
npm install -g vercel
```

### 2.2 登入 Vercel
```bash
vercel login
```

### 2.3 部署前端
```bash
cd c:\Nightasaur
vercel --prod
```

### 2.4 設定環境變數
在 Vercel 專案設定 → Environment Variables：
```
VITE_API_URL = https://nightasaur-api.up.railway.app
```

### 2.5 驗證前端
訪問: https://nightasaur-web.vercel.app

---

## 第三步：部署 AI Engine (Railway)

### 3.1 部署 AI Engine
```bash
cd c:\Nightasaur\apps\ai-engine
railway up --service nightasaur-ai -d .
```

### 3.2 設定環境變數
```bash
railway env set OLLAMA_URL=http://your-vps-ip:11434
railway env set OLLAMA_MODEL=qwen2.5:3b
railway env set HOST=0.0.0.0
railway env set PORT=8000
```

### 3.3 驗證 AI Engine
```bash
curl https://nightasaur-ai.up.railway.app/api/health
```

---

## 第四步：部署 Ollama (VPS)

### 4.1 VPS 選項
| 提供商 | GPU 支援 |
|--------|----------|
| Digital Ocean GPU Droplets | ✅ NVIDIA A100 |
| Vultr Cloud GPU | ✅ NVIDIA A100 |
| 本地 PC | ✅ 免費 |

### 4.2 安裝 Ollama
```bash
curl -fsSL https://ollama.com/install.sh | sh
ollama serve
ollama pull qwen2.5:3b
```

### 4.3 設定 Railway 連線
```bash
railway env set OLLAMA_URL=http://your-vps-ip:11434
```

---

## 第五步：設定自動部署

創建 `.github/workflows/deploy.yml`:
```yaml
name: Deploy Nightasaur
on:
  push:
    branches: [main]
jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Railway
        uses: bervProject/railway-deploy@v1
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: nightasaur-backend
          directory: apps/backend
```

---

## 費用估算
| 服務 | 方案 | 月費 |
|------|------|------|
| Vercel | Hobby (免費) | $0 |
| Railway | Starter | $0-5 |
| PostgreSQL | Railway 內建 | 包含 |
| Redis | Railway 內建 | 包含 |
| VPS (Ollama) | 最低方案 | $5-20 |
| **總計** | | **$5-25/月** |

---

## 故障排除

### 後端無法連線資料庫
檢查 `DATABASE_URL` 是否正確設定

### 前端顯示空白頁
檢查 Vercel 部署日誌，確認 `VITE_API_URL` 正確

### AI Engine 無法連線 Ollama
確認 VPS 的 Ollama 正在運行，`OLLAMA_URL` 設定正確

### CORS 錯誤
確認後端 `CORS_ORIGIN` 設定為前端網址

---

## 部署完成！🎉

**前端**: https://nightasaur-web.vercel.app
**API**: https://nightasaur-api.up.railway.app
**AI Engine**: https://nightasaur-ai.up.railway.app

**需要幫助？**
- Railway 文檔: https://docs.railway.app
- Vercel 文檔: https://vercel.com/docs
- GitHub Issues: https://github.com/nightasaur/nightasaur/issues