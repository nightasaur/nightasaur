@echo off
REM ============================================
REM  Nightasaur — 一鍵啟動所有服務
REM ============================================

echo.
echo ╔══════════════════════════════════════════╗
echo ║    🌙 Nightasaur 一鍵啟動              ║
echo ╚══════════════════════════════════════════╝
echo.

echo [1/3] 確認 Ollama 在背景執行...
echo   (如果未啟動請手動執行 Ollama)
echo.

echo [2/3] 啟動 Python AI Engine...
start "Nightasaur-AI" cmd /c "cd /d %~dp0apps\ai-engine && python main.py"
echo   AI Engine → http://localhost:8000
echo.

echo [3/3] 啟動 Node.js 後端...
start "Nightasaur-Backend" cmd /c "cd /d %~dp0apps\backend && npx tsx src\index.ts"
echo   Backend → http://localhost:3000
echo.

echo.
echo ✅ 所有服務已啟動！
echo.
echo   前端開發: cd apps\web ^&^& npx vite
echo   ComfyUI:  cd ComfyUI ^&^& python main.py --port 8188
echo.
pause