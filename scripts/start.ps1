Write-Host "🌙 Nightasaur 啟動中..." -ForegroundColor Cyan

if (-not (Test-Path ".env")) {
    Write-Host "⚠️  找不到 .env，從 .env.example 複製..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    exit 1
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ 請先安裝 Docker Desktop" -ForegroundColor Red
    exit 1
}

$hasGPU = $false
try {
    nvidia-smi 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) { $hasGPU = $true; Write-Host "✅ 偵測到 NVIDIA GPU" -ForegroundColor Green }
} catch {}

if ($hasGPU) {
    Write-Host "🚀 啟動含 GPU 直通的服務..." -ForegroundColor Green
    docker compose -f docker-compose.yml -f docker-compose.gpu.yml up -d
} else {
    Write-Host "⚠️  未偵測到 GPU，使用 CPU 模式" -ForegroundColor Yellow
    docker compose up -d
}

Write-Host "⏳ 等待服務啟動..." -ForegroundColor Cyan
Start-Sleep -Seconds 15

Write-Host "📦 檢查模型..." -ForegroundColor Cyan
$models = docker exec nightasaur-ollama ollama list 2>$null
if ($models -notmatch "qwen2.5:3b") {
    Write-Host "⬇️  下載 qwen2.5:3b..." -ForegroundColor Yellow
    docker exec nightasaur-ollama ollama pull qwen2.5:3b
}

Write-Host "`n🏥 健康檢查..." -ForegroundColor Cyan
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3002/api/health" -TimeoutSec 5
    Write-Host "✅ Backend: $($health.status)" -ForegroundColor Green
} catch { Write-Host "❌ Backend 無回應" -ForegroundColor Red }

try {
    Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -TimeoutSec 5 | Out-Null
    Write-Host "✅ Ollama: 運行中" -ForegroundColor Green
} catch { Write-Host "❌ Ollama 無回應" -ForegroundColor Red }

Write-Host "`n🧪 測試 AI 端點..." -ForegroundColor Cyan
try {
    $body = @{ prompt = "你好" } | ConvertTo-Json
    $r = Invoke-RestMethod -Uri "http://localhost:3002/api/ollama" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 60
    Write-Host "✅ AI 回應：$($r.response)" -ForegroundColor Green
} catch { Write-Host "❌ AI 端點測試失敗：$($_.Exception.Message)" -ForegroundColor Red }

Write-Host "`n🎉 Nightasaur 已啟動！" -ForegroundColor Green
Write-Host "   Backend:  http://localhost:3002"
Write-Host "   Ollama:   http://localhost:11434"
