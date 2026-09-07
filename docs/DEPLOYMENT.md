# 🚢 Nightasaur 部署指南

> 本文件為部署快速參考，完整指南請見 [deploy/DEPLOYMENT_GUIDE.md](../deploy/DEPLOYMENT_GUIDE.md)

## 部署架構

```
使用者瀏覽器 → 🌐 Vercel (Frontend, React)
                    ↓ /api/*
               🔧 Railway (Backend API, Node.js)
                    ↓
               🧠 Railway (AI Engine, Python)
                    ↓
               🤖 VPS (Ollama, Local LLM)
```

## 快速部署

### 前端 → Vercel
```bash
npm install -g vercel
vercel login
cd apps/web && npm install && npx vite build
vercel --prod
```

### 後端 → Railway
```bash
npm install -g @railway/cli
railway login
railway init
railway add postgres
railway add redis
cd apps/backend && railway up --service nightasaur-backend
```

### AI Engine → Railway
```bash
cd apps/ai-engine && railway up --service nightasaur-ai
```

## 環境變數

### 後端
| 變數 | 說明 | 範例 |
|------|------|------|
| `DATABASE_URL` | PostgreSQL 連線 | `postgresql://...` |
| `REDIS_URL` | Redis 連線 | `redis://...` |
| `JWT_SECRET` | JWT 密鑰 | `openssl rand -base64 32` |
| `CORS_ORIGIN` | 允許的前端網址 | `https://nightasaur-web.vercel.app` |

### AI Engine
| 變數 | 說明 | 範例 |
|------|------|------|
| `OLLAMA_URL` | Ollama 服務網址 | `http://your-vps:11434` |
| `OLLAMA_MODEL` | LLM 模型 | `qwen2.5:3b` |

### 前端
| 變數 | 說明 | 範例 |
|------|------|------|
| `VITE_API_URL` | 後端 API 網址 | `https://nightasaur-api.up.railway.app` |

## 費用估算

| 服務 | 方案 | 月費 |
|------|------|------|
| Vercel | Hobby (免費) | $0 |
| Railway | Starter | $0-5 |
| VPS (Ollama) | 最低方案 | $5-20 |
| **總計** | | **$5-25/月** |

## 驗證清單

- [ ] 前端：https://nightasaur-web.vercel.app
- [ ] API：https://nightasaur-api.up.railway.app/api/health
- [ ] AI：https://nightasaur-ai.up.railway.app/api/health
- [ ] 註冊功能正常
- [ ] 登入功能正常
- [ ] 精靈創建正常
- [ ] AI 對話正常

## 相關資源

- [完整部署指南](../deploy/DEPLOYMENT_GUIDE.md)
- [Railway 文檔](https://docs.railway.app)
- [Vercel 文檔](https://vercel.com/docs)