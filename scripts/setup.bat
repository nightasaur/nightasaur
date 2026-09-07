@echo off
echo ============================================
echo   Nightasaur - 初始化設定
echo   AI 數位精靈平台
echo ============================================
echo.

:: 複製環境變數
echo [1/5] 設定環境變數...
if not exist ".env" (
    copy .env.example .env
    echo   .env 已建立，請編輯設定
) else (
    echo   .env 已存在，跳過
)

:: 安裝 Node 依賴
echo [2/5] 安裝 Node.js 依賴...
call npm install
echo.

:: 設定 Python 環境
echo [3/5] 設定 Python 虛擬環境...
cd apps\ai-engine
if not exist "venv" (
    python -m venv venv
    echo   虛擬環境已建立
)
call venv\Scripts\activate
pip install -r requirements.txt
cd ..\..

:: 產 Prisma client
echo [4/5] 產生 Prisma client...
cd apps\backend
npx prisma generate
cd ..\..

echo [5/5] 設定完成！
echo.
echo 啟動方式：
echo   docker-compose up -d     (啟動 PostgreSQL + Redis + Ollama)
echo   npm run dev              (啟動後端 + 前端)
echo   npm run dev:ai           (啟動 AI 引擎)
echo   npm run db:migrate       (資料庫遷移)
echo   npm run db:seed         (載入示範資料)