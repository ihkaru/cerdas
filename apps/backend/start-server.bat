@echo off
title PHP-CGI Server
echo ================================
echo Starting PHP-CGI on port 8888
echo ================================
echo.

REM Check if PHP-CGI exists
if not exist "C:\php83-nts\php-cgi.exe" (
    echo ERROR: php-cgi.exe not found!
    echo Please check the path: C:\php83-nts\php-cgi.exe
    pause
    exit /b 1
)

REM Check if port 8888 is already in use
netstat -ano | findstr :8888 >nul
if %errorlevel% equ 0 (
    echo WARNING: Port 8888 is already in use!
    echo Please stop the other process first.
    pause
    exit /b 1
)

REM Start PHP-CGI with explicit php.ini path
echo Starting PHP-CGI...
echo Press Ctrl+C to stop
echo.
C:\php83-nts\php-cgi.exe -c C:\php83-nts\php.ini -b 127.0.0.1:8888

REM This line runs if PHP-CGI stops
echo.
echo PHP-CGI has stopped.
pause