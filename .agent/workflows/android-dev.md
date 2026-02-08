---
description: Fresh start Android development with Live Reload and clean servers
---

# Fresh Android Dev with Live Reload

Complete fresh start for Android development using the frontend dev server with Live Reload. Ensures everything is clean and synced.

## What This Does
1. Stops all running servers
2. Cleans Android app from device
3. Clears Android assets 
4. Syncs Capacitor (without build - uses dev server)
5. Starts all servers fresh
6. Opens Android Studio

## Prerequisites
- Android Studio installed
- AVD or physical device connected
- `useLiveReload = true` in `capacitor.config.ts`

## Steps

// turbo-all

### 1. Stop all running servers
```powershell
taskkill /F /IM php.exe /IM node.exe 2>$null
Write-Host "All servers stopped"
```

### 2. Force stop and uninstall app from device
```powershell
adb shell am force-stop com.cerdas.client
adb uninstall com.cerdas.client
Write-Host "App cleaned from device"
```

### 3. Clear Android assets folder
```powershell
cd c:\projects\cerdas\apps\client
Remove-Item -Recurse -Force android\app\src\main\assets\public -ErrorAction SilentlyContinue
Write-Host "Android assets cleared"
```

### 4. Sync Capacitor (copies dist folder for fallback)
```powershell
cd c:\projects\cerdas\apps\client
npx cap sync android
```

### 5. Start all servers (Backend + Client + Editor)
```powershell
cd c:\projects\cerdas
Start-Process -FilePath "cmd.exe" -ArgumentList "/c start-all.bat"
Write-Host "Servers starting..."
```

### 6. Wait for servers to initialize
```powershell
Start-Sleep -Seconds 5
Write-Host "Waiting for servers..."
```

### 7. Open Android Studio
```powershell
cd c:\projects\cerdas\apps\client
npx cap open android
```

### 8. In Android Studio
1. Wait for Gradle sync to complete
2. Click **Run** (green play button)
3. App loads from dev server with **Live Reload** enabled!

## Quick One-Liner

```powershell
taskkill /F /IM php.exe /IM node.exe 2>$null; adb shell am force-stop com.cerdas.client; adb uninstall com.cerdas.client; cd c:\projects\cerdas\apps\client; Remove-Item -Recurse -Force android\app\src\main\assets\public -ErrorAction SilentlyContinue; npx cap sync android; cd c:\projects\cerdas; Start-Process cmd.exe -ArgumentList "/c start-all.bat"; Start-Sleep 5; cd apps\client; npx cap open android
```

## Live Reload Benefits
- Edit any file in `apps/client/src`
- Save the file
- App in emulator **auto-refreshes** within 2 seconds!
- No need to rebuild or restart

## Troubleshooting

### App shows "Cannot connect to server"
- Dev servers not running - check if `start-all.bat` windows are open
- Vite server not on port 9981 - check for port conflicts

### App loads but no live reload
- Check `useLiveReload = true` in `capacitor.config.ts`
- Verify emulator can reach `10.0.2.2:9981`
