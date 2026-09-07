Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "🦖 Nightasaur 登入系統啟動腳本 🦖" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "正在啟動服務器..." -ForegroundColor Yellow

Set-Location C:\Nightasaur\apps\backend

Write-Host ""
Write-Host "檢查Node.js版本..." -ForegroundColor Yellow
node --version

Write-Host ""
Write-Host "檢查依賴包..." -ForegroundColor Yellow
if (Test-Path node_modules) {
    Write-Host "依賴包已安裝" -ForegroundColor Green
} else {
    Write-Host "安裝依賴包..." -ForegroundColor Yellow
    npm install
}

Write-Host ""
Write-Host "啟動登入測試服務器..." -ForegroundColor Cyan
Write-Host "服務器: http://localhost:3002" -ForegroundColor Green
Write-Host "管理員帳號: admin@nightasaur.com / admin123" -ForegroundColor Green
Write-Host "支援信箱: service@nightasaur.com" -ForegroundColor Green
Write-Host ""

npx tsx test-login-server.ts