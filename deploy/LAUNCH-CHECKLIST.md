# Nightasaur 上線檢查清單
# ============================================

## Phase A: 網域 + DNS (現在就可做)

- [ ] 購買 nightasaur.com (GoDaddy / CCCBuyYear / Cloudflare Registrar)
- [ ] 申請 Cloudflare 帳號 (免費方案)
- [ ] 將網域加入 Cloudflare
- [ ] 註冊商改 NS 指向 Cloudflare (arnold.ns.cloudflare.com / elsa.ns.cloudflare.com)
- [ ] SSL/TLS 設為 "Full"
- [ ] 新增 DNS 記錄：
  - [ ] CNAME `@` → 等部署後填入
  - [ ] CNAME `www` → 等部署後填入

## Phase B: FB/IG API (可在本機測試)

- [ ] 前往 developers.facebook.com 建立 App
- [ ] 取得 Page Access Token (docs/FB-IG-SETUP.md)
- [ ] 連結 Instagram 商業帳號
- [ ] 將 Token 填入 apps/backend/.env
- [ ] 測試連線: `/api/social/posts/test/fb`
- [ ] 測試連線: `/api/social/posts/test/ig`
- [ ] App 審核: pages_manage_posts + instagram_content_publish

## Phase C: ComfyUI 安裝 (今天可做)

- [ ] Clone ComfyUI 完成
- [ ] pip install -r requirements.txt
- [ ] 下載 dreamshaper_8.safetensors (SD 1.5, 2GB)
- [ ] 放到 ComfyUI/models/checkpoints/
- [ ] 執行 run_nightasaur.bat 測試
- [ ] 確認 http://localhost:8188 可開啟

## Phase D: LoRA 訓練 (GPU)

- [ ] 安裝 Kohya SS
- [ ] 執行 train_lora.py 預處理圖片
- [ ] 執行 LoRA 訓練 (~30 分鐘, 1500 steps)
- [ ] 將 nightasaur_style.safetensors 放到 ComfyUI/models/loras/
- [ ] 測試 AI 精靈生圖

## Phase E: React Native APP

- [ ] cd apps/mobile && npm install
- [ ] npx expo start
- [ ] 手機安裝 Expo Go 掃碼測試
- [ ] 確認登入/精靈列表/對話可用
- [ ] 改 API_BASE 為實際 IP

## Phase F: 部署

- [ ] React Web → Cloudflare Pages
- [ ] Node.js 後端 → Railway / Render
- [ ] Python AI Engine → 本機 GPU (或 RunPod 雲端 GPU)
- [ ] 資料庫 → Railway PostgreSQL (或繼續 SQLite)
- [ ] 設定 CORS + 環境變數

## Phase G: 上線前最後確認

- [ ] 隱私政策頁面 (FB 審核需要)
- [ ] FB App 切換為「上線」模式
- [ ] 註冊流程完整測試
- [ ] AI 對話穩定測試
- [ ] FB/IG 發文測試
- [ ] 壓力測試 (10 人同時註冊)