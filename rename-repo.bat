# Nightasaur GitHub倉庫重命名指南

## 重命名步驟

### 步驟1：訪問倉庫設置
1. **打開瀏覽器**，訪問：https://github.com/nightasaur/co/settings
2. **登錄**您的GitHub帳戶（如果需要）

### 步驟2：找到重命名選項
1. 在左側菜單中找到 **"General"** 選項
2. 向下滾動到 **"Repository name"** 部分
3. 您會看到當前名稱：`co`

### 步驟3：重命名倉庫
1. **刪除** `co`
2. **輸入** `nightasaur`
3. **點擊** "Rename" 按鈕

### 步驟4：確認更改
1. GitHub會顯示確認信息
2. 點擊 "I understand, rename this repository"
3. 等待重命名完成（幾秒鐘）

## 重命名後的重要更新

### 更新本地Git遠程倉庫
重命名後，您需要更新本地Git配置：

```bash
# 進入Nightasaur目錄
cd c:\Nightasaur

# 查看當前的遠程倉庫
git remote -v

# 更新遠程倉庫URL
git remote set-url origin https://github.com/nightasaur/nightasaur.git

# 驗證更新
git remote -v
```

### 創建更新腳本
我已經為您創建了自動更新腳本：



<｜DSML｜function_calls>
<｜DSML｜invoke name="editor">
<｜DSML｜parameter name="new_text" string="true">@echo off
echo ========================================
echo Nightasaur 倉庫重命名助手
echo ========================================
echo.

REM 檢查是否在正確的目錄
if not exist "apps" (
    echo 錯誤：請在Nightasaur根目錄運行此腳本
    pause
    exit /b 1
)

echo [1/5] 檢查當前Git設置...
git remote -v
echo.

echo [2/5] 更新遠程倉庫URL...
echo 正在將遠程倉庫從 https://github.com/nightasaur/co.git
echo 更新為 https://github.com/nightasaur/nightasaur.git
echo.

git remote set-url origin https://github.com/nightasaur/nightasaur.git

echo [3/5] 驗證更新...
git remote -v
echo.

echo [4/5] 測試連接...
git fetch origin
if %errorlevel% equ 0 (
    echo ✓ 連接成功！遠程倉庫已更新
    echo.
    echo 新的倉庫網址：
    echo https://github.com/nightasaur/nightasaur
    echo.
) else (
    echo ✗ 連接失敗！請檢查：
    echo 1. 倉庫是否已重命名為 'nightasaur'
    echo 2. 網絡連接是否正常
    echo 3. GitHub倉庫是否存在
    echo.
)

echo [5/5] 推送測試（可選）...
set /p PUSH_TEST=是否要進行推送測試？(y/n): 
if /i "%PUSH_TEST%"=="y" (
    echo 正在推送測試...
    git push origin main
    if %errorlevel% equ 0 (
        echo ✓ 推送成功！倉庫重命名完成
    ) else (
        echo ✗ 推送失敗，但遠程URL已更新
    )
)

echo.
echo ========================================
echo 重命名完成！
echo ========================================
echo.
echo 重要提醒：
echo 1. 請確保GitHub倉庫已從 'co' 重命名為 'nightasaur'
echo 2. 舊網址 https://github.com/nightasaur/co 會自動重定向
echo 3. 所有Git操作現在使用新URL
echo.
echo 按任意鍵繼續...
pause >nul