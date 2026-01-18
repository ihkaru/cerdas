@echo off
echo Starting PHP-CGI and Caddy Server...
echo.

REM Start PHP-CGI in new window
start "PHP-CGI Server" cmd /k "cd /d C:\projects\cerdas\apps\backend && start-server.bat"

REM Wait 2 seconds for PHP-CGI to start
timeout /t 2 /nobreak >nul

REM Start Caddy in new window
start "Caddy Server" cmd /k "cd /d C:\projects\cerdas\apps\backend && C:\caddy\caddy.exe run"

echo.
echo Both servers are starting in separate windows...
echo You can close this window now.
echo.
pause