@echo off
chcp 65001 >nul
title Nightasaur Deploy Assistant
color 0B

echo ================================================
echo    🚀 Nightasaur 全平台部署助手
echo ================================================
echo.

:main_menu
echo.
echo 部署功能選單
echo ------------------------------------------------
set /p choice="請選擇 (0-5): "

if "%choice%"=="1" goto deploy_frontend
if "%choice%"=="2" goto deploy_backend
if "%choice%"=="3" goto deploy_ai
if "%choice%"=="4" goto deploy_all
if "%choice%"=="5" goto show_guide
if "%choice%"=="0" exit /b

echo 無效選擇，請重新輸入
timeout /t 2 >nul
goto main_menu

:deploy_frontend
echo.
echo ===== 部署前端到 Vercel =====
echo.
echo 步驟 1: 安裝 Vercel CLI
echo   npm install -g vercel
echo.
echo 步驟 2: 登入 Vercel
echo   vercel login
echo.
echo 步驟 3: 部署前端
echo   cd c:\Nightasaur
echo   vercel --prod
echo.
echo 步驟 4: 設定 VITE_API_URL
echo   在 Vercel 專案設定 Environment Variables 中：
echo   VITE_API_URL = https://nightasaur-api.up.railway.app
echo.
:deploy_backend
echo.
echo ===== 部署後端到 Railway =====
echo.
echo 步驟 1: 安裝 Railway CLI
echo   npm install -g @railway/cli
echo.
echo 步驟 2: 登入 Railway
echo   railway login
echo.
echo 步驟 3: 初始化 Railway 專案
echo   railway init
echo.
echo 步驟 4: 創建 PostgreSQL 資料庫
echo   railway add postgres
echo.
echo 步驟 5: 創建 Redis
echo   railway add redis
echo.
echo 步驟 6: 部署後端
echo   railway up --service nightasaur-backend -d apps/backend
echo.
echo 步驟 7: 設定環境變數
echo   railway env set JWT_SECRET=your-secret-key-here
echo   railway env set CORS_ORIGIN=https://nightasaur-web.vercel.app
echo   railway env set AI_ENGINE_URL=https://nightasaur-ai.up.railway.app
echo.
echo 完成後的 API 網址：
echo   https://nightasaur-api.up.railway.app
echo.
pause
goto main_menu
:deploy_ai
echo.
echo ===== 部署 AI Engine 到 Railway =====
echo.
echo 注意：AI Engine 需要 Ollama 支援
echo Railway 不支援 GPU，Ollama 需部署在 VPS
echo.
echo 部署步驟:
echo   cd c:\Nightasaur
echo   railway up --service nightasaur-ai -d apps/ai-engine
echo.
echo 設定 Ollama 連線:
echo   railway env set OLLAMA_URL=http://your-vps-ip:11434
echo   railway env set OLLAMA_MODEL=qwen2.5:3b
echo.
echo 完成後的 AI Engine 網址：
echo   https://nightasaur-ai.up.railway.app
echo.
pause
goto main_menu
:deploy_all
echo.
echo ===== 一鍵全平台部署 =====
echo.
echo 檢查必要工具...
where vercel >nul 2>&1
if %errorlevel% neq 0 (
    echo 請先安裝 Vercel CLI: npm install -g vercel
    pause
    goto main_menu
)
where railway >nul 2>&1
if %errorlevel% neq 0 (
    echo 請先安裝 Railway CLI: npm install -g @railway/cli
    pause
    goto main_menu
)
echo 所有必要工具已安裝
echo.

echo [1/5] 構建前端...
cd /d c:\Nightasaur\apps\web
call npm install
call npx vite build
if %errorlevel% neq 0 (
    echo 前端構建失敗
    pause
    goto main_menu
)
echo 前端構建成功

echo [2/5] 部署前端到 Vercel...
cd /d c:\Nightasaur
call vercel --prod --yes
echo 前端部署完成

echo [3/5] 部署後端到 Railway...
cd /d c:\Nightasaur\apps\backend
call railway up --service nightasaur-backend
echo 後端部署完成

echo [4/5] 部署 AI Engine 到 Railway...
cd /d c:\Nightasaur\apps\ai-engine
call railway up --service nightasaur-ai
echo AI Engine 部署完成

echo [5/5] 設定環境變數...
:show_guide
echo.
echo ===== 部署指南 =====
echo.
echo 請查看 c:\Nightasaur\deploy\DEPLOYMENT_GUIDE.md
echo 包含完整部署步驟和配置說明
echo.
pause
goto main_menu
echo 請在 Railway Dashboard 中設定：
echo - JWT_SECRET, CORS_ORIGIN, AI_ENGINE_URL, OLLAMA_URL
echo.

echo ===== 全平台部署完成！ =====
echo 前端網址: https://nightasaur-web.vercel.app
echo API 網址: https://nightasaur-api.up.railway.app
echo AI 網址:  https://nightasaur-ai.up.railway.app
echo.
pause
goto main_menu
echo 完成後的前端網址：
echo   https://nightasaur-web.vercel.app
echo.
pause
goto main_menu
echo  [1] 🌐 部署前端到 Vercel
echo  [2] 🔧 部署後端到 Railway
echo  [3] 🧠 部署 AI Engine 到 Railway
echo  [4] 🚀 一鍵全平台部署
echo  [5] 📖 查看部署指南
echo  [0] ❌ 退出
echo ------------------------------------------------
echo.