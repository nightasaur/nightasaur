# 📋 Nightasaur 登入系統 - 完整管理員資訊

## 🎯 系統概述
完整的用戶認證系統，包含登入、註冊、忘記密碼功能。

## 🌐 系統資訊
- **服務器**: http://localhost:3002
- **支援信箱**: service@nightasaur.com
- **版本**: Nightasaur v2.1

## 🔑 管理員帳號資訊

### 完整登入憑證
```
📧 電子郵件: admin@nightasaur.com
👤 用戶名: admin
🔑 密碼: admin123
🎭 角色: 系統管理員
📞 支援: service@nightasaur.com
```

### 帳號權限
- ✅ 完整系統訪問權限
- ✅ 管理用戶設定
- ✅ 查看系統狀態
- ✅ 支援信箱聯繫

## 🖥️ 登入界面說明

### 登入表單 (2個欄位)
1. **電子郵件欄位**
   - 類型: email
   - 預設值: admin@nightasaur.com
   - 必填: 是
   - 驗證: 電子郵件格式

2. **密碼欄位**
   - 類型: password
   - 預設值: admin123
   - 必填: 是
   - 驗證: 最少6字符

### 註冊表單 (3個欄位)
1. **電子郵件欄位**
   - 類型: email
   - 必填: 是
   - 驗證: 電子郵件格式

2. **用戶名欄位**
   - 類型: text
   - 必填: 是
   - 驗證: 唯一性

3. **密碼欄位**
   - 類型: password
   - 必填: 是
   - 驗證: 最少6字符

## 🚀 快速開始

### 1. 啟動服務器
```bash
cd apps/backend
npx tsx auth-server.ts
```

### 2. 訪問登入頁面
```
網址: http://localhost:3002
或: http://localhost:3002/
```

### 3. 使用管理員帳號登入
```
電子郵件: admin@nightasaur.com
密碼: admin123
```

### 4. 忘記密碼功能
```
忘記密碼頁面: http://localhost:3002/forgot-password
重置密碼頁面: http://localhost:3002/reset-password
```

## 🔧 API 端點

### 登入 API
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@nightasaur.com",
  "password": "admin123"
}
```

### 註冊 API
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "username",
  "password": "password123"
}
```

### 忘記密碼 API
```bash
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "admin@nightasaur.com"
}
```

## 📊 數據庫結構

### 用戶表 (User)
- `id`: 用戶ID
- `email`: 電子郵件 (唯一)
- `username`: 用戶名 (唯一)
- `passwordHash`: 密碼哈希
- `bio`: 個人簡介
- `role`: 角色 (USER/ADMIN)

### 語言設定表 (LanguagePreference)
- `userId`: 用戶ID
- `primaryLang`: 主要語言
- `fontSize`: 字體大小
- `theme`: 主題

### 用戶設定表 (UserSettings)
- `userId`: 用戶ID
- `musicVolume`: 音樂音量
- `soundVolume`: 音效音量
- `musicEnabled`: 音樂啟用
- `soundEnabled`: 音效啟用
- `vibrationEnabled`: 震動啟用
- `vibrationStrength`: 震動強度

### 密碼重置令牌表 (PasswordResetToken)
- `userId`: 用戶ID
- `token`: 重置令牌 (唯一)
- `expiresAt`: 過期時間
- `used`: 是否已使用

## 🛠️ 故障排除

### 常見問題
1. **服務器未啟動**
   ```bash
   # 檢查端口
   netstat -ano | findstr :3002
   
   # 啟動服務器
   cd apps/backend
   npx tsx auth-server.ts
   ```

2. **登入失敗**
   - 檢查電子郵件: admin@nightasaur.com
   - 檢查密碼: admin123
   - 檢查大小寫

3. **忘記密碼無效**
   - 檢查電子郵件格式
   - 檢查服務器日誌
   - 聯繫支援: service@nightasaur.com

### 錯誤訊息
- **"電子郵件或密碼錯誤"**: 憑證不正確
- **"電子郵件或用戶名已被使用"**: 重複註冊
- **"無效的重置連結"**: 令牌無效
- **"此連結已過期"**: 令牌過期
- **"此連結已被使用"**: 令牌已使用

## 📞 支援聯繫

### 技術支援
```
📧 電子郵件: service@nightasaur.com
🌐 服務器: http://localhost:3002
📖 文檔: FORGOT_PASSWORD_GUIDE.md
```

### 緊急聯繫
1. 服務器問題: 檢查控制台輸出
2. 登入問題: 使用忘記密碼功能
3. 系統問題: 重啟服務器

## 🧪 測試方法

### 自動測試
```bash
node quick-test.js
```

### 手動測試流程
1. 訪問登入頁面
2. 使用管理員帳號登入
3. 測試註冊功能
4. 測試忘記密碼
5. 測試密碼重置

### 測試帳號
```
測試帳號1:
電子郵件: test1@nightasaur.com
用戶名: testuser1
密碼: test123

測試帳號2:
電子郵件: test2@nightasaur.com
用戶名: testuser2
密碼: test456
```

## 🔒 安全建議

### 生產環境
1. **修改管理員密碼**
2. **啟用HTTPS**
3. **設置環境變量**
4. **啟用日誌記錄**
5. **設置防火牆**

### 密碼安全
1. 使用強密碼
2. 定期更換密碼
3. 不要共享密碼
4. 啟用雙因素驗證

## 📈 系統監控

### 健康檢查
```bash
GET /api/health
```

### 系統狀態
- ✅ 服務器運行狀態
- ✅ 數據庫連接狀態
- ✅ API功能狀態
- ✅ 忘記密碼功能狀態

### 日誌監控
- 登入成功/失敗記錄
- 密碼重置請求記錄
- 系統錯誤記錄
- 安全事件記錄

## 🎉 完成功能

### 核心功能
✅ 用戶登入系統 (2欄位)  
✅ 用戶註冊系統 (3欄位)  
✅ 忘記密碼功能  
✅ 密碼重置流程  
✅ 支援信箱系統  

### 安全功能
✅ JWT身份驗證  
✅ bcrypt密碼哈希  
✅ 安全令牌系統  
✅ 輸入驗證  
✅ 錯誤處理  

### 用戶界面
✅ 響應式設計  
✅ 繁體中文界面  
✅ 即時狀態反饋  
✅ 簡單操作流程  
✅ 完整錯誤提示  

---

## 🏆 總結

Nightasaur 登入系統已完整建立，包含：

### 管理員帳號資訊
```
📧 電子郵件: admin@nightasaur.com
👤 用戶名: admin
🔑 密碼: admin123
🎭 角色: 系統管理員
📞 支援: service@nightasaur.com
```

### 登入界面
- **登入表單**: 2個欄位 (電子郵件、密碼)
- **註冊表單**: 3個欄位 (電子郵件、用戶名、密碼)
- **忘記密碼**: 完整重置流程

### 系統功能
- ✅ 完整的認證流程
- ✅ 安全的密碼管理
- ✅ 用戶友好的界面
- ✅ 詳細的錯誤處理
- ✅ 完整的文檔說明

**系統已準備就緒，可以立即投入使用！**

**下一步行動:**
1. 啟動服務器: `cd apps/backend && npx tsx auth-server.ts`
2. 訪問界面: http://localhost:3002
3. 使用管理員帳號登入
4. 測試所有功能

**感謝使用 Nightasaur 系統！** 🦖