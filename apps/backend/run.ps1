# Nightasaur 遊戲系統 - 本地啟動程序
Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "🎮 Nightasaur 遊戲系統 - 本地啟動程序" -ForegroundColor Yellow
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# 檢查 Node.js
Write-Host "🔍 檢查環境..." -ForegroundColor Green
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ 未找到 Node.js" -ForegroundColor Red
    Write-Host "💡 請安裝 Node.js (版本 18+)" -ForegroundColor Yellow
    pause
    exit 1
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ 未找到 npm" -ForegroundColor Red
    Write-Host "💡 npm 應該隨 Node.js 一起安裝" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "✅ 環境檢查通過" -ForegroundColor Green
Write-Host ""

# 安裝依賴
Write-Host "📦 安裝依賴套件..." -ForegroundColor Green
try {
    npm install
    Write-Host "✅ 依賴套件安裝完成" -ForegroundColor Green
} catch {
    Write-Host "⚠️  依賴安裝可能有問題，繼續啟動..." -ForegroundColor Yellow
}
Write-Host ""

# 設定資料庫
Write-Host "🗄️  設定資料庫..." -ForegroundColor Green
try {
    npx prisma migrate deploy
    npx prisma generate
    Write-Host "✅ 資料庫設定完成" -ForegroundColor Green
} catch {
    Write-Host "⚠️  資料庫設定有問題，繼續啟動..." -ForegroundColor Yellow
}
Write-Host ""

# 顯示啟動信息
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "🌐 服務器將在以下 URL 啟動:" -ForegroundColor Yellow
Write-Host "   主界面: http://localhost:3000" -ForegroundColor White
Write-Host "   API 文檔: http://localhost:3000/api/health" -ForegroundColor White
Write-Host ""
Write-Host "📱 可用 API 端點:" -ForegroundColor Yellow
Write-Host "   • 遊戲系統: http://localhost:3000/api/game" -ForegroundColor Gray
Write-Host "   • 益智系統: http://localhost:3000/api/puzzles" -ForegroundColor Gray
Write-Host "   • 小隊系統: http://localhost:3000/api/squads" -ForegroundColor Gray
Write-Host "   • AR 探索: http://localhost:3000/api/ar" -ForegroundColor Gray
Write-Host "   • 語言設定: http://localhost:3000/api/language" -ForegroundColor Gray
Write-Host ""
Write-Host "⚙️  系統功能:" -ForegroundColor Yellow
Write-Host "   • 益智升級系統 ✓" -ForegroundColor Green
Write-Host "   • 隨從小隊系統 ✓" -ForegroundColor Green
Write-Host "   • AR 位置探索 ✓" -ForegroundColor Green
Write-Host "   • 多語言設定 ✓" -ForegroundColor Green
Write-Host ""
Write-Host "🛑 停止服務器: 按 Ctrl + C" -ForegroundColor Red
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# 啟動開發服務器
Write-Host "🚀 啟動本地服務器..." -ForegroundColor Green
npm run dev