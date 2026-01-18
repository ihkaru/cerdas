---
description: Start Android development with Live Reload
---

# Android Development Workflow with Live Reload

This workflow enables fast development cycle with Live Reload on Android Emulator.

## Prerequisites
- Android Studio installed
- AVD (Android Virtual Device) created with API 29+ (Android 10+)
- Backend and Client servers running

## Steps

// turbo-all

### 1. Kill any existing servers
```powershell
taskkill /F /IM php.exe /IM node.exe 2>nul
```

### 2. Start all servers (Backend + Client + Editor)
```powershell
cd c:\projects\cerdas
start-all.bat
```

### 3. Wait for servers to start (5 seconds)
Check that:
- Backend is running at http://localhost:9980
- Client is running at http://localhost:9981

### 4. Build the client
```powershell
cd c:\projects\cerdas\apps\client
pnpm build
```

### 5. Sync with Android project
```powershell
cd c:\projects\cerdas\apps\client
npx cap sync android
```

### 6. Open in Android Studio
```powershell
cd c:\projects\cerdas\apps\client
npx cap open android
```

### 7. In Android Studio
1. Wait for Gradle sync to complete
2. Select your AVD (Android Virtual Device)
3. Click "Run" (green play button)
4. The app will load from your local dev server with Live Reload!

## Live Reload in Action
- Edit any Vue/TS file in `apps/client/src`
- Save the file
- The app in the emulator will **automatically refresh** within 2 seconds!

## Troubleshooting

### App shows blank screen
- Check if Vite dev server is running (`pnpm dev`)
- Verify `capacitor.config.ts` has `useLiveReload = true`

### Cannot connect to API
- Ensure backend is running on port 9980
- Verify `.env.local` has `VITE_API_URL=http://10.0.2.2:9980/api`

### Database errors
- SQLite uses native driver on Android - no WASM issues!

## Switching to Production Build
In `capacitor.config.ts`, set:
```typescript
const useLiveReload = false;
```
Then rebuild and run.

## Android Debugging Feedback Loop (ADB)

**IMPORTANT**: This is the preferred method for fast debugging on Android. Use these commands to programmatically restart the app and capture logs without manual interaction.

### Quick Commands

```powershell
# Restart app + capture log (one command)
.\restart-android.bat

# Or manually:
adb shell am force-stop com.cerdas.client && adb shell am start -n com.cerdas.client/.MainActivity

# Save logs only (without restart)
.\save-android-log.bat

# Clear logs before fresh capture
adb logcat -c
```

### Automated Debugging Cycle

When debugging Android issues, use this cycle:

```powershell
# 1. Clear old logs
adb logcat -c

# 2. Force stop and restart app
adb shell am force-stop com.cerdas.client
adb shell am start -n com.cerdas.client/.MainActivity

# 3. Wait for app to initialize (3-5 seconds)
timeout /t 4 /nobreak > nul

# 4. Capture logs to file
adb logcat -d *:S Capacitor/Console:* > logs\android.log

# 5. View the log file for errors
# (I can read this file directly)
```

### Log Filtering

```powershell
# All Capacitor console output
adb logcat -d *:S Capacitor/Console:*

# Only errors
adb logcat -d *:S Capacitor/Console:E

# Full Capacitor (verbose)
adb logcat -d *:S Capacitor:V Capacitor/Console:V Capacitor/Plugin:V
```

### Log Files Location
- `logs/android.log` - Latest captured log

### What to Look For in Logs
1. **`[vite] connected.`** - Live reload working
2. **`Database initialized`** - SQLite ready
3. **`Capacitor/Console: E`** - Errors (red flag!)
4. **`Sending plugin error`** - Native plugin errors

### Common Issues & Fixes
| Error | Solution |
|-------|----------|
| `Connection cerdas_db already exists` | Handled automatically, check for `Connection exists, retrieving...` |
| `no such column: xyz` | Query uses wrong column name, check schema |
| `Unexpected token` | WebView too old, use API 30+ emulator for dev |
| `Unable to read file at path public/plugins` | Harmless warning, ignore |

