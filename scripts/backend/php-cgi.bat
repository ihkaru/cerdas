@echo off
REM ============================================================================
REM Start PHP-CGI Server
REM ============================================================================

REM Load configuration
call "%~dp0..\config.bat"

title PHP-CGI Server
echo ================================
echo Starting PHP-CGI on port %PHP_CGI_PORT%
echo ================================
echo.

REM Check if PHP-CGI exists
if not exist "%PHP_PATH%\php-cgi.exe" (
    echo ERROR: php-cgi.exe not found!
    echo Please update PHP_PATH in scripts\config.bat
    echo Current path: %PHP_PATH%\php-cgi.exe
    pause
    exit /b 1
)

REM Check if port is already in use
netstat -ano | findstr :%PHP_CGI_PORT% > nul
if %errorlevel% equ 0 (
    echo WARNING: Port %PHP_CGI_PORT% is already in use!
    echo Please stop the other process first.
    pause
    exit /b 1
)

REM Start PHP-CGI
echo Starting PHP-CGI...
echo Press Ctrl+C to stop
echo.
"%PHP_PATH%\php-cgi.exe" -c "%PHP_PATH%\php.ini" -b 127.0.0.1:%PHP_CGI_PORT%

echo.
echo PHP-CGI has stopped.
pause
