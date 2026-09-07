@echo off
echo ===========================================
echo 🦖 Nightasaur 登入問題修復腳本 🦖
echo ===========================================
echo.

echo [1/3] 檢查當前配置...
echo.

cd C:\Nightasaur\apps\web

if not exist vite.config.ts (
    echo ❌ 找不到 vite.config.ts
    pause
    exit /b 1
)

echo ✅ 找到 vite.config.ts
echo.

echo [2/3] 備份原有配置...
echo.

copy vite.config.ts vite.config.ts.backup
if %errorlevel% equ 0 (
    echo ✅ 已備份為 vite.config.ts.backup
) else (
    echo ⚠️  備份失敗，繼續執行...
)

echo.

echo [3/3] 修復代理配置...
echo.

REM 創建新的Vite配置
(
echo import { defineConfig } from "vite";
echo import react from "@vitejs/plugin-react";
echo import path from "path";
echo.
echo export default defineConfig({
echo   plugins: [react()],
echo   resolve: {
echo     alias: {
echo       "@": path.resolve(__dirname, "./src"),
echo     },
echo   },
echo   server: {
echo     port: 5173,
echo     proxy: {
echo       "/api/auth": {
echo         target: "http://localhost:3002",
echo         changeOrigin: true,
echo       },
echo       "/api": {
echo         target: "http://localhost:3000",
echo         changeOrigin: true,
echo       }
echo     },
echo   },
echo });
) > vite.config.ts

echo ✅ Vite配置已更新！
echo.

echo ===========================================
echo 📋 修復完成！
echo ===========================================
echo.
echo 新的代理配置：
echo   1. /api/auth → http://localhost:3002 (登入API)
echo   2. /api/*    → http://localhost:3000 (其他API)
echo.
echo 請重新啟動遊戲前台服務器：
echo   cd C:\Nightasaur\apps\web
echo   npm run dev
echo.
echo 💡 提示：也可以使用整合登入界面：
echo   file:///C:/Nightasaur/login-simple.html
echo.
echo 📞 支援信箱：service@nightasaur.com
echo.
pause