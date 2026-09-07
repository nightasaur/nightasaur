@echo off
echo ========================================
echo Nightasaur 開源啟動助手
echo ========================================
echo.

REM 檢查當前目錄
if not exist "apps" (
    echo 錯誤：請在Nightasaur根目錄運行此腳本
    pause
    exit /b 1
)

echo [1/6] 檢查必要文件...
if not exist "LICENSE" (
    echo 創建LICENSE文件...
    copy /Y "LICENSE" "LICENSE.backup" >nul 2>&1
    echo MIT License > LICENSE
    echo. >> LICENSE
    echo Copyright (c) 2026 Nightasaur Team >> LICENSE
    echo. >> LICENSE
    type "c:\Nightasaur\LICENSE" >> LICENSE 2>nul
)

if not exist "CONTRIBUTING.md" (
    echo 創建CONTRIBUTING.md...
    copy /Y "c:\Nightasaur\CONTRIBUTING.md" "CONTRIBUTING.md" >nul 2>&1
)

if not exist "CODE_OF_CONDUCT.md" (
    echo 創建CODE_OF_CONDUCT.md...
    copy /Y "c:\Nightasaur\CODE_OF_CONDUCT.md" "CODE_OF_CONDUCT.md" >nul 2>&1
)

echo [2/6] 檢查環境配置...
if not exist ".env.example" (
    echo 創建.env.example...
    echo # Nightasaur Environment Variables > .env.example
    echo # Copy this file to .env and fill in your values >> .env.example
    echo. >> .env.example
    echo # Database >> .env.example
    echo DATABASE_URL="postgresql://user:password@localhost:5432/nightasaur" >> .env.example
    echo. >> .env.example
    echo # JWT >> .env.example
    echo JWT_SECRET="your-secret-key-here-change-in-production" >> .env.example
    echo JWT_EXPIRES_IN="7d" >> .env.example
    echo. >> .env.example
    echo # Server >> .env.example
    echo PORT=3002 >> .env.example
    echo HOST=localhost >> .env.example
    echo. >> .env.example
    echo # AI Engine >> .env.example
    echo OLLAMA_URL="http://localhost:11434" >> .env.example
    echo OLLAMA_MODEL="llama3.2:latest" >> .env.example
    echo COMFYUI_URL="http://localhost:8188" >> .env.example
    echo. >> .env.example
    echo # Frontend >> .env.example
    echo VITE_API_URL="http://localhost:3002" >> .env.example
)

echo [3/6] 檢查敏感信息...
echo 檢查可能包含敏感信息的文件...
findstr /i /s "password\|secret\|key\|token" *.ts *.js *.py *.json 2>nul | findstr /v "node_modules" > sensitive_check.txt
if %errorlevel% equ 0 (
    echo 警告：發現可能包含敏感信息的文件
    echo 請檢查 sensitive_check.txt
) else (
    echo 未發現明顯的敏感信息
    del sensitive_check.txt 2>nul
)

echo [4/6] 準備Git倉庫...
if not exist ".git" (
    echo 初始化Git倉庫...
    git init
    git add .
    git commit -m "Initial commit: Nightasaur v1.0.0"
    echo.
    echo Git倉庫已初始化
    echo 請執行以下命令推送到GitHub：
    echo   git remote add origin https://github.com/YOUR-USERNAME/nightasaur.git
    echo   git branch -M main
    echo   git push -u origin main
) else (
    echo Git倉庫已存在
    git status
)

echo [5/6] 創建開源文檔...
echo 創建開源指南文件...
if not exist "docs" mkdir docs
copy /Y "c:\Nightasaur\OPENSOURCE_PERSONAL_AI_PLAN.md" "docs/OPENSOURCE_PLAN.md" >nul 2>&1
copy /Y "c:\Nightasaur\GITHUB_OPENSOURCE_CHECKLIST.md" "docs/GITHUB_CHECKLIST.md" >nul 2>&1
copy /Y "c:\Nightasaur\PERSONAL_AI_EXTENSION_GUIDE.md" "docs/PERSONAL_AI_GUIDE.md" >nul 2>&1
copy /Y "c:\Nightasaur\QUICK_OPENSOURCE_GUIDE.md" "docs/QUICK_START_GUIDE.md" >nul 2>&1

echo [6/6] 生成總結報告...
echo 創建開源準備總結...
copy /Y "c:\Nightasaur\COMPLETE_OPENSOURCE_RESOURCE_SUMMARY.md" "docs/OPENSOURCE_SUMMARY.md" >nul 2>&1

echo.
echo ========================================
echo 開源準備完成！
echo ========================================
echo.
echo 下一步行動：
echo 1. 檢查 sensitive_check.txt（如果存在）
echo 2. 更新 .env.example 中的配置
echo 3. 推送到GitHub倉庫
echo 4. 添加個人AI功能（參考 docs/PERSONAL_AI_GUIDE.md）
echo 5. 發布第一個版本
echo.
echo 詳細指南請查看 docs/ 目錄
echo ========================================
pause