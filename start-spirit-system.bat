@echo off
echo ===========================================
echo 🦖 Nightasaur 精靈系統 v2.0 啟動腳本
echo ===========================================
echo.

REM 檢查 Node.js 是否安裝
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 錯誤: Node.js 未安裝！
    echo 請先安裝 Node.js: https://nodejs.org/
    pause
    exit /b 1
)

REM 檢查 npm 是否安裝
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 錯誤: npm 未安裝！
    echo 請確保 Node.js 安裝包含 npm
    pause
    exit /b 1
)

echo ✅ 檢查環境完成
echo.

REM 進入後台目錄
cd /d "C:\Nightasaur\apps\backend"

echo 📦 安裝依賴包...
call npm install
if %errorlevel% neq 0 (
    echo ❌ 錯誤: 依賴安裝失敗！
    pause
    exit /b 1
)

echo ✅ 依賴安裝完成
echo.

echo 🗃️ 準備數據庫...
npx prisma generate
if %errorlevel% neq 0 (
    echo ⚠️ 警告: Prisma 生成失敗，嘗試繼續...
)

echo.
echo 🚀 啟動 Nightasaur 精靈系統 v2.0...
echo ===========================================

REM 設置環境變量
set PORT=3001
set NODE_ENV=development

echo.
echo 📊 系統信息:
echo   服務器端口: %PORT%
echo   環境模式: %NODE_ENV%
echo   主要語言: 繁體中文
echo.

echo 📝 可用 API:
echo   GET  http://localhost:%PORT%/api/health
echo   GET  http://localhost:%PORT%/api/system/status
echo   GET  http://localhost:%PORT%/api/spirit-systems/naming/suggestions?element=FIRE
echo   POST http://localhost:%PORT%/api/spirit-systems/hatching/start
echo   GET  http://localhost:%PORT%/api/spirit-systems/hatching/status/:id
echo.

echo 🎮 系統功能:
echo   ✅ 命名系統 (多語言/多風格)
echo   ✅ 孵化系統 (環境模擬/互動)
echo   🔧 外觀系統 (動物園主題/基因)
echo   ✅ 精靈管理 (創建/進化/自定義)
echo.

echo ⏳ 正在啟動服務器...
echo.

REM 啟動服務器
node complete-spirit-server.ts

if %errorlevel% neq 0 (
    echo.
    echo ❌ 錯誤: 服務器啟動失敗！
    echo 可能的原因:
    echo   1. 端口 %PORT% 已被佔用
    echo   2. 依賴包缺失
    echo   3. TypeScript 編譯錯誤
    echo.
    echo 🔧 故障排除:
    echo   - 檢查端口: netstat -ano | findstr :%PORT%
    echo   - 重新安裝: npm ci
    echo   - 檢查日誌: 查看控制台輸出
    pause
    exit /b 1
)