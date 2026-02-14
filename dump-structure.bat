@echo off
REM Wrapper for scripts/audit/dump-structure.ps1
powershell -ExecutionPolicy Bypass -File "%~dp0scripts\audit\dump-structure.ps1"
pause
