# =============================================================================
# CERDAS - Stop Hybrid Dev (Local Docker Backend + Local Frontend)
# =============================================================================

$ErrorActionPreference = "Continue"
$ProjectRoot = Split-Path -Parent $PSScriptRoot

Write-Host ""
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "  CERDAS Stop - Hybrid Dev"              -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host ""

# 1. Stop Docker Backend
Write-Host "[1/2] Stopping Docker Backend..." -ForegroundColor Yellow
Set-Location $ProjectRoot
docker-compose -f docker-compose.dev.yml down
Write-Host "  -> Docker containers stopped." -ForegroundColor Gray

# 2. Stop Local Frontend Processes
Write-Host "[2/2] Stopping Local Frontend Processes..." -ForegroundColor Yellow

# Kill cmd windows based on title set in start script
taskkill /F /FI "WINDOWTITLE eq Cerdas Client" 2>$null
taskkill /F /FI "WINDOWTITLE eq Cerdas Editor" 2>$null

# Also ensure node/pnpm processes on ports are killed (just in case title failed)
# Client (3000)
$clientPid = (Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue).OwningProcess
if ($clientPid) { Stop-Process -Id $clientPid -Force -ErrorAction SilentlyContinue }

# Editor (3001)
$editorPid = (Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue).OwningProcess
if ($editorPid) { Stop-Process -Id $editorPid -Force -ErrorAction SilentlyContinue }

Write-Host "  -> Local frontend processes stopped." -ForegroundColor Gray

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  All Hybrid Dev services stopped."       -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
