# Nightasaur 精靈系統 v2.0 PowerShell 啟動腳本

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "🦖 Nightasaur 精靈系統 v2.0 啟動腳本" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# 檢查 Node.js 是否安裝
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ 錯誤: Node.js 未安裝！" -ForegroundColor Red
    Write-Host "請先安裝 Node.js: https://nodejs.org/" -ForegroundColor Yellow
    pause
    exit 1
}

# 檢查 npm 是否安裝
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ 錯誤: npm 未安裝！" -ForegroundColor Red
    Write-Host "請確保 Node.js 安裝包含 npm" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "✅ 檢查環境完成" -ForegroundColor Green
Write-Host ""

# 進入後台目錄
Set-Location "C:\Nightasaur\apps\backend"

Write-Host "📦 安裝依賴包..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 錯誤: 依賴安裝失敗！" -ForegroundColor Red
    pause
    exit 1
}

Write-Host "✅ 依賴安裝完成" -ForegroundColor Green
Write-Host ""

Write-Host "🗃️ 準備數據庫..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️ 警告: Prisma 生成失敗，嘗試繼續..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🚀 啟動 Nightasaur 精靈系統 v2.0..." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 設置環境變量
$env:PORT = "3001"
$env:NODE_ENV = "development"

Write-Host ""
Write-Host "📊 系統信息:" -ForegroundColor Cyan
Write-Host "   服務器端口: $env:PORT" -ForegroundColor White
Write-Host "   環境模式: $env:NODE_ENV" -ForegroundColor White
Write-Host "   主要語言: 繁體中文" -ForegroundColor White
Write-Host ""

Write-Host "📝 可用 API:" -ForegroundColor Cyan
Write-Host "   GET  http://localhost:$env:PORT/api/health" -ForegroundColor Gray
Write-Host "   GET  http://localhost:$env:PORT/api/system/status" -ForegroundColor Gray
Write-Host "   GET  http://localhost:$env:PORT/api/spirit-systems/naming/suggestions?element=FIRE" -ForegroundColor Gray
Write-Host "   POST http://localhost:$env:PORT/api/spirit-systems/hatching/start" -ForegroundColor Gray
Write-Host "   GET  http://localhost:$env:PORT/api/spirit-systems/hatching/status/:id" -ForegroundColor Gray
Write-Host ""

Write-Host "🎮 系統功能:" -ForegroundColor Cyan
Write-Host "   ✅ 命名系統 (多語言/多風格)" -ForegroundColor Green
Write-Host "   ✅ 孵化系統 (環境模擬/互動)" -ForegroundColor Green
Write-Host "   🔧 外觀系統 (動物園主題/基因)" -ForegroundColor Yellow
Write-Host "   ✅ 精靈管理 (創建/進化/自定義)" -ForegroundColor Green
Write-Host ""

Write-Host "⏳ 正在啟動服務器..." -ForegroundColor Cyan
Write-Host ""

# 啟動服務器
try {
    node complete-spirit-server.ts
} catch {
    Write-Host ""
    Write-Host "❌ 錯誤: 服務器啟動失敗！" -ForegroundColor Red
    Write-Host "可能的原因:" -ForegroundColor Yellow
    Write-Host "   1. 端口 $env:PORT 已被佔用" -ForegroundColor White
    Write-Host "   2. 依賴包缺失" -ForegroundColor White
    Write-Host "   3. TypeScript 編譯錯誤" -ForegroundColor White
    Write-Host ""
    Write-Host "🔧 故障排除:" -ForegroundColor Cyan
    Write-Host "   - 檢查端口: Get-NetTCPConnection -LocalPort $env:PORT" -ForegroundColor Gray
    Write-Host "   - 重新安裝: npm ci" -ForegroundColor Gray
    Write-Host "   - 檢查日誌: 查看控制台輸出" -ForegroundColor Gray
    pause
    exit 1
}