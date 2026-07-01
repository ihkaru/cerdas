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
pnpm install

# 4. Build Web Assets (Uses .env.production automatically)
Write-Host "🏗️ Building Web Assets for Production..." -ForegroundColor Green
# We use pnpm build which runs 'vue-tsc -b && vite build'
# For monorepo, it's better to run from root or ensures workspace is handled.
# pnpm install at app level works if pnpm-workspace.yaml is accessible.
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

# 6. Build Signed APK via CLI
Write-Host "🔑 Processing Signing and APK Build..." -ForegroundColor Green
Set-Location "android"

# Detect Root Directory correctly (script is in root)
$ROOT_DIR = $PSScriptRoot
$KEYSTORE_PATH = Join-Path $ROOT_DIR "release-key.jks"
# Use forward slashes for Gradle to avoid path mangling issues
$KEYSTORE_PATH_GRADLE = $KEYSTORE_PATH.Replace('\', '/')

$KEYSTORE_ALIAS = "cerdas_release"
$KEYSTORE_PASS = "cerdas123"

# Generate Keystore if it doesn't exist
if (-not (Test-Path $KEYSTORE_PATH)) {
    Write-Host "🛠️ Generating new release keystore at $KEYSTORE_PATH..." -ForegroundColor Yellow
    # Create a dummy keystore for release testing
    keytool -genkey -v -keystore "$KEYSTORE_PATH" -alias $KEYSTORE_ALIAS -keyalg RSA -keysize 2048 -validity 10000 -storepass $KEYSTORE_PASS -keypass $KEYSTORE_PASS -dname "CN=Cerdas, OU=Dev, O=Ihkaru, L=Jakarta, S=ID, C=ID"
}

Write-Host "📦 Building and Signing APK..." -ForegroundColor Cyan
# Use gradlew.bat for Windows compatibility. 
# Explicitly pass parameters as strings to avoid PowerShell interpretation
cmd /c "gradlew.bat assembleRelease -Pandroid.injected.signing.store.file=""$KEYSTORE_PATH_GRADLE"" -Pandroid.injected.signing.store.password=""$KEYSTORE_PASS"" -Pandroid.injected.signing.key.alias=""$KEYSTORE_ALIAS"" -Pandroid.injected.signing.key.password=""$KEYSTORE_PASS"""

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Gradle Build Failed!" -ForegroundColor Red
    exit 1
}

# 7. Copy APK to Root for easy access
$APK_SOURCE = "app/build/outputs/apk/release/app-release.apk"
$APK_DEST = Join-Path $ROOT_DIR "cerdas-production.apk"
Copy-Item $APK_SOURCE $APK_DEST
Write-Host "✨ APK Generated: $APK_DEST" -ForegroundColor Cyan

# 8. Open Android Studio (Optional now)
# Write-Host "🤖 Opening Android Studio..." -ForegroundColor Green
# npx cap open android

Write-Host "✅ Build & Signing Complete!" -ForegroundColor Cyan
Write-Host "🚀 You can find your signed APK at: $APK_DEST" -ForegroundColor Green
