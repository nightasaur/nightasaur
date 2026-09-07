# 🎯 Nightasaur 本地運行完整指南

## 🔍 發現的問題與解決方案

### ❌ 原本的問題
1. **端口衝突**：後端嘗試使用 3000 端口，但被其他應用佔用
2. **前端代理錯誤**：前端代理到錯誤的端口 (3000 → 3002)
3. **資料庫問題**：預設帳號不在真實資料庫中
4. **認證服務問題**：使用臨時存儲而非真實資料庫

### ✅ 已修復的問題
1. ✅ **後端口改為 3002**：避免端口衝突
2. ✅ **前端代理改為 3002**：正確代理到後端
3. ✅ **資料庫修復**：預設帳號已創建在真實資料庫中
4. ✅ **認證服務重寫**：改為使用 Prisma 資料庫
5. ✅ **使用者存在檢查**：精靈創建時檢查使用者是否存在

## 🚀 如何正確啟動 Nightasaur

### 步驟 1：啟動後端
```bash
# 打開新的終端窗口
cd c:\Nightasaur\apps\backend
npm run dev
```

**預期輸出：**
```
✅ 預設帳號已確保存在
   Admin: admin@nightasaur.com / admin123!
   Demo: demo@nightasaur.com / demo1234

┌─────────────────────────────────────────┐
│       🦖 Nightasaur Backend 🦖         │
│       智慧精靈平台                      │
├─────────────────────────────────────────┤
│ Server : http://localhost:3002       │
│ API    : http://localhost:3002/api   │
│ Env    : development                 │
└─────────────────────────────────────────┘
```

### 步驟 2：啟動前端
```bash
# 打開另一個新的終端窗口
cd c:\Nightasaur\apps\web
npm run dev
```

**預期輸出：**
```
  VITE v5.4.8  ready in 1234 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 步驟 3：測試登入
1. 訪問：http://localhost:5173/login
2. 使用以下任一帳號：

| 帳號類型 | Email | 密碼 | 使用者 ID |
|---------|-------|------|----------|
| 管理員 | `admin@nightasaur.com` | `admin123!` | `cmtqq2ro70000azzpxmn4t89v` |
| 示範用戶 | `demo@nightasaur.com` | `demo1234` | `cmtqq2rv00001azzp9hg4nszb` |
| 測試用戶 | `test@nightasaur.com` | `testpassword` | `cmtq53zln0000q0isdxvz0hc1` |

## 🛠️ 如果仍然遇到問題

### 問題 1：端口仍然被佔用
```bash
# 檢查哪些進程佔用端口
netstat -ano | findstr :3002

# 殺掉佔用端口的進程（替換 PID）
taskkill /PID <PID> /F

# 或者使用 PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3002).OwningProcess | Stop-Process -Force
```

### 問題 2：資料庫問題
```bash
# 重新創建資料庫
cd c:\Nightasaur\apps\backend
npx prisma db push --force-reset

# 然後重新啟動後端
npm run dev
```

### 問題 3：依賴包問題
```bash
# 重新安裝後端依賴
cd c:\Nightasaur\apps\backend
rm -rf node_modules package-lock.json
npm install

# 重新安裝前端依賴
cd c:\Nightasaur\apps\web
rm -rf node_modules package-lock.json
npm install
```

## 📊 本地環境狀態檢查

### 後端檢查
```bash
# 檢查後端健康狀態
curl http://localhost:3002/api/health

# 預期回應：
# {"status":"ok","timestamp":"2026-09-07T05:26:00.000Z","service":"Nightasaur Backend","version":"1.0.0"}
```

### 前端檢查
```bash
# 檢查前端是否正確代理
curl http://localhost:5173/api/health

# 應該返回與上面相同的健康狀態
```

### 資料庫檢查
```bash
# 檢查資料庫中的使用者
cd c:\Nightasaur\apps\backend
npx tsx check-login-fix.ts
```

## 🔧 技術修復詳情

### 1. 後端修復
- **檔案**: `apps/backend/src/config/index.ts`
- **修改**: 端口從 3000 改為 3002
- **檔案**: `apps/backend/src/services/auth.ts`
- **修改**: 從臨時存儲改為使用 Prisma 資料庫

### 2. 前端修復
- **檔案**: `apps/web/vite.config.ts`
- **修改**: 代理目標從 3000 改為 3002

### 3. 精靈服務修復
- **檔案**: `apps/backend/src/services/spirit.ts`
- **修改**: 添加使用者存在檢查，提供清晰錯誤訊息

## 🎮 測試完整流程

### 測試 1：API 直接測試
```bash
# 登入測試
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nightasaur.com","password":"admin123!"}'

# 創建精靈測試（需要先獲取令牌）
curl -X POST http://localhost:3002/api/spirits \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{"name":"火焰龍","element":"FIRE","personality":"熱情"}'
```

### 測試 2：瀏覽器測試
1. 訪問 http://localhost:5173
2. 點擊登入
3. 輸入帳號密碼
4. 檢查是否成功登入
5. 嘗試創建精靈

## 📝 常見錯誤與解決

### 錯誤：`Connection refused`
```
Error: connect ECONNREFUSED 127.0.0.1:3002
```
**解決**：確保後端正在運行

### 錯誤：`Invalid credentials`
```
{"error":"Email 或密碼錯誤"}
```
**解決**：使用正確的帳號密碼

### 錯誤：`Foreign key constraint violated`
```
Foreign key constraint violated: foreign key
```
**解決**：現在已修復，會顯示「使用者不存在」的清晰錯誤

### 錯誤：`Proxy error`
```
Proxy error: Could not proxy request /api/auth/login
```
**解決**：檢查前端代理配置是否正確指向 3002

## 🎉 完成！
現在你的 Nightasaur 應該可以正常：
1. ✅ 登入
2. ✅ 創建精靈
3. ✅ 查看精靈列表
4. ✅ 進行遊戲操作

如果還有問題，請提供具體的錯誤訊息，我可以進一步幫助你！