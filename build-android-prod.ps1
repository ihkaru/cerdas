# build-android-prod.ps1
# Automates the Android Production Build process
# Based on ANDROID_BUILD_GUIDE.md

Write-Host "🚀 Starting Android Production Build..." -ForegroundColor Cyan

# 1. Switch to Client Directory
Set-Location "apps/client"

# 2. Check for .env.production
if (-not (Test-Path ".env.production")) {
    Write-Host "❌ Error: .env.production not found in apps/client!" -ForegroundColor Red
    Write-Host "Please create it with VITE_API_BASE_URL=https://api.dvlpid.my.id" -ForegroundColor Yellow
    exit 1
}

# 3. Install Dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Green
npm install

# 4. Build Web Assets (Uses .env.production automatically)
Write-Host "🏗️ Building Web Assets for Production..." -ForegroundColor Green
# We use 'tsc && vite build' via npm run build, but we should ensure it uses production mode
# Since vite load .env.production if it exists, simple build is enough.
npm run build

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

# 6. Open Android Studio
Write-Host "🤖 Opening Android Studio..." -ForegroundColor Green
npx cap open android

Write-Host "✅ Build & Sync Complete!" -ForegroundColor Cyan
Write-Host "👉 Now in Android Studio: Build -> Generate Signed Bundle / APK -> Release" -ForegroundColor Yellow
