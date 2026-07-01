@echo off
set "BACKUP_DIR=docker-consolidation-%date:~-4,4%%date:~-10,2%%date:~-7,2%-%time:~0,2%%time:~3,2%"
set "BACKUP_DIR=%BACKUP_DIR: =0%"
mkdir "%BACKUP_DIR%"

echo 📦 Consolidating Docker Configuration to %BACKUP_DIR%...

:: 1. Copy Docker Compose Files
echo 📄 Copying Docker Compose files...
copy "docker-compose.yml" "%BACKUP_DIR%\"
copy "docker-compose.prod.yml" "%BACKUP_DIR%\"
copy "docker-compose.dev.yml" "%BACKUP_DIR%\"

:: 2. Copy Environment Files (Safe Copy)
echo 🔐 Copying Environment files...
if exist ".env" copy ".env" "%BACKUP_DIR%\.env.root"
if exist ".env.example" copy ".env.example" "%BACKUP_DIR%\.env.example"
if exist ".env.docker" copy ".env.docker" "%BACKUP_DIR%\.env.docker"
if exist ".env.production" copy ".env.production" "%BACKUP_DIR%\.env.production"

if exist "apps\client\.env" copy "apps\client\.env" "%BACKUP_DIR%\apps-client.env"
if exist "apps\backend\.env" copy "apps\backend\.env" "%BACKUP_DIR%\apps-backend.env"

:: 3. Copy Dockerfiles & Startup Scripts
echo 🐳 Copying Dockerfiles & Scripts...
mkdir "%BACKUP_DIR%\apps\backend"
copy "apps\backend\Dockerfile" "%BACKUP_DIR%\apps\backend\"
copy "apps\backend\Dockerfile.prod" "%BACKUP_DIR%\apps\backend\"
copy "apps\backend\start-container.sh" "%BACKUP_DIR%\apps\backend\"

mkdir "%BACKUP_DIR%\apps\client"
copy "apps\client\Dockerfile" "%BACKUP_DIR%\apps\client\"
copy "apps\client\Dockerfile.prod" "%BACKUP_DIR%\apps\client\"
copy "apps\client\nginx.conf" "%BACKUP_DIR%\apps\client\"

mkdir "%BACKUP_DIR%\apps\editor"
copy "apps\editor\Dockerfile" "%BACKUP_DIR%\apps\editor\"
copy "apps\editor\Dockerfile.prod" "%BACKUP_DIR%\apps\editor\"
copy "apps\editor\nginx.conf" "%BACKUP_DIR%\apps\editor\"

:: 4. Copy Deployment Scripts
echo 📜 Copying Deployment Scripts...
mkdir "%BACKUP_DIR%\scripts"
copy "scripts\audit-docker-config.js" "%BACKUP_DIR%\scripts\"
copy "audit-deployment.bat" "%BACKUP_DIR%\"
copy "DEPLOYMENT_WORKFLOWS.md" "%BACKUP_DIR%\"

echo ✅ Consolidation Complete!
echo 📂 Files are in: %BACKUP_DIR%
pause
