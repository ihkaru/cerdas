@echo off
echo Stopping all Cerdas apps...

:: Kill specific Cerdas app windows (Surgical strike)
:: Avoids killing other cmd windows or the agent
taskkill /F /FI "WINDOWTITLE eq Cerdas Backend" 2>nul
taskkill /F /FI "WINDOWTITLE eq Cerdas Client" 2>nul
taskkill /F /FI "WINDOWTITLE eq Cerdas Editor" 2>nul
taskkill /F /FI "WINDOWTITLE eq Cerdas Reverb" 2>nul

:: Kill PHP processes (Backend)
taskkill /f /im php.exe 2>nul
taskkill /f /im php-cgi.exe 2>nul
taskkill /f /im caddy.exe 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8888') do taskkill /f /pid %%a 2>nul

:: Kill processes on specific ports (Frontend/Editor)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :9980') do taskkill /f /pid %%a 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :9981') do taskkill /f /pid %%a 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :9982') do taskkill /f /pid %%a 2>nul

:: Kill Reverb WebSocket server (port 6001)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :6001') do taskkill /f /pid %%a 2>nul

echo All apps stopped.
timeout /t 2 /nobreak > nul
