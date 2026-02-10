# verify-build.ps1
# Lightweight local build verification for client app
# Runs TypeScript check + Vite build to catch errors before push

param(
    [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"
$ROOT_DIR = git rev-parse --show-toplevel

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🔍 Local Build Verification" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Step 1: Install dependencies (skip if flag set)
if (-not $SkipInstall) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    Push-Location $ROOT_DIR
    pnpm install --frozen-lockfile 2>$null
    if ($LASTEXITCODE -ne 0) {
        # Fallback without frozen-lockfile
        pnpm install
    }
    Pop-Location
}

# Step 2: Build client web assets (TypeScript + Vite)
Write-Host "🏗️  Building client web assets..." -ForegroundColor Yellow
Push-Location $ROOT_DIR
pnpm --filter client build
$BUILD_EXIT = $LASTEXITCODE
Pop-Location

if ($BUILD_EXIT -ne 0) {
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Red
    Write-Host "❌ BUILD FAILED!" -ForegroundColor Red
    Write-Host "Fix the errors above before pushing." -ForegroundColor Red
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Red
    exit 1
}

# Step 3: Verify dist output exists
$DIST_DIR = Join-Path $ROOT_DIR "apps/client/dist"
if (-not (Test-Path (Join-Path $DIST_DIR "index.html"))) {
    Write-Host "❌ Build output missing: dist/index.html not found!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "✅ Build verification passed!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
