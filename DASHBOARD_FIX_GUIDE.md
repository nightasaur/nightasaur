# 🎮 Nightasaur 儀表板和精靈創建系統 - 完整測試指南

## ✅ 後端狀態確認
- ✅ 後端運行在：http://localhost:3002
- ✅ 資料庫連接正常
- ✅ 預設帳號已存在
- ✅ API 全部正常工作

## 🔧 修復的問題
1. **Prisma 字段名大小寫**：`spirits` → `Spirits`
2. **authService 修復**：正確使用 `Spirits` 字段
3. **端口配置**：前端代理到正確的 3002 端口

## 🚀 啟動步驟

### 步驟 1：確保後端運行
```bash
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
2. 使用以下帳號：
   - 管理員：`admin@nightasaur.com` / `admin123!`
   - 示範：`demo@nightasaur.com` / `demo1234`

### 步驟 4：訪問儀表板
登入後應該自動跳轉到：http://localhost:5173/dashboard

## 📊 儀表板應該顯示的內容

### 如果使用者有精靈：
1. **歡迎訊息**：歡迎回來，[使用者名稱] 🌙
2. **統計卡片**：
   - 精靈小隊數量
   - 總對話次數
   - 孵化新精靈按鈕
3. **精靈列表**：顯示使用者的精靈卡片

### 如果使用者沒有精靈：
1. **歡迎訊息**：歡迎回來，[使用者名稱] 🌙
2. **統計卡片**：精靈小隊數量為 0
3. **提示訊息**：顯示「還沒有精靈！快來孵化第一隻吧」
4. **孵化精靈按鈕**

## 🛠️ 如果儀表板仍然空白

### 檢查 1：瀏覽器開發者工具
按 F12 打開開發者工具，檢查：
- **Console 標籤**：是否有 JavaScript 錯誤
- **Network 標籤**：API 請求是否成功
- **Application 標籤**：localStorage 是否有 `nightasaur_token`

### 檢查 2：API 請求
在 Network 標籤中檢查以下請求：
1. `GET /api/auth/me` - 應該返回 200 狀態碼
2. `GET /api/spirits` - 應該返回精靈列表

### 檢查 3：localStorage
```javascript
// 在瀏覽器控制台執行
console.log('Token:', localStorage.getItem('nightasaur_token'));
console.log('User:', localStorage.getItem('nightasaur_user'));
```

**應該有：**
- `nightasaur_token`: JWT 令牌
- `nightasaur_user`: 使用者資料（可選）

## 🎮 精靈創建流程

### 1. 訪問創建頁面
點擊儀表板上的「+ 孵化新精靈」按鈕，或訪問：
http://localhost:5173/spirits/new

### 2. 創建精靈
1. 輸入精靈名字
2. 選擇元素屬性
3. 點擊「✨ 孵化精靈」

### 3. 成功後
- 自動跳轉到精靈詳情頁面
- 儀表板會顯示新創建的精靈

## 🔧 常見問題解決

### 問題 1：儀表板空白，Console 有錯誤
**解決**：檢查錯誤訊息，可能是：
- API 請求失敗：檢查後端是否運行
- 令牌無效：重新登入
- React 渲染錯誤：檢查組件代碼

### 問題 2：無法創建精靈
**解決**：
1. 檢查是否選擇了元素屬性
2. 檢查精靈名字是否為空
3. 檢查 API 錯誤訊息

### 問題 3：精靈列表不顯示
**解決**：
1. 檢查 `GET /api/spirits` 是否返回資料
2. 檢查 React 組件是否正確渲染

## 📝 API 端點測試

### 測試儀表板資料
```bash
curl -H "Authorization: Bearer <token>" http://localhost:3002/api/auth/me
```

### 測試精靈列表
```bash
curl -H "Authorization: Bearer <token>" http://localhost:3002/api/spirits
```

### 測試創建精靈
```bash
curl -X POST -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"火焰龍","element":"FIRE"}' \
  http://localhost:3002/api/spirits
```

## 🎉 完成！
現在你的 Nightasaur 應該可以：
1. ✅ 正常登入
2. ✅ 顯示儀表板
3. ✅ 創建精靈
4. ✅ 查看精靈列表

如果還有問題，請提供瀏覽器控制台的錯誤訊息，我可以進一步幫助你！