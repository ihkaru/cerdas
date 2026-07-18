#!/bin/sh
set -e

# Debug: Log received arguments
echo "DEBUG: Received $# arguments: $@"

# --- Infrastructure Initialization (Always run for all roles: API, Worker, Scheduler) ---

echo "🔗 Linking storage..."
php artisan storage:link --force

echo "🔒 Correcting permissions..."
# Ensure the storage volume is owned by the app user (1000:1000)
# and bootstrap/cache is writable.
chown -R 1000:1000 storage bootstrap/cache

# If a custom command is provided (e.g., from docker-compose 'command'), execute it now.
# This ensures that Workers and Schedulers have the infrastructure ready.
if [ "$#" -gt 0 ]; then
    echo "🚀 Starting custom command: $@"
    exec "$@"
fi

# --- Default flow (Main API Server only) ---

echo "🚀 Starting deployment tasks..."

echo "📦 Running migrations..."
php artisan migrate --force

echo "🔄 Syncing latest APK version..."
php artisan apk:sync-version || true

echo "🔍 Discovering packages..."
php artisan package:discover --ansi

echo "🔥 Optimizing..."
php artisan optimize

echo "🚀 Starting FrankenPHP..."
exec php artisan octane:frankenphp \
    --host=0.0.0.0 \
    --port=8080 \
    --workers=auto \
    --max-requests=500
