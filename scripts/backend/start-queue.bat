@echo off
REM ============================================================================
REM Queue Worker - Auto-restart on crash/exit
REM Runs continuously. Worker restarts automatically if it:
REM   - Crashes (any error)
REM   - Exceeds --max-time (hourly graceful restart for memory hygiene)
REM   - Exceeds --memory limit (Laravel auto-exits worker safely)
REM ============================================================================
cd /d "%~dp0..\..\apps\backend"
title Cerdas Queue Worker

:worker_loop
echo.
echo [%DATE% %TIME%] ============================================
echo [%DATE% %TIME%] Starting Queue Worker...
echo [%DATE% %TIME%] ============================================

php -d memory_limit=512M artisan queue:work ^
    --memory=512 ^
    --timeout=3600 ^
    --tries=3 ^
    --backoff=5 ^
    --queue=default ^
    --sleep=3 ^
    --max-time=3600

REM -- Worker exited. Reasons: crash, --memory exceeded, or --max-time reached.
REM -- All are expected. Restarting automatically.
echo.
echo [%DATE% %TIME%] Worker stopped (exit code: %errorlevel%). Restarting in 3s...
timeout /t 3 /nobreak > nul
goto worker_loop
