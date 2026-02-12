#!/bin/sh
set -e

echo "🚀 Starting deployment tasks..."

# Run migrations
echo "📦 Running migrations..."
php artisan migrate --force

# Discovery
echo "🔍 Discovering packages..."
php artisan package:discover --ansi

# Optimize
echo "🔥 Optimizing..."
php artisan optimize

# Start Octane
echo "🚀 Starting FrankenPHP..."
exec php artisan octane:frankenphp --host=0.0.0.0 --port=8080 --workers=auto --max-requests=500
