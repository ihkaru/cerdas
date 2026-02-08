---
description: Guarantee fresh Android build with clean assets and cache
---

# Fresh Android Build Workflow

Ensures the Android app running in Android Studio uses the absolute latest code with no cache issues.

## Prerequisites
- Android Studio installed
- AVD or physical device connected
- Dev servers running (if using Live Reload)

## Steps

// turbo-all

### 1. Kill any running app on device/emulator
```powershell
adb shell am force-stop com.cerdas.client
```

### 2. Uninstall existing app to clear all caches
```powershell
adb uninstall com.cerdas.client
```
Note: This may show "Failure" if app not installed - that's OK.

### 3. Clean Android assets folder
```powershell
cd c:\projects\cerdas\apps\client
Remove-Item -Recurse -Force android\app\src\main\assets\public -ErrorAction SilentlyContinue
Write-Host "Android assets cleared"
```

### 4. Build fresh production bundle
```powershell
cd c:\projects\cerdas\apps\client
pnpm build
```

### 5. Sync to Android with fresh assets
```powershell
cd c:\projects\cerdas\apps\client
npx cap sync android
```

### 6. Clean Gradle build cache (optional but thorough)
```powershell
cd c:\projects\cerdas\apps\client\android
.\gradlew clean
```

### 7. Open Android Studio
```powershell
cd c:\projects\cerdas\apps\client
npx cap open android
```

### 8. In Android Studio
1. Wait for Gradle sync to complete
2. **Build → Rebuild Project** (ensures clean build)
3. Click **Run** (green play button)
4. App will be fresh-installed with latest code!

## Quick One-Liner (Copy-Paste)

For fastest execution, run this single command:

```powershell
cd c:\projects\cerdas\apps\client; adb shell am force-stop com.cerdas.client; adb uninstall com.cerdas.client; Remove-Item -Recurse -Force android\app\src\main\assets\public -ErrorAction SilentlyContinue; pnpm build; npx cap sync android; npx cap open android
```

## Troubleshooting

### App still shows old version
- In Android Studio: **Build → Clean Project**, then **Build → Rebuild Project**
- Check if `useLiveReload = true` in `capacitor.config.ts` - if true, app loads from dev server

### Gradle sync failed
```powershell
cd c:\projects\cerdas\apps\client\android
.\gradlew --stop
.\gradlew clean
```

### ADB not found
Add Android SDK platform-tools to PATH, typically:
```
C:\Users\<username>\AppData\Local\Android\Sdk\platform-tools
```
