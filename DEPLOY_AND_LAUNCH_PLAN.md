# 🚀 Nightasaur 完整上線計劃書：部署 → nightasaur.com → 正式上線

> 版本：1.0.0 | 日期：2026-09-07

---

## 📋 三階段總覽

```
Phase 1: Vercel + Railway 部署      今明兩天完成
         ↓
Phase 2: 搬遷到 nightasaur.com      3-7 天完成
         ↓
Phase 3: 正式上線 + 推廣            第 7 天
```

## 💰 費用快速問答

| 平台 | 用途 | 月費 | 要信用卡？ |
|------|------|------|-----------|
| Vercel | 前端 | **$0** ✅ | ❌ |
| Railway | 後端+資料庫 | **$0** ✅（$5免費額度內） | ✅ 綁卡驗證 |
| nightasaur.com | 域名 | **$9.15/年** ≈ NT$300 | ✅ |
| Ollama VPS | 選配 | $5-20/月（可暫緩） | ✅ |

---

# Phase 1：Vercel + Railway 部署

## 1.1 註冊帳號（10 分鐘）

| 平台 | 網址 | 登入方式 |
|------|------|---------|
| Vercel | https://vercel.com | GitHub 一鍵登入 |
| Railway | https://railway.app | GitHub 一鍵登入 |
---

## 1.2 部署後端到 Railway（15 分鐘）

```bash
# A: 安裝 CLI
npm install -g @railway/cli

# B: 登入
railway login

# C: 初始化專案
cd c:\Nightasaur
railway init
# 專案名稱：nightasaur

# D: 創建資料庫
railway add postgres
railway add redis

# E: 部署後端
cd apps\backend
railway up --service nightasaur-backend -d .

# F: 環境變數
railway env set JWT_SECRET=your-random-key
railway env set CORS_ORIGIN=https://nightasaur-web.vercel.app
railway env set PORT=3002

# G: 資料庫遷移
railway run npx prisma migrate deploy

# H: 驗證
curl https://nightasaur-api.up.railway.app/api/health
```

✅ 得到 API 網址：`https://nightasaur-api.up.railway.app`

---

## 1.3 部署前端到 Vercel（10 分鐘）

```bash
# A: 安裝 CLI
npm install -g vercel

# B: 登入
vercel login

# C: 部署
cd c:\Nightasaur
vercel --prod
```

**D: 設定環境變數**
在 Vercel 專案 → Settings → Environment Variables：
```
VITE_API_URL = https://nightasaur-api.up.railway.app
```

**E: 重新部署**
```bash
vercel --prod
```

✅ 得到前端網址：`https://nightasaur-web.vercel.app`

---

## 1.4 部署 AI Engine（可選，10 分鐘）

```bash
cd c:\Nightasaur\apps\ai-engine
railway up --service nightasaur-ai -d .

railway env set OLLAMA_MODEL=qwen2.5:3b
railway env set HOST=0.0.0.0
railway env set PORT=8000
```

✅ 得到 AI 網址：`https://nightasaur-ai.up.railway.app`

> ⚠️ AI Engine 需要 Ollama（本地或 VPS），可先跳過

---

## 1.5 Phase 1 驗收

| 項目 | 網址 | 狀態 |
|------|------|------|
| 🌐 前端 | https://nightasaur-web.vercel.app | ⬜ |
| 🔧 API | https://nightasaur-api.up.railway.app/api/health | ⬜ |
| ✅ 註冊功能 | 測試註冊 | ⬜ |
| ✅ 登入功能 | 測試登入 | ⬜ |
| ✅ 精靈創建 | 測試孵化 | ⬜ |
---

# Phase 2：搬遷到 nightasaur.com

## 2.1 購買網域（必須先做）

| 推薦 | 註冊商 | 價格/年 |
|------|--------|---------|
| ⭐ | **Cloudflare Registrar** | **$9.15** ≈ NT$300 |
| | GoDaddy | $12-18 |
| | Namecheap | $10-15 |

**購買步驟：**
```
1. 註冊 Cloudflare：https://dash.cloudflare.com
2. 左側 → Registrar → 搜尋 nightasaur.com
3. 加入購物車 → 結帳
4. 填寫註冊資訊
```

---

## 2.2 設定 Cloudflare DNS

| 類型 | 名稱 | 內容 | Proxy |
|------|------|------|-------|
| CNAME | @ | nightasaur-web.vercel.app | ✅ |
| CNAME | www | nightasaur-web.vercel.app | ✅ |
| CNAME | api | nightasaur-api.up.railway.app | ✅ |

---

## 2.3 Vercel 自訂網域

```bash
vercel domains add nightasaur.com
```

或手動：Vercel 專案 → Settings → Domains → 輸入 nightasaur.com

---

## 2.4 Railway 自訂網域

```bash
railway domain add api.nightasaur.com
```

## 2.5 最終架構

```
使用者 → nightasaur.com
              │
         Cloudflare CDN
              │
    ┌─────────┴─────────┐
    ▼                   ▼
nightasaur.com      api.nightasaur.com
    │                   │
    ▼                   ▼
Vercel              Railway
(Frontend)          (Backend + DB)
```

## 2.6 更新環境變數

```bash
railway env set CORS_ORIGIN=https://nightasaur.com
vercel env add VITE_API_URL=https://api.nightasaur.com
```
---

# Phase 3：正式上線時間表

## 🎯 目標時間線

```
Day 1  ─── Phase 1：Vercel + Railway 部署
Day 2-3 ── 購買 nightasaur.com
Day 4-5 ── DNS 生效 + SSL
Day 6  ─── 全面測試
Day 7  ─── 🎉 正式上線！
```

實際日期規劃：

| 日期 | 星期 | 階段 | 要做的事 |
|------|------|------|---------|
| 9/7 | 一 | 📦 Phase 1 | 註冊 Vercel + Railway，部署 |
| 9/8 | 二 | 🌐 Phase 2 | 買 nightasaur.com |
| 9/9 | 三 | 🌐 Phase 2 | 設定 Cloudflare DNS |
| 9/10 | 四 | 🌐 Phase 2 | Vercel/Railway 自訂網域 |
| 9/11 | 五 | 🌐 Phase 2 | DNS 生效，SSL 憑證 |
| 9/12 | 六 | ✅ 測試 | 全面測試，壓力測試 |
| 9/13 | 日 | 🎉 上線 | 正式公開 + 推廣 |

---

## 上線日行程

### 09:00 — 最終測試
- [ ] 註冊 → 登入 → 創建精靈 → 對話
- [ ] AI 助手 → 程式碼 → 翻譯 → 文件
- [ ] 社群分享功能
- [ ] 多語言切換

### 12:00 — 壓力測試
```bash
npm install -g artillery
artillery quick --count 20 --num 50 https://api.nightasaur.com/api/health
```

### 15:00 — 社群推廣

**Twitter：**
```
🚀 Nightasaur 正式上線！

一個開源的 AI 數位精靈 × 個人助手平台。
創建精靈、AI 對話、程式碼協助、翻譯，100% 開源 MIT。

👉 https://nightasaur.com
🐙 https://github.com/nightasaur/nightasaur

#OpenSource #AI #React #Python
```

**Reddit (r/opensource)：**
```
Title: Nightasaur - Open Source AI Digital Spirit + Personal Assistant Platform

Just launched Nightasaur! Full-stack open source platform:
- Create & evolve AI spirit companions (10 elements, 6 stages)
- Switch to AI assistant for coding/translation/docs
- React + Node.js + Python + Ollama
- MIT licensed

Website: https://nightasaur.com
GitHub: https://github.com/nightasaur/nightasaur
```

### 18:00 — 監控
- 檢查 GitHub Issues
- 回應評論
- 觀察伺服器
---

# 📊 費用總結

| 項目 | 費用 | 備註 |
|------|------|------|
| Vercel (前端) | **$0** | 永久免費 |
| Railway (後端+DB) | **$0-3/月** | $5 免費額度內 |
| nightasaur.com | **$9.15/年** | Cloudflare Registrar |
| Ollama VPS (選配) | $5-20/月 | 可先用自己的電腦 |
| **最低總計** | **$9.15/年** + $0/月 | 🎉 |

---

# ✅ 立即行動清單

### 今天（現在就能做）

- [ ] **[1]** 註冊 Vercel → https://vercel.com （GitHub 登入）
- [ ] **[2]** 註冊 Railway → https://railway.app （GitHub 登入）
- [ ] **[3]** 部署後端到 Railway（照 1.2 步驟）
- [ ] **[4]** 部署前端到 Vercel（照 1.3 步驟）

### 本週

- [ ] **[5]** 買 `nightasaur.com` → Cloudflare Registrar
- [ ] **[6]** 設定 DNS → Cloudflare
- [ ] **[7]** Vercel + Railway 自訂網域
- [ ] **[8]** 全面測試

### 上線日

- [ ] **[9]** 壓力測試
- [ ] **[10]** 分享到社群
- [ ] **[11]** 🎉 正式上線！

---

# ⚠️ 常見問題

### Q：Railway 一定要綁信用卡嗎？
**A**：是的，用來驗證身份，不會扣款。$5/月免費額度夠用。

### Q：nightasaur.com 一定要買嗎？
**A**：可以先部署到 Vercel/Railway 的免費域名測試，確認沒問題再買。

### Q：AI Engine（Ollama）一定要部署嗎？
**A**：可以先跳過。核心功能（註冊、精靈、對話）不需要 AI Engine。

### Q：搬域名時服務會中斷嗎？
**A**：不會。先設定 DNS，確認生效後再切換，完全無中斷。

---

# 🏁 目標

```
9/7  開始部署
9/8  Phase 1 完成（Vercel + Railway 可訪問）
9/10 購買 nightasaur.com
9/12 DNS 生效，搬遷完成
9/13 🎉 正式上線！
```

> **現在開始，一週內讓 Nightasaur 對全世界開放！** 🌍

---

📄 其他參考文件：
- [完整部署指南](deploy/DEPLOYMENT_GUIDE.md)
- [API 文檔](docs/API.md)
- [開發指南](docs/DEVELOPMENT.md)