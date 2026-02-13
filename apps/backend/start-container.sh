#!/bin/sh
set -e

echo "🚀 Starting deployment tasks..."

echo "📦 Running migrations..."
php artisan migrate --force

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
