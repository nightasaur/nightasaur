# Nightasaur GitHub倉庫設置 - PowerShell腳本
# 運行此腳本來自動完成倉庫設置

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Nightasaur GitHub Repository Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 檢查Git狀態
Write-Host "[1/5] 檢查Git狀態..." -ForegroundColor Yellow
git status
Write-Host ""

# 推送最新更改
Write-Host "[2/5] 推送最新更改..." -ForegroundColor Yellow
git add .
git commit -m "Final setup: README and scripts" -q
git push origin main
Write-Host "✓ 代碼已推送" -ForegroundColor Green
Write-Host ""

# 顯示重要鏈接
Write-Host "[3/5] 重要鏈接：" -ForegroundColor Yellow
Write-Host ""
Write-Host "請在瀏覽器中訪問以下鏈接完成設置：" -ForegroundColor White
Write-Host ""
Write-Host "1. 公開倉庫設置：" -ForegroundColor Cyan
Write-Host "   https://github.com/nightasaur/nightasaur/settings#danger-zone" -ForegroundColor White
Write-Host "   需要操作：將倉庫從Private改為Public" -ForegroundColor Gray
Write-Host ""
Write-Host "2. 編輯描述和標籤：" -ForegroundColor Cyan
Write-Host "   https://github.com/nightasaur/nightasaur" -ForegroundColor White
Write-Host "   在右側'About'部分點擊鉛筆圖標編輯" -ForegroundColor Gray
Write-Host ""
Write-Host "3. 創建第一個Release：" -ForegroundColor Cyan
Write-Host "   https://github.com/nightasaur/nightasaur/releases/new" -ForegroundColor White
Write-Host "   版本：v1.0.0，標題：Nightasaur v1.0.0 - Initial Release" -ForegroundColor Gray
Write-Host ""
Write-Host "4. 查看倉庫：" -ForegroundColor Cyan
Write-Host "   https://github.com/nightasaur/nightasaur" -ForegroundColor White
Write-Host "   確認所有設置已完成" -ForegroundColor Gray
Write-Host ""

# 提供描述模板
Write-Host "[4/5] 描述模板：" -ForegroundColor Yellow
Write-Host ""
$description = @"
Nightasaur - Open Source AI Digital Spirit & Personal Assistant Platform
"@
Write-Host $description -ForegroundColor White
Write-Host ""

# 提供標籤模板
Write-Host "[5/5] 主題標籤模板：" -ForegroundColor Yellow
Write-Host ""
$topics = @"
ai-assistant, digital-pet, react, nodejs, python, open-source, ai, chatbot, machine-learning, full-stack
"@
Write-Host $topics -ForegroundColor White
Write-Host ""

# 完成提示
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "設置指南完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "請按順序完成：" -ForegroundColor Yellow
Write-Host "1. 公開倉庫 (最重要！)" -ForegroundColor Red
Write-Host "2. 添加描述和標籤" -ForegroundColor Yellow
Write-Host "3. 創建Release" -ForegroundColor Yellow
Write-Host "4. 分享項目" -ForegroundColor Yellow
Write-Host ""
Write-Host "完成後，您的開源項目就正式上線了！🎉" -ForegroundColor Green
Write-Host ""
Write-Host "按任意鍵繼續..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")