param(
    [Parameter(Mandatory=$true)]
    [string]$CloudOllamaUrl,
    [string]$CloudModel = "qwen2.5:72b"
)

Write-Host "🚀 遷移到雲端 GPU..." -ForegroundColor Cyan
Write-Host "   新 URL: $CloudOllamaUrl" -ForegroundColor Yellow

Copy-Item ".env" ".env.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"

$content = Get-Content ".env" -Raw
$content = $content -replace 'OLLAMA_URL=.*', "OLLAMA_URL=$CloudOllamaUrl"
$content = $content -replace 'OLLAMA_MODEL=.*', "OLLAMA_MODEL=$CloudModel"
Set-Content ".env" -Value $content -Encoding UTF8

docker compose restart backend
Write-Host "✅ 遷移完成，Backend 已重啟" -ForegroundColor Green
