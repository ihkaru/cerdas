@echo off
REM ============================================================================
REM Restart Android App and Capture Logs
REM ============================================================================

REM Load configuration
call "%~dp0..\config.bat"

echo Restarting Android app and capturing logs...

REM Clear logcat
adb logcat -c

REM Force stop and restart app
adb shell am force-stop %ANDROID_PACKAGE%
adb shell am start -n %ANDROID_PACKAGE%/.MainActivity

REM Wait for app to start
timeout /t 4 /nobreak > nul

REM Capture logs
if not exist "%~dp0..\..\logs" mkdir "%~dp0..\..\logs"
adb logcat -d *:S Capacitor/Console:* > "%~dp0..\..\logs\android.log"

echo Done! Log saved to logs\android.log
echo.
echo Recent errors:
type "%~dp0..\..\logs\android.log" | findstr /I "Error Msg:"
