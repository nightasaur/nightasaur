@echo off
echo ===========================================
echo 🦖 Nightasaur 完整系統啟動腳本 🦖
echo ===========================================
echo.
echo 正在啟動所有系統...
echo.

REM 設置顏色
color 0B

echo [1/3] 檢查系統狀態...
echo.

REM 檢查Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 未找到Node.js，請先安裝Node.js
    pause
    exit /b 1
)
echo ✅ Node.js 已安裝

REM 檢查目錄
if not exist "C:\Nightasaur\apps\backend\" (
    echo ❌ 找不到後台目錄
    pause
    exit /b 1
)

if not exist "C:\Nightasaur\apps\web\" (
    echo ❌ 找不到前台目錄
    pause
    exit /b 1
)

echo ✅ 目錄結構正常
echo.

echo [2/3] 檢查端口佔用...
echo.

REM 檢查端口3000
netstat -ano | findstr ":3000 " >nul
if %errorlevel% equ 0 (
    echo ⚠️  端口3000已被佔用，嘗試釋放...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000 "') do (
        taskkill /F /PID %%a >nul 2>nul
    )
    timeout /t 2 /nobreak >nul
)

REM 檢查端口5173
netstat -ano | findstr ":5173 " >nul
if %errorlevel% equ 0 (
    echo ⚠️  端口5173已被佔用，嘗試釋放...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173 "') do (
        taskkill /F /PID %%a >nul 2>nul
    )
    timeout /t 2 /nobreak >nul
)

REM 檢查端口3002
netstat -ano | findstr ":3002 " >nul
if %errorlevel% equ 0 (
    echo ⚠️  端口3002已被佔用，嘗試釋放...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3002 "') do (
        taskkill /F /PID %%a >nul 2>nul
    )
    timeout /t 2 /nobreak >nul
)

echo ✅ 端口檢查完成
echo.

echo [3/3] 啟動系統服務...
echo.

REM 啟動遊戲後台 (端口3000)
echo 🚀 啟動遊戲後台服務器...
start "Nightasaur Backend" cmd /k "cd /d C:\Nightasaur\apps\backend && npx tsx nightasaur-server.ts"
timeout /t 3 /nobreak >nul

REM 啟動遊戲前台 (端口5173)
echo 🚀 啟動遊戲前台...
start "Nightasaur Frontend" cmd /k "cd /d C:\Nightasaur\apps\web && npm run dev"
timeout /t 5 /nobreak >nul

REM 啟動登入系統 (端口3002)
echo 🚀 啟動登入系統...
start "Nightasaur Login" cmd /k "cd /d C:\Nightasaur\apps\backend && npx tsx test-login-server.ts"
timeout /t 3 /nobreak >nul

echo.
echo ===========================================
echo ✅ 所有系統啟動完成！
echo ===========================================
echo.
echo 📋 系統訪問地址：
echo.
echo    🎮 遊戲前台：http://localhost:5173
echo    🔧 遊戲後台：http://localhost:3000
echo    🔐 登入系統：http://localhost:3002
echo    🚪 整合入口：file:///C:/Nightasaur/portal.html
echo.
echo 📋 管理員帳號：
echo.
echo    電子郵件：admin@nightasaur.com
echo    用戶名：admin
echo    密碼：admin123
echo    角色：系統管理員
echo.
echo 💡 使用建議：
echo    1. 打開整合入口頁面
echo    2. 點擊「進入完整遊戲」
echo    3. 使用管理員帳號登入
echo    4. 開始遊戲！
echo.
echo 📞 支援信箱：service@nightasaur.com
echo.
echo ===========================================
echo 按任意鍵打開整合入口頁面...
pause >nul

REM 打開整合入口頁面
start "" "C:\Nightasaur\portal.html"

echo.
echo 🎉 整合入口頁面已打開！
echo 祝您遊戲愉快！ 🦖
echo.

REM 保持窗口開啟
pause