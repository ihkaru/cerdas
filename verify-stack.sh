#!/bin/bash

# CERDAS Stack Verification Script (2026)
# Checks the health and role consistency of the Dockerized environment.

echo -e "\033[1;36m================================================\033[0m"
echo -e "\033[1;36m  CERDAS Stack Verification - Role & Health Check\033[0m"
echo -e "\033[1;36m================================================\033[0m"

# 1. Check Container Counts
REQUIRED_SERVICES=("mariadb" "backend" "reverb" "worker" "scheduler")
TOTAL_UP=$(docker compose -f docker-compose.dev.yml ps --format json | grep -c "running")

if [ "$TOTAL_UP" -ge 5 ]; then
    echo -e "\033[0;32m[OK]\033[0m All core services are running ($TOTAL_UP/5 identified)."
else
    echo -e "\033[0;31m[FAIL]\033[0m Only $TOTAL_UP/5 core services are running."
fi

# 2. Verify Health Status
echo -e "\n\033[1;33mChecking Health Status:\033[0m"
SERVICES_STATUS=$(docker compose -f docker-compose.dev.yml ps --format "{{.Service}}: {{.Status}}")

echo "$SERVICES_STATUS" | while read -r line; do
    if [[ $line == *"unhealthy"* ]]; then
        echo -e "  \033[0;31m[!]\033[0m $line"
    elif [[ $line == *"(healthy)"* ]]; then
        echo -e "  \033[0;32m[✓]\033[0m $line"
    else
        echo -e "  \033[0;37m[-]\033[0m $line"
    fi
done

# 3. Verify Reverb Role (Smart Entrypoint Validation)
echo -e "\n\033[1;33mVerifying Reverb Role Initialization:\033[0m"
REVERB_LOG=$(docker compose -f docker-compose.dev.yml logs reverb | grep "Starting custom command" | tail -n 1)
if [[ $REVERB_LOG == *"reverb:start"* ]]; then
    echo -e "  \033[0;32m[✓]\033[0m Reverb container correctly executing 'reverb:start'"
else
    echo -e "  \033[0;31m[!]\033[0m Reverb container might be misconfigured (Octane fallback detected)"
fi

# 4. Binary Connectivity Test
echo -e "\n\033[1;33mTesting Binary Ports:\033[0m"
# Check API
if command -v nc >/dev/null 2>&1; then
    if nc -z localhost 8080 2>/dev/null; then
        echo -e "  \033[0;32m[✓]\033[0m API Port 8080 (FrankenPHP) is OPEN"
    else
        echo -e "  \033[0;31m[!]\033[0m API Port 8080 is CLOSED"
    fi

    # Check Reverb
    if nc -z localhost 8081 2>/dev/null; then
        echo -e "  \033[0;32m[✓]\033[0m Reverb Port 8081 (WebSocket) is OPEN"
    else
        echo -e "  \033[0;31m[!]\033[0m Reverb Port 8081 is CLOSED"
    fi
else
    echo "  [SKIPPED] 'nc' not installed, cannot test ports directly."
fi

echo -e "\n\033[1;36m================================================\033[0m"
echo -e "Verification Complete."
