# Nightasaur 登入問題修復方案

## 問題分析

### 問題1：登入界面沒有眼睛符號顯示密碼
**狀態**：✅ 已解決
**解決方案**：創建了新的登入界面 `login-simple.html`，包含眼睛符號功能

### 問題2：遊戲前台登入失敗
**錯誤**：`http://localhost:5173/login` 使用 `admin@nightasaur.com / admin123` 登入失敗
**原因**：
1. 遊戲前台（端口5173）的Vite配置將 `/api` 代理到 `http://localhost:3000`
2. 但登入API運行在測試服務器 `http://localhost:3002`
3. 遊戲後台（端口3000）可能沒有配置登入API

## 解決方案

### 方案A：修改Vite配置（推薦）
修改 `C:\Nightasaur\apps\web\vite.config.ts`，將登入API代理到正確的服務器：

```javascript
// vite.config.ts
export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api/auth': {
        target: 'http://localhost:3002',  // 登入API在端口3002
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:3000',  // 其他API在端口3000
        changeOrigin: true,
      }
    }
  }
});
```

### 方案B：使用整合登入界面
使用已經創建的整合登入界面：

1. **訪問**：`file:///C:/Nightasaur/login-simple.html`
2. **功能**：
   - ✅ 眼睛符號顯示/隱藏密碼
   - ✅ 預填管理員帳號
   - ✅ 登入成功後自動跳轉到遊戲界面
   - ✅ 支援信箱顯示

## 立即實施

### 步驟1：使用整合登入界面（最簡單）
```bash
# 1. 打開整合登入界面
file:///C:/Nightasaur/login-simple.html

# 2. 使用管理員帳號登入
#    電子郵件: admin@nightasaur.com
#    密碼: admin123

# 3. 自動跳轉到遊戲界面
#    http://localhost:5173/dashboard
```

### 步驟2：修改Vite配置（永久解決）
```bash
# 1. 備份原有配置
cd C:\Nightasaur\apps\web
copy vite.config.ts vite.config.ts.backup

# 2. 修改vite.config.ts
#    將登入API代理到端口3002
```

## 創建的文件

### 1. `login-simple.html`
- ✅ 眼睛符號顯示/隱藏密碼功能
- ✅ 現代化深色主題設計
- ✅ 管理員帳號預填
- ✅ 自動跳轉到遊戲界面

### 2. `LOGIN_FIX_SOLUTION.md`（本文件）
- ✅ 問題分析
- ✅ 多種解決方案
- ✅ 逐步實施指南

## 系統訪問方式

### 方式1：整合登入（推薦）
```
1. 訪問: file:///C:/Nightasaur/login-simple.html
2. 登入: admin@nightasaur.com / admin123
3. 跳轉: 自動到 http://localhost:5173/dashboard
```

### 方式2：直接遊戲登入（需修復）
```
1. 訪問: http://localhost:5173
2. 點擊登入按鈕
3. 輸入帳號登入（目前失敗，需修復）
```

## 管理員帳號

```
📧 電子郵件: admin@nightasaur.com
👤 用戶名: admin
🔑 密碼: admin123
🎭 角色: 系統管理員
📞 支援: service@nightasaur.com
```

## 總結

### 已完成
✅ 創建了帶眼睛符號的登入界面  
✅ 診斷出遊戲前台登入失敗的原因  
✅ 提供了多種解決方案  

### 建議實施
1. **短期**：使用 `login-simple.html` 進行登入
2. **中期**：修改Vite配置，永久解決代理問題

### 立即行動
```bash
# 最簡單的解決方案：
# 1. 打開 file:///C:/Nightasaur/login-simple.html
# 2. 點擊登入按鈕
# 3. 自動進入遊戲界面
```