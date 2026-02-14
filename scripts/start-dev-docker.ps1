# =============================================================================
# CERDAS - Start Hybrid Dev (Local Docker Backend + Local Frontend)
# =============================================================================
# Mode 4: Uses Local Docker Backend (localhost:8080) + Local Vite Servers
# API calls go to: http://localhost:8080/api
# =============================================================================

$ErrorActionPreference = "Continue"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$ClientDir = Join-Path $ProjectRoot "apps\client"
$EditorDir = Join-Path $ProjectRoot "apps\editor"

Write-Host ""
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "  CERDAS Hybrid Dev - DOCKER Backend"    -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host ""

# 1. Stop all running servers
Write-Host "[1/6] Stopping standard servers..." -ForegroundColor Yellow
& "$ProjectRoot\stop-all.bat"
Start-Sleep -Seconds 2

# 2. Start Docker Backend (Build to ensure fresh code, skip client/editor containers)
Write-Host "[2/6] Starting Docker Backend (and rebuilding)..." -ForegroundColor Yellow
Set-Location $ProjectRoot
docker-compose -f docker-compose.dev.yml up -d --build backend worker scheduler
Write-Host "  -> Waiting for Backend Health (10s)..." -ForegroundColor Gray
Start-Sleep -Seconds 10

# 3. Configure Client (.env)
Write-Host "[3/6] Configuring Client for Hybrid Mode..." -ForegroundColor Yellow
Copy-Item -Path "$ClientDir\.env.docker-web" -Destination "$ClientDir\.env" -Force
Write-Host "  -> Client API: http://localhost:8080/api" -ForegroundColor Gray

# 4. Configure Editor (.env)
Write-Host "[4/6] Configuring Editor for Hybrid Mode..." -ForegroundColor Yellow
Copy-Item -Path "$EditorDir\.env.docker-web" -Destination "$EditorDir\.env" -Force
Write-Host "  -> Editor API: http://localhost:8080/api" -ForegroundColor Gray

# 5. Start Client Dev Server
Write-Host "[5/6] Starting Client (Vite)..." -ForegroundColor Yellow
$clientPort = 3000
Start-Process -FilePath "cmd.exe" -ArgumentList "/k title Cerdas Client && cd /d $ClientDir && pnpm dev --port $clientPort"

# 6. Start Editor Dev Server
Write-Host "[6/6] Starting Editor (Vite)..." -ForegroundColor Yellow
$editorPort = 3001
Start-Process -FilePath "cmd.exe" -ArgumentList "/k title Cerdas Editor && cd /d $EditorDir && pnpm dev --port $editorPort"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Ready! Hybrid Dev Mode"                  -ForegroundColor Green
Write-Host ""
Write-Host "  Backend: http://localhost:8080/api"     -ForegroundColor White
Write-Host "  Client:  http://localhost:3000"         -ForegroundColor White
Write-Host "  Editor:  http://localhost:3001"         -ForegroundColor White
Write-Host ""
Write-Host "  Backend running in Docker."             -ForegroundColor DarkGray
Write-Host "========================================" -ForegroundColor Green
