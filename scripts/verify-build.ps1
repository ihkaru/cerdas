# verify-build.ps1
# Local build verification for Cerdas Client
#
# Usage:
#   ./scripts/verify-build.ps1            → Full (web + cap sync + gradle)
#   ./scripts/verify-build.ps1 -WebOnly   → Fast web-only (~30s)
#   ./scripts/verify-build.ps1 -SkipInstall → Skip pnpm install

param(
    [switch]$SkipInstall,
    [switch]$WebOnly
)

$ErrorActionPreference = "Stop"
$ROOT_DIR = git rev-parse --show-toplevel
$CLIENT_DIR = Join-Path $ROOT_DIR "apps/client"
$ANDROID_DIR = Join-Path $CLIENT_DIR "android"

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Local Build Verification" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Install dependencies
if (-not $SkipInstall) {
    Write-Host "[1/4] Installing dependencies..." -ForegroundColor Yellow
    Push-Location $ROOT_DIR
    pnpm install --frozen-lockfile 2>$null
    if ($LASTEXITCODE -ne 0) {
        pnpm install
    }
    Pop-Location
}

# Step 2: Build web assets (TypeScript + Vite)
Write-Host "[2/4] Building web assets (vue-tsc + vite)..." -ForegroundColor Yellow
Push-Location $ROOT_DIR
pnpm --filter client build
$BUILD_EXIT = $LASTEXITCODE

if ($BUILD_EXIT -eq 0) {
    Write-Host "      Linting Editor App..." -ForegroundColor Yellow
    pnpm --filter editor lint
    $EDITOR_LINT_EXIT = $LASTEXITCODE
    
    if ($EDITOR_LINT_EXIT -ne 0) {
        $BUILD_EXIT = 1
        Write-Host ">>> EDITOR LINT FAILED!" -ForegroundColor Red
    }
}

Pop-Location

if ($BUILD_EXIT -ne 0) {
    Write-Host ""
    Write-Host ">>> WEB BUILD/LINT FAILED! Fix errors above." -ForegroundColor Red
    exit 1
}

# Verify dist output
$DIST_INDEX = Join-Path $CLIENT_DIR "dist/index.html"
if (-not (Test-Path $DIST_INDEX)) {
    Write-Host ">>> Build output missing: dist/index.html not found!" -ForegroundColor Red
    exit 1
}

Write-Host "  Web assets built successfully." -ForegroundColor Green

if ($WebOnly) {
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host "  Web-only verification passed!" -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Green
    exit 0
}

# Step 3: Capacitor sync
Write-Host "[3/4] Syncing to Android (cap sync)..." -ForegroundColor Yellow
Push-Location $CLIENT_DIR
npx cap sync android
$SYNC_EXIT = $LASTEXITCODE
Pop-Location

if ($SYNC_EXIT -ne 0) {
    Write-Host ">>> CAP SYNC FAILED!" -ForegroundColor Red
    exit 1
}

Write-Host "  Capacitor sync completed." -ForegroundColor Green

# Step 4: Gradle assembleDebug (no signing needed)
Write-Host "[4/4] Building Android native (Gradle assembleDebug)..." -ForegroundColor Yellow
Push-Location $ANDROID_DIR

cmd /c "gradlew.bat assembleDebug"
$GRADLE_EXIT = $LASTEXITCODE
Pop-Location

if ($GRADLE_EXIT -ne 0) {
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Red
    Write-Host "  GRADLE BUILD FAILED!" -ForegroundColor Red
    Write-Host "  Fix native build errors before pushing." -ForegroundColor Red
    Write-Host "=========================================" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "  Full Android build verification passed!" -ForegroundColor Green
Write-Host "    Web build  OK" -ForegroundColor Green
Write-Host "    Cap sync   OK" -ForegroundColor Green
Write-Host "    Gradle     OK" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
