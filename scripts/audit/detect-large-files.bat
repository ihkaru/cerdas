@echo off
REM ============================================================================
REM Detect Large Files (God Files)
REM ============================================================================
REM Scans project for files exceeding 400 lines that may need refactoring
REM ============================================================================

powershell -ExecutionPolicy Bypass -File "%~dp0detect-large-files.ps1"
pause
