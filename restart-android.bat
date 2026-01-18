@echo off
echo Restarting Android app and capturing logs...
adb logcat -c
adb shell am force-stop com.cerdas.client
adb shell am start -n com.cerdas.client/.MainActivity
timeout /t 4 /nobreak > nul
adb logcat -d *:S Capacitor/Console:* > logs\android.log
echo Done! Log saved to logs\android.log
type logs\android.log | findstr /I "Error Msg:"
