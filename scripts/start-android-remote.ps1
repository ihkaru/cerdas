# =============================================================================
# CERDAS - Start Android Dev (Remote Backend)
# =============================================================================
# Mode 2: Uses production backend (api.dvlpid.my.id) + Vite live reload
# API calls go to: https://api.dvlpid.my.id/api
# No local backend needed!
# =============================================================================

param(
    [switch]$SkipClean  # Skip app uninstall and asset cleanup
)

$ErrorActionPreference = "Continue"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$ClientDir = Join-Path $ProjectRoot "apps\client"

Write-Host ""
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "  CERDAS Android Dev - REMOTE Backend"   -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host ""

# 1. Stop all running servers
Write-Host "[1/7] Stopping all servers..." -ForegroundColor Yellow
& "$ProjectRoot\stop-all.bat"
Start-Sleep -Seconds 2

# 2. Copy .env.remote-dev -> .env
Write-Host "[2/7] Setting API to REMOTE backend..." -ForegroundColor Yellow
Copy-Item -Path "$ClientDir\.env.remote-dev" -Destination "$ClientDir\.env" -Force
Write-Host "  -> VITE_API_BASE_URL=https://api.dvlpid.my.id/api" -ForegroundColor Gray

# 3. Ensure useLiveReload = true
Write-Host "[3/7] Enabling Live Reload..." -ForegroundColor Yellow
$env:CAPACITOR_LIVE_RELOAD = "true"
Write-Host "  -> CAPACITOR_LIVE_RELOAD = true" -ForegroundColor Gray

# 4. Clean Android app (optional)
if (-not $SkipClean) {
    Write-Host "[4/7] Cleaning Android app..." -ForegroundColor Yellow
    adb shell am force-stop com.cerdas.client 2>$null
    adb uninstall com.cerdas.client 2>$null
    Remove-Item -Recurse -Force "$ClientDir\android\app\src\main\assets\public" -ErrorAction SilentlyContinue
    Write-Host "  -> App cleaned from device" -ForegroundColor Gray
}
else {
    Write-Host "[4/7] Skipping clean (--SkipClean)" -ForegroundColor DarkGray
}

# 5. Sync Capacitor
Write-Host "[5/7] Syncing Capacitor..." -ForegroundColor Yellow
Push-Location $ClientDir
npx cap sync android
Pop-Location

# 6. Start ONLY the client dev server (no backend needed)
Write-Host "[6/7] Starting client dev server only..." -ForegroundColor Yellow
$clientPort = 9981
Start-Process -FilePath "cmd.exe" -ArgumentList "/k title Cerdas Client && cd /d $ClientDir && pnpm dev --host --port $clientPort"
Start-Sleep -Seconds 5

# 7. Check/Start Emulator
Write-Host "[7/8] Checking Android Emulator..." -ForegroundColor Yellow
$deviceList = adb devices | Select-String -Pattern "emulator-"
if (-not $deviceList) {
    Write-Host "  -> No emulator found. Starting Pixel 5 API 30..." -ForegroundColor Cyan
    
    # Try to find emulator executable
    $EmulatorExe = "emulator"
    if (Test-Path "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe") {
        $EmulatorExe = "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe"
    }
    elseif (Test-Path "$env:ANDROID_HOME\emulator\emulator.exe") {
        $EmulatorExe = "$env:ANDROID_HOME\emulator\emulator.exe"
    }

    try {
        Start-Process -FilePath $EmulatorExe -ArgumentList "-avd Pixel_5_API_30" -NoNewWindow
        Write-Host "  -> Waiting for emulator to boot (10s)..." -ForegroundColor Gray
        Start-Sleep -Seconds 10
    }
    catch {
        Write-Host "  -> Failed to start emulator: $_" -ForegroundColor Red
        Write-Host "  -> Please start emulator manually via Android Studio." -ForegroundColor Yellow
    }
}
else {
    Write-Host "  -> Emulator already running." -ForegroundColor Gray
}

# 8. Open Android Studio
Write-Host "[8/8] Opening Android Studio..." -ForegroundColor Yellow
Push-Location $ClientDir
npx cap open android
Pop-Location

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Ready! Remote Backend Mode"             -ForegroundColor Green
Write-Host ""
Write-Host "  API:    https://api.dvlpid.my.id/api"  -ForegroundColor White
Write-Host "  Client: http://10.0.2.2:9981"           -ForegroundColor White
Write-Host "  Mode:   Live Reload ON"                 -ForegroundColor White
Write-Host ""
Write-Host "  No local backend running."              -ForegroundColor DarkGray
Write-Host "  Click Run in Android Studio!"           -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
