@echo off
REM ============================================================================
REM Start All Development Servers
REM ============================================================================
REM Starts: Backend (PHP-CGI + Caddy), Client App, Editor App, Reverb WebSocket
REM ============================================================================

REM Load configuration
call "%~dp0config.bat"

title Cerdas Launcher

echo ========================================
echo   CERDAS - Starting All Applications
echo ========================================
echo.

REM Start Backend (Caddy + PHP-CGI)
echo [1/4] Starting Backend...
call "%~dp0backend\start.bat"

timeout /t 2 /nobreak > nul

REM Start Client App
echo [2/4] Starting Client App on port %CLIENT_PORT%...
start "Cerdas Client" cmd /k "cd /d %~dp0..\apps\client && pnpm dev --host --port %CLIENT_PORT%"

timeout /t 1 /nobreak > nul

REM Start Editor App
echo [3/4] Starting Editor App on port %EDITOR_PORT%...
start "Cerdas Editor" cmd /k "cd /d %~dp0..\apps\editor && pnpm dev --port %EDITOR_PORT%"

timeout /t 1 /nobreak > nul

REM Start Reverb WebSocket Server
echo [4/5] Starting Reverb WebSocket on port 6001...
start "Cerdas Reverb" cmd /k "cd /d %~dp0..\apps\backend && php artisan reverb:start --port=6001"

timeout /t 1 /nobreak > nul

REM Start Queue Worker
echo [5/5] Starting Queue Worker...
start "Cerdas Queue" cmd /k "cd /d %~dp0..\apps\backend && php artisan queue:work"

echo.
echo ========================================
echo   All apps starting...
echo.
echo   Backend API:  http://localhost:%BACKEND_PORT%
echo   Client App:   http://localhost:%CLIENT_PORT%
echo   Editor App:   http://localhost:%EDITOR_PORT%
echo   Reverb WS:    ws://localhost:6001
echo.
echo   Close this window when done.
echo ========================================
pause > nul
