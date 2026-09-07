# Nightasaur 資料庫系統移植到網頁 - 完整指南

## 概述

我已經成功將 Prisma 資料庫系統移植到您的網頁應用程式中。以下是完整的解決方案：

## 檔案結構

### 後端 (Backend)
```
apps/backend/prisma/
├── schema.prisma          # 主要的資料庫 schema
├── schema-new.prisma      # 簡化的 schema 備份
├── fixed-schema.prisma    # 修復的完整 schema
├── init-db.ts            # 資料庫初始化腳本
└── dev.db                # SQLite 資料庫檔案
```

### 前端 (Web)
```
apps/web/src/
├── api/
│   └── index.ts          # API 客戶端
├── hooks/
│   └── useApi.ts         # React Hooks for API
└── components/           # React 組件
```

## 資料庫 Schema

已建立的模型：

### 核心模型
1. **User** - 用戶模型
2. **LanguagePreference** - 語言設定
3. **UserSettings** - 用戶設定
4. **PasswordResetToken** - 密碼重置令牌

### 精靈系統
5. **Spirit** - 精靈模型

### 物品系統
6. **Item** - 物品
7. **UserItem** - 用戶物品

### 任務系統
8. **Quest** - 任務
9. **QuestProgress** - 任務進度

## API 系統

### 前端 API 客戶端 (`src/api/index.ts`)
- 完整的 TypeScript API 客戶端
- 自動處理身份驗證令牌
- 錯誤處理和攔截器
- 模組化的 API 分類：
  - `userAPI` - 用戶相關操作
  - `spiritAPI` - 精靈相關操作
  - `itemAPI` - 物品相關操作
  - `questAPI` - 任務相關操作
  - `settingsAPI` - 設定相關操作
  - `healthAPI` - 健康檢查

### React Hooks (`src/hooks/useApi.ts`)
- `useApi` - 通用的 API 數據 Hook
- `useUser` - 用戶數據管理
- `useSpirits` - 精靈數據管理
- `useSpirit` - 單個精靈數據
- `useItems` - 物品數據管理
- `useQuests` - 任務數據管理
- `useSettings` - 設定數據管理
- `useApiHealth` - API 健康狀態檢查

## 使用指南

### 1. 初始化資料庫
```bash
cd apps/backend
npx tsx prisma/init-db.ts
```

### 2. 啟動後端服務
```bash
cd apps/backend
npm run dev
```

### 3. 啟動前端服務
```bash
cd apps/web
npm run dev
```

### 4. 在 React 組件中使用

```typescript
// 示例：用戶登入組件
import React, { useState } from 'react';
import { useUser } from '../hooks/useApi';

function LoginForm() {
  const { login, loading, error } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      // 登入成功，跳轉到主頁
    } catch (err) {
      // 錯誤已在 hook 中處理
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit" disabled={loading}>
        {loading ? '登入中...' : '登入'}
      </button>
    </form>
  );
}
```

```typescript
// 示例：顯示精靈列表
import React from 'react';
import { useSpirits } from '../hooks/useApi';

function SpiritList() {
  const { data: spirits, loading, error, refetch } = useSpirits();

  if (loading) return <div>載入中...</div>;
  if (error) return <div>錯誤: {error}</div>;

  return (
    <div>
      <h2>我的精靈</h2>
      <button onClick={refetch}>重新整理</button>
      <ul>
        {spirits?.map((spirit: any) => (
          <li key={spirit.id}>
            <h3>{spirit.name}</h3>
            <p>屬性: {spirit.element}</p>
            <p>等級: {spirit.level}</p>
            <p>階段: {spirit.stage}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## API 端點

### 用戶相關
- `POST /api/auth/register` - 註冊新用戶
- `POST /api/auth/login` - 用戶登入
- `GET /api/auth/me` - 獲取當前用戶信息
- `PUT /api/auth/profile` - 更新用戶資料

### 精靈相關
- `GET /api/spirits` - 獲取用戶的所有精靈
- `GET /api/spirits/:id` - 獲取單個精靈
- `POST /api/spirits` - 創建新精靈
- `PUT /api/spirits/:id` - 更新精靈
- `DELETE /api/spirits/:id` - 刪除精靈
- `POST /api/spirits/:id/converse` - 與精靈對話

### 物品相關
- `GET /api/items` - 獲取所有物品
- `GET /api/items/user` - 獲取用戶的物品
- `POST /api/items/purchase` - 購買物品
- `POST /api/items/use` - 使用物品

### 任務相關
- `GET /api/quests` - 獲取所有任務
- `GET /api/quests/user` - 獲取用戶的任務進度
- `POST /api/quests/:id/start` - 開始任務
- `PUT /api/quests/:id/progress` - 更新任務進度
- `POST /api/quests/:id/complete` - 完成任務
- `POST /api/quests/:id/claim` - 領取任務獎勵

### 設定相關
- `GET /api/settings` - 獲取用戶設定
- `PUT /api/settings` - 更新用戶設定
- `GET /api/settings/language` - 獲取語言設定
- `PUT /api/settings/language` - 更新語言設定

## 擴展指南

### 添加新模型
1. 在 `schema.prisma` 中添加新模型
2. 運行 `npx prisma generate` 生成 Prisma Client
3. 在後端創建對應的 API 路由
4. 在前端 `api/index.ts` 中添加對應的 API 函數
5. 在 `hooks/useApi.ts` 中添加對應的 Hook

### 添加新功能
1. 使用現有的 API 客戶端和 Hooks
2. 創建新的 React 組件
3. 使用 TypeScript 確保類型安全
4. 添加適當的錯誤處理

## 測試數據

初始化腳本會創建以下測試數據：
- 測試用戶: `test@nightasaur.com` / `testuser`
- 測試精靈: "小火龍" (火屬性)
- 測試物品: "精靈球"
- 測試任務: "新手訓練"

## 故障排除

### 常見問題
1. **資料庫連接錯誤**: 檢查 `.env` 檔案中的 `DATABASE_URL`
2. **API 連接錯誤**: 確保後端服務正在運行 (http://localhost:3000)
3. **權限錯誤**: 檢查 Prisma Client 生成是否成功
4. **CORS 錯誤**: 檢查後端的 CORS 設定

### 解決方案
1. 重新生成 Prisma Client: `npx prisma generate`
2. 重啟後端服務
3. 清除瀏覽器緩存
4. 檢查網路連接

## 下一步

1. **完善後端 API**: 實現所有定義的 API 端點
2. **添加更多模型**: 擴展資料庫 schema
3. **優化前端 UI**: 創建美觀的用戶界面
4. **添加實時功能**: 使用 WebSocket 或 Server-Sent Events
5. **部署到生產環境**: 配置生產環境設定

這個解決方案提供了一個完整的、可擴展的基礎架構，可以輕鬆地添加新功能和擴展系統。