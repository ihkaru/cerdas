@echo off
echo ========================================
echo   CERDAS - Starting All Applications
echo ========================================
echo.

:: Set custom ports
set BACKEND_PORT=8080
set CLIENT_PORT=9981
set EDITOR_PORT=9982

:: Start Backend (Caddy + PHP-CGI)
echo Starting Backend via Caddy...
cd %~dp0apps\backend && start "Cerdas Backend Launcher" call start-all-server.bat

timeout /t 2 /nobreak > nul

echo Starting Client App on port %CLIENT_PORT%...
start "Cerdas Client" cmd /k "cd /d %~dp0apps\client && pnpm dev --host --port %CLIENT_PORT%"

timeout /t 1 /nobreak > nul

echo Starting Editor App on port %EDITOR_PORT%...
start "Cerdas Editor" cmd /k "cd /d %~dp0apps\editor && pnpm dev --port %EDITOR_PORT%"

echo.
echo ========================================
echo   All apps starting...
echo.
echo   Backend API:  http://localhost:%BACKEND_PORT%
echo   Client App:   http://localhost:%CLIENT_PORT%
echo   Editor App:   http://localhost:%EDITOR_PORT%
echo.
echo   Close this window or press any key to exit.
echo ========================================
pause > nul
