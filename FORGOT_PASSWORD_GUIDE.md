# 🔐 Nightasaur 忘記密碼系統

## 📋 功能概述
完整的密碼重置流程，包含：
- 忘記密碼請求界面
- 密碼重置連結發送
- 安全令牌驗證
- 新密碼設置
- 支援信箱: `service@nightasaur.com`

## 🚀 快速開始

### 1. 啟動服務器
```bash
cd apps/backend
npx tsx auth-server.ts
```

### 2. 訪問忘記密碼頁面
- 網址: http://localhost:3002/forgot-password
- 支援信箱: service@nightasaur.com

### 3. 默認帳號
- 管理員: admin@nightasaur.com / admin123
- 測試用戶: test@nightasaur.com / test123

## 🔧 功能特色

### ✅ 忘記密碼流程
1. **請求重置連結**: 輸入電子郵件地址
2. **發送重置郵件**: 包含安全令牌連結
3. **驗證令牌**: 自動驗證連結有效性
4. **設置新密碼**: 輸入並確認新密碼
5. **完成重置**: 使用新密碼登入

### ✅ 安全功能
- **安全令牌**: 32位隨機十六進制令牌
- **令牌過期**: 1小時有效期
- **單次使用**: 每個令牌只能使用一次
- **電子郵件驗證**: 防止用戶枚舉攻擊
- **密碼強度檢查**: 至少6個字符

### ✅ 支援服務
- **支援信箱**: service@nightasaur.com
- **模擬發送**: 控制台顯示重置連結
- **錯誤處理**: 友好的錯誤訊息
- **多語言**: 繁體中文界面

## 📡 API 接口

### 請求密碼重置
```bash
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**響應:**
```json
{
  "success": true,
  "message": "密碼重置連結已發送到您的電子郵件",
  "supportEmail": "service@nightasaur.com",
  "resetLink": "http://localhost:3002/reset-password?token=abc123..."
}
```

### 驗證重置令牌
```bash
GET /api/auth/validate-reset-token?token=abc123...
```

### 重置密碼
```bash
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "abc123...",
  "newPassword": "newpassword123"
}
```

## 🖥️ 界面截圖

### 忘記密碼頁面
```
🔐 忘記密碼
請輸入您的電子郵件地址
支援信箱: service@nightasaur.com
[電子郵件輸入框]
[發送重置連結按鈕]
```

### 重置密碼頁面
```
🔄 重置密碼
支援信箱: service@nightasaur.com
新密碼: [輸入框]
確認密碼: [輸入框]
[重置密碼按鈕]
```

## 🗄️ 數據庫結構

### 密碼重置令牌表 (password_reset_tokens)
- `id`: 令牌ID
- `userId`: 用戶ID
- `token`: 重置令牌 (唯一)
- `expiresAt`: 過期時間
- `used`: 是否已使用
- `createdAt`: 創建時間

### 關係
- 一個用戶可以有多個重置令牌
- 令牌與用戶一對多關係
- 自動級聯刪除

## 🔍 使用流程

### 用戶端流程
1. 訪問 `/forgot-password`
2. 輸入電子郵件地址
3. 點擊"發送重置連結"
4. 檢查電子郵件 (控制台查看連結)
5. 點擊重置連結
6. 輸入新密碼
7. 完成重置

### 管理員流程
1. 監控控制台輸出
2. 查看重置請求記錄
3. 支援信箱處理問題
4. 監控安全事件

## 🛠️ 開發指南

### 環境要求
- Node.js 18+
- TypeScript
- Prisma ORM
- SQLite 數據庫

### 安裝依賴
```bash
npm install express cors bcryptjs jsonwebtoken crypto
npm install -D typescript tsx @types/express @types/cors @types/bcryptjs @types/jsonwebtoken
```

### 配置調整
1. **修改支援信箱**: 更新 `service@nightasaur.com`
2. **調整令牌過期時間**: 修改 `RESET_TOKEN_EXPIRY`
3. **添加郵件服務**: 集成SMTP發送真實郵件
4. **加強安全性**: 添加速率限制、日誌記錄

## 🧪 測試方法

### 運行測試
```bash
node test-forgot-password.js
```

### 測試項目
1. ✅ 服務器健康檢查
2. ✅ 忘記密碼請求
3. ✅ 重置連結生成
4. ✅ 密碼重置功能
5. ✅ 新密碼登入

### 手動測試
1. 訪問 http://localhost:3002
2. 點擊"忘記密碼？"
3. 輸入 `admin@nightasaur.com`
4. 檢查控制台獲取連結
5. 點擊連結重置密碼
6. 使用新密碼登入

## 📞 故障排除

### 常見問題
1. **服務器未啟動**: 檢查端口3002是否被佔用
2. **數據庫錯誤**: 運行 `npx prisma migrate dev`
3. **令牌無效**: 檢查令牌是否過期或已使用
4. **郵件未發送**: 檢查控制台輸出

### 錯誤訊息
- **"電子郵件或密碼錯誤"**: 用戶不存在或密碼錯誤
- **"無效的重置連結"**: 令牌不存在或已失效
- **"此連結已過期"**: 令牌超過1小時有效期
- **"此連結已被使用"**: 令牌已被使用過

## 🔒 安全建議

### 生產環境部署
1. **使用真實郵件服務**: 替換模擬發送
2. **添加HTTPS**: 使用SSL證書
3. **設置環境變量**: 保護JWT密鑰
4. **啟用日誌記錄**: 監控安全事件
5. **添加速率限制**: 防止暴力破解

### 安全最佳實踐
1. **令牌隨機性**: 使用crypto生成安全令牌
2. **短期有效性**: 1小時過期時間
3. **單次使用**: 防止重放攻擊
4. **錯誤訊息模糊**: 防止用戶枚舉
5. **輸入驗證**: 所有輸入都進行驗證

## 🎯 整合指南

### 前端整合
```html
<!-- 忘記密碼連結 -->
<a href="/forgot-password">忘記密碼？</a>

<!-- 登入表單 -->
<form onsubmit="login(event)">
  <input type="email" id="email">
  <input type="password" id="password">
  <button type="submit">登入</button>
  <a href="/forgot-password">忘記密碼？</a>
</form>
```

### 後端整合
```javascript
// 添加忘記密碼路由
app.get('/forgot-password', forgotPasswordPage);
app.post('/api/auth/forgot-password', forgotPasswordRequest);
app.get('/reset-password', resetPasswordPage);
app.post('/api/auth/reset-password', resetPassword);
```

## 📊 系統狀態

### 運行狀態
- ✅ 服務器: http://localhost:3002
- ✅ 數據庫: Prisma + SQLite
- ✅ 身份驗證: JWT
- ✅ 忘記密碼: 完整流程
- ✅ 支援信箱: service@nightasaur.com

### 版本資訊
- **版本**: v2.1.0
- **主要語言**: 繁體中文
- **支援信箱**: service@nightasaur.com
- **更新日期**: 2026年9月5日

---

## 🎉 完成功能

✅ **核心功能:**
- 忘記密碼請求界面
- 密碼重置連結發送
- 安全令牌驗證系統
- 新密碼設置功能
- 完整的錯誤處理

✅ **安全功能:**
- 安全令牌生成
- 令牌過期機制
- 單次使用限制
- 密碼強度檢查
- 防止用戶枚舉

✅ **用戶體驗:**
- 繁體中文界面
- 清晰的錯誤訊息
- 簡單的操作流程
- 即時狀態反饋
- 支援信箱顯示

🚀 **下一步計劃:**
- 集成真實郵件發送
- 添加管理員通知
- 實現郵件模板
- 添加安全審計日誌
- 多語言支援擴展

---

**開發者**: Nightasaur 團隊  
**支援**: service@nightasaur.com  
**文檔版本**: 1.0.0