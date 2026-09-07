@echo off
chcp 65001 > nul
echo.
echo ==================================================
echo 🎮 Nightasaur 遊戲系統 - 本地啟動程序
echo ==================================================
echo.

REM 檢查 Node.js
echo 🔍 檢查環境...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 未找到 Node.js
    echo 💡 請安裝 Node.js (版本 18+)
    pause
    exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 未找到 npm
    echo 💡 npm 應該隨 Node.js 一起安裝
    pause
    exit /b 1
)

echo ✅ 環境檢查通過
echo.

REM 安裝依賴
echo 📦 安裝依賴套件...
call npm install
if %errorlevel% neq 0 (
    echo ⚠️  依賴安裝可能有問題，繼續啟動...
)
echo.

REM 設定資料庫
echo 🗄️  設定資料庫...
call npx prisma migrate deploy
call npx prisma generate
echo ✅ 資料庫設定完成
echo.

REM 啟動服務器
echo 🚀 啟動本地服務器...
echo.
echo ==================================================
echo 🌐 服務器將在以下 URL 啟動:
echo   主界面: http://localhost:3000
echo   API 文檔: http://localhost:3000/api/health
echo.
echo 📱 可用 API 端點:
echo   • 遊戲系統: http://localhost:3000/api/game
echo   • 益智系統: http://localhost:3000/api/puzzles
echo   • 小隊系統: http://localhost:3000/api/squads
echo   • AR 探索: http://localhost:3000/api/ar
echo   • 語言設定: http://localhost:3000/api/language
echo.
echo ⚙️  系統功能:
echo   • 益智升級系統 ✓
echo   • 隨從小隊系統 ✓
echo   • AR 位置探索 ✓
echo   • 多語言設定 ✓
echo.
echo 🛑 停止服務器: 按 Ctrl + C
echo ==================================================
echo.

REM 啟動開發服務器
call npm run dev

pause