@echo off
REM Nightasaur 專案備份腳本
REM 使用方式: backup.bat [選項]
REM 選項:
REM   -env    只備份環境變數
REM   -db     只備份資料庫設定
REM   -config 只備份設定檔
REM   -all    完整備份（預設）

echo ========================================
echo   Nightasaur 專案備份工具
echo ========================================
echo.

set BACKUP_DIR=backup
set TIMESTAMP=%DATE:~0,4%%DATE:~5,2%%DATE:~8,2%_%TIME:~0,2%%TIME:~3,2%

REM 建立備份目錄
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"
if not exist "%BACKUP_DIR%\env" mkdir "%BACKUP_DIR%\env"
if not exist "%BACKUP_DIR%\database" mkdir "%BACKUP_DIR%\database"
if not exist "%BACKUP_DIR%\config" mkdir "%BACKUP_DIR%\config"
if not exist "%BACKUP_DIR%\prisma" mkdir "%BACKUP_DIR%\prisma"

if "%1"=="-env" goto BACKUP_ENV
if "%1"=="-db" goto BACKUP_DB
if "%1"=="-config" goto BACKUP_CONFIG
if "%1"=="-all" goto BACKUP_ALL
if "%1"=="" goto BACKUP_ALL

:BACKUP_ALL
echo [INFO] 開始完整備份...
call :BACKUP_ENV
call :BACKUP_DB
call :BACKUP_CONFIG
goto SUMMARY

:BACKUP_ENV
echo [INFO] 備份環境變數...
copy .env "%BACKUP_DIR%\env\env.backup_%TIMESTAMP%.txt" >nul
copy .env.local "%BACKUP_DIR%\env\env.local.backup_%TIMESTAMP%.txt" >nul
copy .env.example "%BACKUP_DIR%\env\env.example.backup_%TIMESTAMP%.txt" >nul
copy apps\backend\.env "%BACKUP_DIR%\env\backend.env.backup_%TIMESTAMP%.txt" >nul
copy apps\web\.env.example "%BACKUP_DIR%\env\web.env.example.backup_%TIMESTAMP%.txt" >nul
echo [OK] 環境變數備份完成
goto :eof

:BACKUP_DB
echo [INFO] 備份資料庫設定...
REM 備份 Prisma schema
copy apps\backend\prisma\schema.prisma "%BACKUP_DIR%\prisma\schema.prisma.backup_%TIMESTAMP%" >nul
copy apps\backend\prisma\seed.ts "%BACKUP_DIR%\prisma\seed.ts.backup_%TIMESTAMP%" >nul

REM 備份資料庫檔案（如果存在）
if exist "apps\backend\prisma\dev.db" (
    echo [INFO] 備份資料庫檔案...
    copy "apps\backend\prisma\dev.db" "%BACKUP_DIR%\database\dev.db.backup_%TIMESTAMP%" >nul
    echo [OK] 資料庫檔案備份完成
) else (
    echo [WARN] 找不到資料庫檔案: apps\backend\prisma\dev.db
)

REM 建立 schema 匯出
echo # Database Schema Export - Nightasaur > "%BACKUP_DIR%\database\schema_export_%TIMESTAMP%.md"
echo # Generated: %DATE% %TIME% >> "%BACKUP_DIR%\database\schema_export_%TIMESTAMP%.md"
echo # Source: apps/backend/prisma/schema.prisma >> "%BACKUP_DIR%\database\schema_export_%TIMESTAMP%.md"
echo. >> "%BACKUP_DIR%\database\schema_export_%TIMESTAMP%.md"
echo ## Models Count: 27 >> "%BACKUP_DIR%\database\schema_export_%TIMESTAMP%.md"
echo ## Database: SQLite >> "%BACKUP_DIR%\database\schema_export_%TIMESTAMP%.md"
echo ## Connection: file:./dev.db >> "%BACKUP_DIR%\database\schema_export_%TIMESTAMP%.md"

echo [OK] 資料庫設定備份完成
goto :eof

:BACKUP_CONFIG
echo [INFO] 備份設定檔...
copy package.json "%BACKUP_DIR%\config\root.package.json.backup_%TIMESTAMP%" >nul
copy apps\backend\package.json "%BACKUP_DIR%\config\backend.package.json.backup_%TIMESTAMP%" >nul
copy apps\web\package.json "%BACKUP_DIR%\config\web.package.json.backup_%TIMESTAMP%" >nul
copy apps\backend\src\config\index.ts "%BACKUP_DIR%\config\backend.config.ts.backup_%TIMESTAMP%" >nul
copy apps\backend\src\config\prisma.ts "%BACKUP_DIR%\config\backend.prisma.config.ts.backup_%TIMESTAMP%" >nul
echo [OK] 設定檔備份完成
goto :eof

:SUMMARY
echo.
echo ========================================
echo   備份完成摘要
echo ========================================
echo 備份時間: %DATE% %TIME%
echo 備份目錄: %BACKUP_DIR%
echo.
dir "%BACKUP_DIR%\env" /b
echo.
dir "%BACKUP_DIR%\prisma" /b
echo.
dir "%BACKUP_DIR%\config" /b
echo.
if exist "%BACKUP_DIR%\database\*.db" (
    dir "%BACKUP_DIR%\database\*.db" /b
)
echo.
echo ========================================
echo 重要提醒：
echo 1. 備份檔案包含敏感資訊，請妥善保管
echo 2. 建議加密儲存或設定適當的檔案權限
echo 3. 定期測試備份檔案的恢復功能
echo ========================================

pause