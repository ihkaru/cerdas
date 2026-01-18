@echo off
rem Wrapper to run the PowerShell script
powershell -ExecutionPolicy Bypass -File "./scripts/detect-large-files.ps1"
pause
