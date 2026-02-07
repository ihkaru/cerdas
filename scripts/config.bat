@echo off
REM ============================================================================
REM CERDAS Environment Configuration
REM ============================================================================
REM This file contains environment-specific paths. Modify these to match your
REM local setup. This file is loaded by all scripts in the scripts/ folder.
REM ============================================================================

REM PHP Configuration
set PHP_PATH=C:\php83-nts
set PHP_CGI_PORT=8888

REM Caddy Configuration  
set CADDY_PATH=C:\caddy

REM Application Ports
set BACKEND_PORT=8080
set CLIENT_PORT=9981
set EDITOR_PORT=9982

REM Android Package
set ANDROID_PACKAGE=com.cerdas.client
