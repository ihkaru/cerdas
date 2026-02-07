@echo off
REM ============================================================================
REM Save Android Logs (without restart)
REM ============================================================================

REM Load configuration
call "%~dp0..\config.bat"

echo Saving Android logs...

if not exist "%~dp0..\..\logs" mkdir "%~dp0..\..\logs"
adb logcat -d *:S Capacitor/Console:* > "%~dp0..\..\logs\android.log"

echo Done! Log saved to logs\android.log
echo.
type "%~dp0..\..\logs\android.log"
