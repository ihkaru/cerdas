# =============================================================================
# CERDAS - Start Android Dev (Local Backend)
# =============================================================================
# Mode 1: Uses local backend (start-all.bat) + Vite live reload
# API calls go to: http://10.0.2.2:8080/api (localhost from emulator)
# =============================================================================

param(
    [switch]$SkipClean  # Skip app uninstall and asset cleanup
)

$ErrorActionPreference = "Continue"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$ClientDir = Join-Path $ProjectRoot "apps\client"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CERDAS Android Dev - LOCAL Backend"    -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Stop all running servers
Write-Host "[1/7] Stopping all servers..." -ForegroundColor Yellow
& "$ProjectRoot\stop-all.bat"
Start-Sleep -Seconds 2

# 2. Copy .env.local-dev -> .env
Write-Host "[2/7] Setting API to LOCAL backend..." -ForegroundColor Yellow
Copy-Item -Path "$ClientDir\.env.local-dev" -Destination "$ClientDir\.env" -Force
Write-Host "  -> VITE_API_BASE_URL=http://localhost:8080/api" -ForegroundColor Gray

# 3. Ensure useLiveReload = true
Write-Host "[3/7] Enabling Live Reload..." -ForegroundColor Yellow
$capConfig = Get-Content "$ClientDir\capacitor.config.ts" -Raw
$capConfig = $capConfig -replace 'const useLiveReload = false;', 'const useLiveReload = true;'
Set-Content -Path "$ClientDir\capacitor.config.ts" -Value $capConfig -NoNewline
Write-Host "  -> useLiveReload = true" -ForegroundColor Gray

# 4. Clean Android app (optional)
if (-not $SkipClean) {
    Write-Host "[4/7] Cleaning Android app..." -ForegroundColor Yellow
    adb shell am force-stop com.cerdas.client 2>$null
    adb uninstall com.cerdas.client 2>$null
    Remove-Item -Recurse -Force "$ClientDir\android\app\src\main\assets\public" -ErrorAction SilentlyContinue
    Write-Host "  -> App cleaned from device" -ForegroundColor Gray
} else {
    Write-Host "[4/7] Skipping clean (--SkipClean)" -ForegroundColor DarkGray
}

# 5. Sync Capacitor
Write-Host "[5/7] Syncing Capacitor..." -ForegroundColor Yellow
Push-Location $ClientDir
npx cap sync android
Pop-Location

# 6. Start all servers (Backend + Client + Editor + Reverb)
Write-Host "[6/7] Starting all servers..." -ForegroundColor Yellow
Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"$ProjectRoot\start-all.bat`""
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
    } elseif (Test-Path "$env:ANDROID_HOME\emulator\emulator.exe") {
        $EmulatorExe = "$env:ANDROID_HOME\emulator\emulator.exe"
    }

    try {
        Start-Process -FilePath $EmulatorExe -ArgumentList "-avd Pixel_5_API_30" -NoNewWindow
        Write-Host "  -> Waiting for emulator to boot (10s)..." -ForegroundColor Gray
        Start-Sleep -Seconds 10
    } catch {
        Write-Host "  -> Failed to start emulator: $_" -ForegroundColor Red
        Write-Host "  -> Please start emulator manually via Android Studio." -ForegroundColor Yellow
    }
} else {
    Write-Host "  -> Emulator already running." -ForegroundColor Gray
}

# 8. Open Android Studio
Write-Host "[8/8] Opening Android Studio..." -ForegroundColor Yellow
Push-Location $ClientDir
npx cap open android
Pop-Location

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Ready! Local Backend Mode"             -ForegroundColor Green
Write-Host ""
Write-Host "  API:    http://10.0.2.2:8080/api"      -ForegroundColor White
Write-Host "  Client: http://10.0.2.2:9981"           -ForegroundColor White
Write-Host "  Mode:   Live Reload ON"                 -ForegroundColor White
Write-Host ""
Write-Host "  Click Run in Android Studio!"           -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
