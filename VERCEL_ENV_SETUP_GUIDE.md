# Nightasaur Vercel 環境變數設定指南

## 概述
本指南說明如何在 Vercel 上部署 Nightasaur 時設定必要的環境變數。

## 必需環境變數

### 資料庫設定
```env
DATABASE_URL="file:./dev.db"  # 本地開發使用 SQLite
# 生產環境建議使用 PostgreSQL:
# DATABASE_URL="postgresql://username:password@host:port/database"
```

### JWT 認證
```env
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"
```

### 伺服器設定
```env
PORT=3000
NODE_ENV="production"
CORS_ORIGIN="https://nightasaur.com"  # 你的域名
```

### 前端環境變數 (Vercel 專用)
```env
NEXT_PUBLIC_API_URL="https://api.nightasaur.com/api"  # 後端 API 網址
NEXT_PUBLIC_SITE_URL="https://nightasaur.com"  # 網站網址
```

### AI 服務 (可選)
```env
AI_ENGINE_URL="http://localhost:8000"  # AI 引擎服務
COMFYUI_URL="http://localhost:8188"    # ComfyUI 服務
OLLAMA_URL="http://localhost:11434"    # Ollama 服務
OPENROUTER_API_KEY=""                  # OpenRouter API 金鑰
```

### 社交媒體 API (可選)
```env
FACEBOOK_APP_ID=""
FACEBOOK_APP_SECRET=""
FACEBOOK_PAGE_ID=""
FACEBOOK_PAGE_ACCESS_TOKEN=""
INSTAGRAM_BUSINESS_ACCOUNT_ID=""
```

## Vercel 設定步驟

### 1. 在 Vercel 控制台設定環境變數
1. 登入 [Vercel Dashboard](https://vercel.com)
2. 選擇你的 Nightasaur 專案
3. 進入 "Settings" > "Environment Variables"
4. 添加上述所有環境變數

### 2. 建議的生產環境設定
```env
# 必需
DATABASE_URL="postgresql://username:password@host:port/nightasaur"
JWT_SECRET="generate-a-strong-random-secret-here"
NODE_ENV="production"
PORT=3000
CORS_ORIGIN="https://nightasaur.com"

# 前端
NEXT_PUBLIC_API_URL="https://api.nightasaur.com/api"
NEXT_PUBLIC_SITE_URL="https://nightasaur.com"

# 可選但建議
OPENROUTER_API_KEY="your-openrouter-api-key"
```

### 3. 資料庫設定
對於生產環境，建議使用：
- **Vercel Postgres** (內建)
- **Supabase** (免費方案)
- **Neon** (PostgreSQL 服務)

設定範例 (Vercel Postgres):
```env
DATABASE_URL="postgresql://default:password@ep-cool-bird-123456.us-east-1.postgres.vercel-storage.com/verceldb"
```

### 4. 安全建議
1. **JWT_SECRET**: 使用強密碼生成器生成至少 32 字元的隨機字串
2. **API 金鑰**: 不要將 API 金鑰提交到版本控制
3. **環境區分**: 為開發、預覽和生產環境設定不同的變數

### 5. 故障排除
如果遇到 API 連接問題：
1. 檢查 `NEXT_PUBLIC_API_URL` 是否正確
2. 確保後端服務器正在運行
3. 檢查 CORS 設定是否允許你的域名
4. 查看 Vercel 日誌中的錯誤訊息

### 6. 本地開發設定
在 `.env.local` 檔案中設定：
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="dev-secret-key"
NODE_ENV="development"
PORT=3002
CORS_ORIGIN="http://localhost:5173"
NEXT_PUBLIC_API_URL="http://localhost:3002/api"
```

## 部署檢查清單
- [ ] 所有必需環境變數已設定
- [ ] 資料庫連接正常
- [ ] CORS 設定正確
- [ ] JWT 密鑰已更新
- [ ] API 端點可訪問
- [ ] 前端正確連接到後端

## 支援
如有問題，請聯絡：
- Email: service@nightasaur.com
- GitHub Issues: https://github.com/nightasaur/nightasaur/issues

---

**最後更新**: 2026-09-12  
**版本**: 1.0.0