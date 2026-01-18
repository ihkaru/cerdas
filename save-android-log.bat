@echo off
echo Saving Android Logcat to logs\android.log...
adb logcat -d *:S Capacitor:V Capacitor/Console:V Capacitor/Plugin:V > logs\android.log
echo Done! Log saved to logs\android.log
