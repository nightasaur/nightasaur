# scripts/start-local.ps1
# Nightasaur local startup (Windows)

$ErrorActionPreference = "Continue"
$backendDir = "C:\nightasaur\apps\backend"

Write-Host "===== Nightasaur Local Startup =====" -ForegroundColor Cyan

# 1. PostgreSQL
Write-Host ""
Write-Host "[1/4] Check PostgreSQL (port 5432)..."
$pg = Get-NetTCPConnection -LocalPort 5432 -State Listen -ErrorAction SilentlyContinue
if (-not $pg) {
    Write-Host "[FAIL] PostgreSQL not running. Start it manually." -ForegroundColor Red
    exit 1
}
Write-Host "[OK]   PostgreSQL running" -ForegroundColor Green

# 2. Ollama
Write-Host ""
Write-Host "[2/4] Check Ollama (port 11434)..."
$ol = Get-NetTCPConnection -LocalPort 11434 -State Listen -ErrorAction SilentlyContinue
if (-not $ol) {
    Write-Host "[FAIL] Ollama not running. Run: ollama serve" -ForegroundColor Red
    exit 1
}
Write-Host "[OK]   Ollama running" -ForegroundColor Green

# 3. Migration
Write-Host ""
Write-Host "[3/4] Check DB migration..."
Push-Location $backendDir
npx prisma migrate status
Pop-Location
Write-Host "[OK]   Migration check done" -ForegroundColor Green

# 4. Backend
Write-Host ""
Write-Host "[4/4] Check backend (port 3002)..."
$bk = Get-NetTCPConnection -LocalPort 3002 -State Listen -ErrorAction SilentlyContinue
if ($bk) {
    Write-Host "[OK]   Backend already running (PID: $($bk.OwningProcess -join ','))" -ForegroundColor Green
} else {
    Write-Host "Starting backend (new window)..."
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendDir'; `$env:LLM_PROVIDER='ollama'; npm run dev" -WindowStyle Normal
    Write-Host "Waiting 15 seconds..."
    Start-Sleep -Seconds 15
    $bk = Get-NetTCPConnection -LocalPort 3002 -State Listen -ErrorAction SilentlyContinue
    if ($bk) {
        Write-Host "[OK]   Backend started" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Backend failed. Check new window." -ForegroundColor Red
        exit 1
    }
}

# Done
Write-Host ""
Write-Host "===== ALL READY =====" -ForegroundColor Green
Write-Host "  Backend:  http://localhost:3002"
Write-Host "  Ollama:   http://localhost:11434"
Write-Host "  Database: postgresql://localhost:5432/nightasaur"