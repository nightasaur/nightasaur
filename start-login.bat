@echo off
echo ===========================================
echo 🦖 Nightasaur 登入系統啟動腳本 🦖
echo ===========================================
echo.
echo 正在啟動服務器...

cd /d C:\Nightasaur\apps\backend

echo.
echo 檢查Node.js版本...
node --version

echo.
echo 檢查依賴包...
if not exist node_modules (
  echo 安裝依賴包...
  npm install
) else (
  echo 依賴包已安裝
)

echo.
echo 啟動登入測試服務器...
echo 服務器將在 http://localhost:3002 運行
echo 管理員帳號: admin@nightasaur.com / admin123
echo.

npx tsx test-login-server.ts

pause