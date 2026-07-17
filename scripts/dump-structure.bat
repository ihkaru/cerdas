@echo off
REM Wrapper for scripts/audit/dump-structure.ps1
powershell -ExecutionPolicy Bypass -File "%~dp0audit\dump-structure.ps1"
pause
