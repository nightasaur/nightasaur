Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "🦖 Nightasaur 完整系統啟動腳本 🦖" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/3] 檢查系統狀態..." -ForegroundColor Yellow
Write-Host ""

# 檢查Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ 未找到Node.js，請先安裝Node.js" -ForegroundColor Red
    pause
    exit 1
}
Write-Host "✅ Node.js 已安裝" -ForegroundColor Green

# 檢查目錄
if (-not (Test-Path "C:\Nightasaur\apps\backend\")) {
    Write-Host "❌ 找不到後台目錄" -ForegroundColor Red
    pause
    exit 1
}

if (-not (Test-Path "C:\Nightasaur\apps\web\")) {
    Write-Host "❌ 找不到前台目錄" -ForegroundColor Red
    pause
    exit 1
}

Write-Host "✅ 目錄結構正常" -ForegroundColor Green
Write-Host ""

Write-Host "[2/3] 檢查端口佔用..." -ForegroundColor Yellow
Write-Host ""

# 檢查並釋放端口
$ports = @(3000, 5173, 3002)

foreach ($port in $ports) {
    $process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($process) {
        Write-Host "⚠️  端口 $port 已被佔用，嘗試釋放..." -ForegroundColor Yellow
        try {
            Stop-Process -Id $process.OwningProcess -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 2
        } catch {
            Write-Host "  無法釋放端口 $port，可能沒有權限" -ForegroundColor Red
        }
    }
}

Write-Host "✅ 端口檢查完成" -ForegroundColor Green
Write-Host ""

Write-Host "[3/3] 啟動系統服務..." -ForegroundColor Yellow
Write-Host ""

# 啟動遊戲後台
Write-Host "🚀 啟動遊戲後台服務器..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Nightasaur\apps\backend'; npx tsx nightasaur-server.ts" -WindowStyle Normal
Start-Sleep -Seconds 3

# 啟動遊戲前台
Write-Host "🚀 啟動遊戲前台..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Nightasaur\apps\web'; npm run dev" -WindowStyle Normal
Start-Sleep -Seconds 5

# 啟動登入系統
Write-Host "🚀 啟動登入系統..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Nightasaur\apps\backend'; npx tsx test-login-server.ts" -WindowStyle Normal
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "===========================================" -ForegroundColor Green
Write-Host "✅ 所有系統啟動完成！" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green
Write-Host ""

Write-Host "📋 系統訪問地址：" -ForegroundColor White
Write-Host ""
Write-Host "   🎮 遊戲前台：http://localhost:5173" -ForegroundColor Cyan
Write-Host "   🔧 遊戲後台：http://localhost:3000" -ForegroundColor Cyan
Write-Host "   🔐 登入系統：http://localhost:3002" -ForegroundColor Cyan
Write-Host "   🚪 整合入口：file:///C:/Nightasaur/portal.html" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 管理員帳號：" -ForegroundColor White
Write-Host ""
Write-Host "   電子郵件：admin@nightasaur.com" -ForegroundColor Yellow
Write-Host "   用戶名：admin" -ForegroundColor Yellow
Write-Host "   密碼：admin123" -ForegroundColor Yellow
Write-Host "   角色：系統管理員" -ForegroundColor Yellow
Write-Host ""

Write-Host "💡 使用建議：" -ForegroundColor White
Write-Host "   1. 打開整合入口頁面" -ForegroundColor Gray
Write-Host "   2. 點擊「進入完整遊戲」" -ForegroundColor Gray
Write-Host "   3. 使用管理員帳號登入" -ForegroundColor Gray
Write-Host "   4. 開始遊戲！" -ForegroundColor Gray
Write-Host ""

Write-Host "📞 支援信箱：service@nightasaur.com" -ForegroundColor White
Write-Host ""

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "按任意鍵打開整合入口頁面..." -ForegroundColor Cyan
pause

# 打開整合入口頁面
Start-Process "file:///C:/Nightasaur/portal.html"

Write-Host ""
Write-Host "🎉 整合入口頁面已打開！" -ForegroundColor Green
Write-Host "祝您遊戲愉快！ 🦖" -ForegroundColor Cyan
Write-Host ""

pause