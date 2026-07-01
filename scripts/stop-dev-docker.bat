@echo off
REM ============================================================================
REM CERDAS - Stop Hybrid Dev (Docker Backend + Local Frontend)
REM ============================================================================
REM Wrapper for PowerShell script
REM ============================================================================

powershell -ExecutionPolicy Bypass -File "%~dp0scripts\stop-dev-docker.ps1"
