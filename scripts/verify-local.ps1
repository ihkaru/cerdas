param (
    [switch]$ForceAll
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting Local Verification..." -ForegroundColor Cyan

$changedFiles = ""
if (-not $ForceAll) {
    if (Get-Command git -ErrorAction SilentlyContinue) {
        try {
            $changedFiles = git diff --name-only HEAD@ { 1 }..HEAD 2>$null
        }
        catch {
            $changedFiles = git diff --name-only HEAD~1..HEAD 2>$null
        }
    }
}
else {
    $changedFiles = "apps/client/ apps/backend/"
    Write-Host "⚠️  Forcing checks on all projects..." -ForegroundColor Yellow
}

# --- Client Checks ---
if ($ForceAll -or ($changedFiles -match "apps/client/") -or ($changedFiles -match "packages/")) {
    Write-Host "`n📦 Client/Packages changes detected." -ForegroundColor Magenta
    
    Write-Host "🏗️  [Client] Building & Type Checking (vue-tsc + vite)..."
    try {
        pnpm --filter client build
        if ($LASTEXITCODE -ne 0) { throw "Build failed" }
    }
    catch {
        Write-Host "❌ [Client] BUILD FAILED" -ForegroundColor Red
        exit 1
    }

    Write-Host "🧹 [Client] Linting (ESLint)..."
    try {
        pnpm --filter client lint
        if ($LASTEXITCODE -ne 0) { throw "Lint failed" }
    }
    catch {
        Write-Host "❌ [Client] LINT FAILED" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ [Client] Verified." -ForegroundColor Green
}

# --- Backend Checks ---
if ($ForceAll -or ($changedFiles -match "apps/backend/")) {
    Write-Host "`n🐘 Backend changes detected." -ForegroundColor Magenta
    
    Push-Location "apps/backend"
    
    Write-Host "🎨 [Backend] Laravel Pint (Style Check)..."
    # Using specific path if needed, or assume global/vendor availability via php
    if (Test-Path "vendor/bin/pint") {
        # Try running via php directly to avoid shell issues
        # On Windows, vendor/bin/pint is a shell script, vendor/bin/pint.bat is batch
        # We can try executing the batch file if it exists, or php source
        if (Test-Path "vendor/bin/pint.bat") {
            cmd /c "vendor\bin\pint.bat --test"
        }
        else {
            php vendor/bin/pint --test
        }
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ [Backend] PINT FAILED (Style issues found)" -ForegroundColor Red
            Write-Host "   Run 'vendor/bin/pint' to auto-fix."
            exit 1
        }
    }
    else {
        Write-Host "⚠️  [Backend] Pint not found, skipping." -ForegroundColor Yellow
    }

    Write-Host "🔍 [Backend] PHPMD (Mess Detector)..."
    if (Test-Path "vendor/bin/phpmd") {
        if (Test-Path "vendor/bin/phpmd.bat") {
            cmd /c "vendor\bin\phpmd.bat app text cleancode,codesize,naming,unusedcode --exclude app/Console/Kernel.php"
        }
        else {
            php vendor/bin/phpmd app text cleancode, codesize, naming, unusedcode --exclude "app/Console/Kernel.php"
        }
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ [Backend] PHPMD FAILED" -ForegroundColor Red
            exit 1
        }
    }
    else {
        Write-Host "⚠️  [Backend] PHPMD not found, skipping." -ForegroundColor Yellow
    }
    
    Pop-Location
    Write-Host "✅ [Backend] Verified." -ForegroundColor Green
}

Write-Host "`n🎉 All local verifications passed!" -ForegroundColor Green
exit 0
