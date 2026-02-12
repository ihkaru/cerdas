@echo off
node scripts/audit-docker-config.js
if %errorlevel% neq 0 (
    echo.
    echo ❌ Safety Audit Failed. Please fix the issues above before pushing.
    exit /b 1
)
