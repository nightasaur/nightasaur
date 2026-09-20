# Nightasaur 資料庫連線切換與註冊 API 修復完成報告

## 📋 執行摘要

已完成 Nightasaur 專案的資料庫連線切換與註冊 API 修復工作。主要變更包括：

1. ✅ **資料庫連線切換**：從 SQLite 切換到 PostgreSQL，支援 Supabase/Railway 等雲端服務
2. ✅ **註冊 API 修復**：強化錯誤處理、新增記憶體降級模式、改善回應格式
3. ✅ **前端錯誤處理**：改善註冊頁面的錯誤顯示和使用者體驗

## 🔧 詳細修改內容

### 任務一：檢查與簡化 Prisma Schema

#### 1. 資料庫連線設定更新
- **檔案**: `apps/backend/prisma/schema.prisma`
- **變更**: 將 `datasource db` 的 provider 從 `"sqlite"` 改為 `"postgresql"`
- **連線字串**: 使用環境變數 `DATABASE_URL`
- **支援平台**: PostgreSQL、Supabase、Railway、Neon 等

#### 2. 環境變數更新
- **檔案**: `.env.example`
  - 新增 PostgreSQL 連線範例
  - 保留 SQLite 註解供開發測試使用
  - 預設開發環境連線：`postgresql://postgres:postgres@localhost:5432/nightasaur?schema=public`

- **檔案**: `apps/backend/.env`
  - 更新為 PostgreSQL 連線設定
  - 添加切換回 SQLite 的說明註解

#### 3. 遷移工具建立
- **檔案**: `apps/backend/scripts/migrate-db.js`
- **功能**: 檢查資料庫連線狀態、提供遷移指引
- **使用方式**: `node scripts/migrate-db.js`

### 任務二：修復 /api/auth/register (註冊 API)

#### 1. Auth Service 全面升級
- **檔案**: `apps/backend/src/services/auth.ts`
- **主要改進**:

**A. 雙模式運作架構**
- **資料庫模式**: 正常連線 PostgreSQL 資料庫
- **記憶體模式**: 當資料庫不可用時自動降級，使用記憶體暫存使用者資料
- **自動偵測**: 啟動時自動測試資料庫連線狀態

**B. 強化驗證邏輯**
- Email 格式驗證（正則表達式）
- 密碼長度檢查（至少8字元）
- Email 唯一性檢查
- 使用者名稱唯一性檢查

**C. 結構化錯誤回應**
```json
// 成功回應
{
  "success": true,
  "user": { ... },
  "token": "jwt_token",
  "mode": "database|memory",
  "warning": "可選的警告訊息"
}

// 錯誤回應
{
  "success": false,
  "message": "錯誤訊息",
  "statusCode": 400|409|500,
  "details": "開發環境詳細錯誤"
}
```

**D. 記憶體降級機制**
- 當 `DATABASE_URL` 未設定或連線失敗時自動啟用
- 使用 Map 物件暫存使用者資料
- 支援基本的註冊、登入、個人資料功能
- 顯示明確的警告訊息提醒使用者

#### 2. Auth Controller 更新
- **檔案**: `apps/backend/src/controllers/auth.ts`
- **改進**: 正確處理服務層的結構化錯誤回應
- **狀態碼**: 根據錯誤類型回傳適當的 HTTP 狀態碼

#### 3. 錯誤處理中間件更新
- **檔案**: `apps/backend/src/middleware/errorHandler.ts`
- **改進**: 支援結構化錯誤格式，與前端錯誤處理一致

### 任務三：前端 /register 頁面 error handling

#### 1. 註冊頁面全面升級
- **檔案**: `apps/web/src/pages/Register.tsx`
- **主要改進**:

**A. 錯誤訊息顯示**
- 結構化錯誤顯示（標題 + 內容）
- 支援詳細錯誤資訊（開發環境）
- 網路錯誤處理

**B. 警告訊息顯示**
- 記憶體模式警告
- 自動跳轉提示
- 資料庫狀態提示

**C. 使用者體驗改善**
- 表單欄位提示文字
- 按鈕禁用狀態樣式
- 載入中狀態顯示

**D. 回應處理邏輯**
```typescript
// 成功處理
if (res.data && res.data.success) {
  // 儲存 token
  // 設定使用者
  // 檢查警告訊息
  // 跳轉到儀表板
}

// 錯誤處理
const errorData = err.response?.data;
if (errorData?.message) {
  setError(errorData.message);
}
```

#### 2. 註冊流程
1. 使用者填寫表單
2. 前端發送註冊請求
3. 後端驗證資料並檢查唯一性
4. 根據資料庫狀態選擇運作模式
5. 回傳結構化回應
6. 前端根據回應顯示結果
7. 成功則跳轉到 `/dashboard`

## 🚀 部署與遷移指南

### 步驟 1：環境設定
```bash
# 1. 複製環境變數範例
cp .env.example .env

# 2. 更新 DATABASE_URL（根據您的環境）
# PostgreSQL 本地開發
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nightasaur?schema=public"

# Supabase
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres"

# Railway
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[YOUR-URL].railway.app:5432/railway"
```

### 步驟 2：資料庫遷移
```bash
# 進入後端目錄
cd apps/backend

# 1. 生成 Prisma 客戶端
npx prisma generate

# 2. 執行遷移（首次部署）
npx prisma migrate dev --name init

# 或推送 schema（開發環境）
npx prisma db push

# 3. 執行種子資料
npx prisma db seed
```

### 步驟 3：測試資料庫連線
```bash
# 使用遷移工具測試
node scripts/migrate-db.js

# 預期輸出：
# ✅ 資料庫連線成功
# 📊 現有資料表數量：X
```

### 步驟 4：啟動服務
```bash
# 啟動後端服務
npm run dev:backend

# 啟動前端服務（另一個終端機）
npm run dev:web
```

## 🧪 測試指南

### 測試 1：正常註冊流程
1. 訪問 `http://localhost:5173/register`
2. 填寫有效的 Email、使用者名稱、密碼
3. 點擊「開始孵化！」
4. 預期結果：跳轉到 `/dashboard`，建立初始精靈

### 測試 2：重複 Email 註冊
1. 使用已註冊的 Email 再次註冊
2. 預期結果：顯示「該Email已被註冊」

### 測試 3：記憶體模式測試
```bash
# 暫時關閉資料庫連線
# 修改 .env 中的 DATABASE_URL 為無效值
DATABASE_URL="postgresql://invalid:password@localhost:5432/nonexistent"
```
1. 重新啟動後端服務
2. 嘗試註冊新帳號
3. 預期結果：註冊成功但顯示記憶體模式警告

### 測試 4：前端錯誤處理
1. 填寫無效的 Email 格式
2. 預期結果：顯示「請輸入有效的 Email 地址」
3. 填寫太短的密碼
4. 預期結果：顯示「密碼至少需要8個字元」

## 🔒 安全性改進

### 1. 密碼安全
- 使用 `bcryptjs` 進行密碼雜湊（SALT_ROUNDS=12）
- 密碼長度驗證（至少8字元）
- 前端密碼強度提示

### 2. 錯誤訊息安全
- 生產環境隱藏詳細錯誤堆疊
- 統一的錯誤訊息格式
- 避免資訊洩漏（如「使用者不存在」改為「Email 或密碼錯誤」）

### 3. JWT 安全
- 使用環境變數設定 JWT 秘密
- Token 過期時間設定（預設7天）
- 生產環境必須更改預設秘密

## 📊 監控與日誌

### 後端日誌
- 資料庫連線狀態日誌
- 註冊成功/失敗日誌
- 記憶體模式使用日誌
- 錯誤堆疊記錄（開發環境）

### 記憶體模式監控
```javascript
// 可透過 API 取得的統計資料
{
  "userCount": 5,
  "isDatabaseConnected": false,
  "timestamp": "2026-09-20T10:30:00Z"
}
```

## 🐛 已知問題與限制

### 1. 記憶體模式限制
- 資料不會永久保存（伺服器重啟後消失）
- 不支援精靈創建功能
- 不支援進階功能（任務、成就等）

### 2. 遷移注意事項
- 從 SQLite 遷移到 PostgreSQL 需要手動資料遷移
- 建議先備份現有資料
- 測試環境建議使用 Docker PostgreSQL

### 3. 生產環境建議
- 設定適當的 PostgreSQL 連線池
- 啟用 SSL 連線（雲端服務）
- 定期備份資料庫
- 設定監控告警

## 🔄 恢復與回滾

### 恢復到 SQLite
```bash
# 1. 修改環境變數
DATABASE_URL="file:./dev.db"

# 2. 更新 Prisma schema
# 將 provider 改回 "sqlite"

# 3. 重新生成客戶端
npx prisma generate

# 4. 重啟服務
```

### 資料恢復
1. 從備份恢復 `dev.db` 檔案
2. 或使用資料庫匯出/匯入工具
3. 測試所有功能正常運作

## 📞 問題排除

### 常見問題 1：資料庫連線失敗
```
錯誤：連線被拒絕
解決：檢查 PostgreSQL 服務是否運行，防火牆設定，連線字串格式
```

### 常見問題 2：遷移失敗
```
錯誤：資料表已存在
解決：先清理資料庫或使用 --force 參數（謹慎使用）
```

### 常見問題 3：記憶體模式無法切換
```
錯誤：始終使用記憶體模式
解決：檢查 .env 檔案、環境變數載入、Prisma 連線設定
```

## 🎯 下一步建議

### 短期改進（1-2週）
1. **添加單元測試**：註冊 API 的各種情境測試
2. **改善錯誤訊息**：更友好的使用者錯誤訊息
3. **添加監控端點**：資料庫健康檢查 API

### 中期改進（1個月）
1. **實作 Email 驗證**：註冊後發送驗證郵件
2. **添加速率限制**：防止暴力註冊攻擊
3. **改善密碼強度檢查**：更嚴格的密碼規則

### 長期改進（3個月）
1. **多因素認證**：支援 Google Authenticator
2. **社交登入**：Google、Facebook、Apple 登入
3. **審計日誌**：完整的操作記錄

---

## ✅ 驗證清單

- [x] Prisma schema 更新為 PostgreSQL
- [x] 環境變數設定完成
- [x] 註冊 API 強化錯誤處理
- [x] 記憶體降級機制實作
- [x] 前端錯誤處理改善
- [x] 遷移工具建立
- [x] 部署指南撰寫
- [ ] 實際部署測試（需執行）

## 🚨 立即行動

請執行以下命令將變更推送到 Git：

```bash
# 1. 檢查變更
git status

# 2. 添加所有變更
git add .

# 3. 提交變更
git commit -m "feat: 資料庫切換至 PostgreSQL 與註冊 API 修復

- 將資料庫從 SQLite 切換到 PostgreSQL
- 強化註冊 API 錯誤處理與驗證
- 實作記憶體降級機制
- 改善前端錯誤顯示與使用者體驗
- 建立遷移工具與部署指南"

# 4. 推送到遠端
git push origin main
```

## 📋 後續檢查清單

部署後請確認：

1. [ ] 資料庫連線正常
2. [ ] 註冊功能正常運作
3. [ ] 錯誤處理正確顯示
4. [ ] 記憶體模式可正常切換
5. [ ] 所有既有功能不受影響
6. [ ] 監控日誌正常記錄

如有任何問題，請參考本文件的問題排除章節或聯絡開發團隊。