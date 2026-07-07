#!/bin/bash

# =============================================================================
# CERDAS - Start Hybrid Dev (Local Docker Backend + Local Frontend)
# =============================================================================
# API calls go to: http://localhost:8090/api
# =============================================================================

export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

PROJECT_ROOT=$(pwd)
CLIENT_DIR="$PROJECT_ROOT/apps/client"
EDITOR_DIR="$PROJECT_ROOT/apps/editor"

echo ""
echo -e "\033[1;35m========================================\033[0m"
echo -e "\033[1;35m  CERDAS Hybrid Dev - DOCKER Backend\033[0m"
echo -e "\033[1;35m========================================\033[0m"
echo ""

# 1. Stop existing docker servers
echo -e "\033[1;33m[1/5] Stopping existing Docker services...\033[0m"
docker compose -f docker-compose.dev.yml down
sleep 2

# 2. Start Docker Backend
echo -e "\033[1;33m[2/5] Starting Docker Backend (Build & Up)...\033[0m"
docker compose -f docker-compose.dev.yml up -d --build mariadb backend worker scheduler reverb

echo -e "\033[0;37m  -> Waiting for Backend Health (10s)...\033[0m"
sleep 10

# 3. Configure Client (.env)
echo -e "\033[1;33m[3/5] Configuring Client for Hybrid Mode...\033[0m"
if [ -f "$CLIENT_DIR/.env.docker-web" ]; then
    cp "$CLIENT_DIR/.env.docker-web" "$CLIENT_DIR/.env"
    echo -e "\033[0;37m  -> Client API set to: http://localhost:8090/api\033[0m"
else
    echo -e "\033[1;31m  -> ERROR: $CLIENT_DIR/.env.docker-web not found!\033[0m"
fi

# 4. Configure Editor (.env)
echo -e "\033[1;33m[4/5] Configuring Editor for Hybrid Mode...\033[0m"
if [ -f "$EDITOR_DIR/.env.docker-web" ]; then
    cp "$EDITOR_DIR/.env.docker-web" "$EDITOR_DIR/.env"
    echo -e "\033[0;37m  -> Editor API set to: http://localhost:8090/api\033[0m"
else
    echo -e "\033[1;31m  -> ERROR: $EDITOR_DIR/.env.docker-web not found!\033[0m"
fi

echo ""
echo -e "\033[1;32m========================================\033[0m"
echo -e "\033[1;32m  Ready! Backend & Frontend are starting\033[0m"
echo -e "\033[1;32m========================================\033[0m"
echo ""

# Function to cleanup background processes on exit
cleanup() {
    echo -e "\n\033[1;33mStopping all services...\033[0m"
    kill $EDITOR_PID $CLIENT_PID 2>/dev/null
    echo -e "\033[1;32mDone.\033[0m"
    exit
}

trap cleanup SIGINT SIGTERM

# 5. Start Frontend Servers in background
echo -e "\033[1;33m[5/5] Launching Frontend servers...\033[0m"

# Attempt to load nvm if pnpm isn't found natively in the bash context
if ! command -v pnpm &> /dev/null; then
    if [ -d "$HOME/.local/share/nvm" ] || [ -d "$HOME/.nvm" ]; then
        NVM_DIR="${HOME}/.nvm"
        [ -d "$HOME/.local/share/nvm" ] && NVM_DIR="$HOME/.local/share/nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    fi
fi

# Fallback: manually append node paths to PATH if still not found
if ! command -v pnpm &> /dev/null; then
    for dir in "$HOME/.local/share/nvm/"*/bin "$HOME/.nvm/versions/node/"*/bin; do
        if [ -x "$dir/pnpm" ]; then
            export PATH="$dir:$PATH"
            break
        fi
    done
fi

if ! command -v pnpm &> /dev/null; then
    echo -e "\033[1;31m  -> ERROR: 'pnpm' command not found!\033[0m"
    echo -e "\033[0;37m     Please ensure pnpm is installed and accessible in bash context.\033[0m"
    exit 1
fi

echo -e "\033[1;36m  -> Starting Editor on port 3001...\033[0m"
pnpm --filter editor dev --host --port 3001 > editor.log 2>&1 &
EDITOR_PID=$!

echo -e "\033[1;36m  -> Starting Client on port 3000...\033[0m"
pnpm --filter client dev --host --port 3000 > client.log 2>&1 &
CLIENT_PID=$!

echo ""
echo -e "\033[1;37m  URLs:\033[0m"
echo -e "\033[1;36m  - Editor App:\033[0m http://localhost:3001"
echo -e "\033[1;36m  - Client App:\033[0m http://localhost:3000"
echo -e "\033[1;36m  - Backend API:\033[0m http://localhost:8090/api"
echo ""
echo -e "\033[0;90m  (Logs are hidden. Press Ctrl+C to stop everything)\033[0m"
echo -e "\033[1;32m========================================\033[0m"

# Wait for background processes
wait
