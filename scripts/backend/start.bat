@echo off
REM ============================================================================
REM Start Backend Server (PHP-CGI + Caddy)
REM ============================================================================

REM Load configuration
call "%~dp0..\config.bat"

echo Starting PHP-CGI and Caddy Server...
echo.

REM Start PHP-CGI in new window
start "PHP-CGI Server" cmd /k "call "%~dp0php-cgi.bat""

REM Wait for PHP-CGI to start
timeout /t 2 /nobreak > nul

REM Start Caddy in new window
start "Caddy Server" cmd /k "cd /d %~dp0..\..\apps\backend && %CADDY_PATH%\caddy.exe run"

echo.
echo Backend servers starting in separate windows...
