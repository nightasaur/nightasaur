# 🦖 Nightasaur 完整後台系統 v2.0

## 📋 系統概述
一個完整的遊戲後台系統，包含用戶註冊/登入、多語言設定、音效/震動設定管理功能。

## 🚀 快速開始

### 1. 啟動服務器
```bash
cd apps/backend
npx tsx simple-server.ts
```

### 2. 訪問服務器
- 網址: http://localhost:3001
- 默認帳號: admin@nightasaur.com / admin123
- 測試帳號: test@nightasaur.com / test123

## 🔧 功能特色

### ✅ 用戶系統
- **註冊**: `POST /api/auth/register`
- **登入**: `POST /api/auth/login`
- **個人資料**: `GET /api/auth/profile`

### ✅ 語言設定
- **主要語言**: 繁體中文 (zh-TW)
- **支援語言**: 簡體中文 (zh-CN), English (en-US)
- **更新設定**: `PUT /api/settings/language`

### ✅ 音效設定
- **音樂音量**: 0-100 範圍控制
- **音效音量**: 0-100 範圍控制
- **開關控制**: 音樂/音效啟用/禁用
- **更新設定**: `PUT /api/settings/audio`

### ✅ 震動設定
- **震動開關**: 啟用/禁用
- **震動強度**: 0-100 範圍控制
- **更新設定**: `PUT /api/settings/vibration`

## 📡 API 接口

### 健康檢查
```bash
GET /api/health
```

### 語言列表
```bash
GET /api/language/languages
```

### 用戶註冊
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "player1",
  "password": "password123"
}
```

### 用戶登入
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### 取得設定
```bash
GET /api/settings
Authorization: Bearer YOUR_JWT_TOKEN
```

### 更新語言設定
```bash
PUT /api/settings/language
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "primaryLang": "zh-CN",
  "fontSize": 18,
  "theme": "DARK"
}
```

### 更新音效設定
```bash
PUT /api/settings/audio
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "musicVolume": 80,
  "soundVolume": 90,
  "musicEnabled": true,
  "soundEnabled": true
}
```

### 更新震動設定
```bash
PUT /api/settings/vibration
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "vibrationEnabled": true,
  "vibrationStrength": 75
}
```

## 🗄️ 數據庫結構

### 用戶表 (users)
- `id`: 用戶ID
- `email`: 電子郵件
- `username`: 用戶名
- `passwordHash`: 加密密碼
- `avatarUrl`: 頭像URL
- `bio`: 個人簡介
- `trainerLevel`: 訓練師等級
- `gems`: 寶石數量
- `coins`: 金幣數量

### 語言設定表 (language_preferences)
- `userId`: 用戶ID
- `primaryLang`: 主要語言 (zh-TW/zh-CN/en-US)
- `fontSize`: 字體大小
- `theme`: 主題 (LIGHT/DARK)
- `autoDetect`: 自動偵測語言

### 用戶設定表 (user_settings)
- `userId`: 用戶ID
- `musicVolume`: 音樂音量 (0-100)
- `soundVolume`: 音效音量 (0-100)
- `musicEnabled`: 音樂啟用
- `soundEnabled`: 音效啟用
- `vibrationEnabled`: 震動啟用
- `vibrationStrength`: 震動強度 (0-100)

## 🔍 測試系統

### 運行測試腳本
```bash
node test-system.js
```

### 測試項目
1. 健康檢查
2. 語言列表
3. 用戶註冊
4. 用戶登入
5. 取得設定
6. 更新語言設定
7. 更新音效設定
8. 更新震動設定

## 🎯 使用範例

### 範例1: 註冊新用戶
```javascript
const response = await fetch('http://localhost:3001/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'newuser@nightasaur.com',
    username: 'new_player',
    password: 'secure_password'
  })
});
```

### 範例2: 更新遊戲設定
```javascript
const response = await fetch('http://localhost:3001/api/settings/audio', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    musicVolume: 70,
    soundVolume: 80,
    musicEnabled: true,
    soundEnabled: true
  })
});
```

### 範例3: 切換語言
```javascript
const response = await fetch('http://localhost:3001/api/settings/language', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    primaryLang: 'zh-CN', // 切換到簡體中文
    fontSize: 16,
    theme: 'LIGHT'
  })
});
```

## 🔒 安全功能

### JWT 身份驗證
- 所有受保護API都需要JWT令牌
- 令牌有效期: 7天
- 自動令牌驗證中間件

### 密碼加密
- 使用bcryptjs進行密碼加密
- 安全密碼存儲
- 自動密碼驗證

## 📊 系統狀態

### 運行狀態
- ✅ 服務器運行中: http://localhost:3001
- ✅ 數據庫連接: Prisma + SQLite
- ✅ 身份驗證: JWT
- ✅ 語言系統: 繁體中文/簡體中文/英文
- ✅ 設定系統: 音效/震動設定

### 默認帳號
- **管理員**: admin@nightasaur.com / admin123
- **測試用戶**: test@nightasaur.com / test123

## 🛠️ 開發指南

### 環境要求
- Node.js 18+
- TypeScript
- Prisma ORM
- SQLite 數據庫

### 安裝依賴
```bash
npm install express cors bcryptjs jsonwebtoken @prisma/client
npm install -D typescript tsx @types/express @types/cors @types/bcryptjs @types/jsonwebtoken
```

### 數據庫遷移
```bash
cd apps/backend
npx prisma migrate dev
node migrate.js
```

## 📞 支援

### 常見問題
1. **服務器無法啟動**: 檢查端口3001是否被佔用
2. **數據庫連接失敗**: 運行 `npx prisma migrate dev`
3. **API返回錯誤**: 檢查請求格式和授權令牌

### 故障排除
- 檢查服務器日誌
- 驗證數據庫連接
- 確認環境變量設置

---

## 🎉 完成狀態

✅ **已完成功能:**
- 用戶註冊/登入系統
- JWT身份驗證
- 多語言設定管理
- 音效/震動設定
- 完整的API接口
- 測試腳本
- 使用文檔

🚀 **下一步計劃:**
- 整合到前端應用
- 添加更多遊戲功能
- 實現實時通知
- 添加管理員面板

---

**版本**: v2.0  
**最後更新**: 2026年9月5日  
**主要語言**: 繁體中文  
**開發者**: Nightasaur 團隊