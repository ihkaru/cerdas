# 1. Initialization
Write-Host "🚀 Starting Android Production Test Run..." -ForegroundColor Cyan
$APP_DIR = "apps/client"

# 2. Preparation
Set-Location $APP_DIR

# 3. Install Dependencies
Write-Host "📦 Ensuring dependencies are up-to-date..." -ForegroundColor Green
pnpm install

# 4. Build Web Assets for Production
Write-Host "🏗️ Building Web Assets for Production..." -ForegroundColor Green
pnpm build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build Failed!" -ForegroundColor Red
    exit 1
}

# 5. Sync to Android
Write-Host "🔄 Syncing to Android..." -ForegroundColor Green
npx cap sync android

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Sync Failed!" -ForegroundColor Red
    exit 1
}

# 6. Run on Connected Device
Write-Host "📱 Running on connected Android device (Release mode)..." -ForegroundColor Green
npx cap run android --target release

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Run Failed! Is your device connected and authorized?" -ForegroundColor Red
    exit 1
}

Write-Host "✅ App is running on your device in Production mode!" -ForegroundColor Cyan
Write-Host "🚀 Connected to: https://api.dvlpid.my.id" -ForegroundColor Green
