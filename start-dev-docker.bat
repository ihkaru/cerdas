@echo off
REM ============================================================================
REM CERDAS - Start Hybrid Dev (Docker Backend + Local Frontend)
REM ============================================================================
REM Wrapper for PowerShell script
REM ============================================================================

powershell -ExecutionPolicy Bypass -File "%~dp0scripts\start-dev-docker.ps1"
