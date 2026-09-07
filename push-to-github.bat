@echo off
echo ========================================
echo Nightasaur GitHub 推送助手
echo ========================================
echo.

REM 檢查是否在正確的目錄
if not exist "apps" (
    echo 錯誤：請在Nightasaur根目錄運行此腳本
    pause
    exit /b 1
)

echo [1/4] 檢查Git狀態...
git status
echo.

echo [2/4] 設置GitHub遠程倉庫...
echo 請輸入您的GitHub用戶名：
set /p GITHUB_USERNAME=GitHub Username: 
echo.

if "%GITHUB_USERNAME%"=="" (
    echo 錯誤：請輸入GitHub用戶名
    pause
    exit /b 1
)

echo 設置遠程倉庫為：https://github.com/%GITHUB_USERNAME%/nightasaur.git
git remote remove origin 2>nul
git remote add origin https://github.com/%GITHUB_USERNAME%/nightasaur.git

echo [3/4] 設置主分支...
git branch -M main

echo [4/4] 推送代碼到GitHub...
echo 正在推送代碼，這可能需要一些時間...
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo 恭喜！Nightasaur已成功推送到GitHub！
    echo ========================================
    echo.
    echo 您的倉庫網址：
    echo https://github.com/%GITHUB_USERNAME%/nightasaur
    echo.
    echo 下一步行動：
    echo 1. 訪問上面的網址確認代碼已上傳
    echo 2. 更新README.md（可選）
    echo 3. 創建第一個Release
    echo 4. 分享到技術社區
    echo.
) else (
    echo.
    echo ========================================
    echo 推送失敗！
    echo ========================================
    echo.
    echo 可能的原因：
    echo 1. GitHub倉庫尚未創建
    echo 2. 網絡連接問題
    echo 3. 權限不足
    echo.
    echo 請先創建GitHub倉庫：
    echo 訪問 https://github.com/new
    echo 然後重新運行此腳本
    echo.
)

echo 按任意鍵繼續...
pause >nul