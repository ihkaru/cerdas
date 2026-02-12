#!/bin/sh
set -e

echo "🚀 Starting deployment tasks..."

echo "🔍 Debugging FrankenPHP..."
if [ -f "/usr/local/bin/frankenphp" ]; then
    echo "✅ Found at /usr/local/bin/frankenphp"
    ls -la /usr/local/bin/frankenphp
else
    echo "❌ NOT FOUND at /usr/local/bin/frankenphp"
    echo "🔍 Seaching in /usr/local/bin:"
    ls -la /usr/local/bin
    echo "🔍 Checking PATH..."
    which frankenphp || echo "frankenphp not in PATH"
fi

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
