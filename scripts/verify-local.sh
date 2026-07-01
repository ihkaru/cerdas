#!/bin/sh

# Local Verification Script
# Runs strict checks mirroring GitHub Actions (Linting, Types, Backend Style)
# Usage: ./verify-local.sh [--force-all]

FORCE_ALL=0
if [ "$1" = "--force-all" ]; then
    FORCE_ALL=1
fi

echo "🚀 Starting Local Verification..."

# Detect changes if not forced
if [ $FORCE_ALL -eq 0 ]; then
    # Get list of changed files between HEAD and previous commit (for pre-push context usually)
    # Or staged files? No, pre-push checks committed files.
    CHANGED_FILES=$(git diff --name-only HEAD@{1}..HEAD 2>/dev/null || git diff --name-only HEAD~1..HEAD 2>/dev/null || echo "")
else
    CHANGED_FILES="apps/client/ apps/backend/"
    echo "⚠️  Forcing checks on all projects..."
fi

# --- CLIENT CHECKS ---
CLIENT_CHANGED=$(echo "$CHANGED_FILES" | grep -E "^(apps/client/|packages/)" || true)

if [ -n "$CLIENT_CHANGED" ] || [ $FORCE_ALL -eq 1 ]; then
    echo ""
    echo "📦 Client/Packages changes detected."
    
    echo "🏗️  [Client] Building & Type Checking (vue-tsc + vite)..."
    pnpm --filter client build
    if [ $? -ne 0 ]; then
        echo "❌ [Client] BUILD FAILED"
        exit 1
    fi

    echo "🧹 [Client] Linting (ESLint)..."
    pnpm --filter client lint
    if [ $? -ne 0 ]; then
        echo "❌ [Client] LINT FAILED"
        exit 1
    fi
    
    echo "✅ [Client] Verified."
fi

# --- BACKEND CHECKS ---
BACKEND_CHANGED=$(echo "$CHANGED_FILES" | grep -E "^apps/backend/" || true)

if [ -n "$BACKEND_CHANGED" ] || [ $FORCE_ALL -eq 1 ]; then
    echo ""
    echo "🐘 Backend changes detected."
    
    # Check if we are in root or subfolder
    if [ -d "apps/backend" ]; then
        cd apps/backend || exit 1
    fi
    
    echo "🎨 [Backend] Laravel Pint (Style Check)..."
    if [ -f vendor/bin/pint ]; then
        ./vendor/bin/pint --test
        if [ $? -ne 0 ]; then
            echo "❌ [Backend] PINT FAILED (Style issues found)"
            echo "   Run './vendor/bin/pint' to auto-fix."
            exit 1
        fi
    else
        echo "⚠️  [Backend] Pint not found, skipping."
    fi

    echo "🔍 [Backend] PHPMD (Mess Detector)..."
    if [ -f vendor/bin/phpmd ]; then
         ./vendor/bin/phpmd app text cleancode,codesize,naming,unusedcode --exclude app/Console/Kernel.php
         if [ $? -ne 0 ]; then
            echo "❌ [Backend] PHPMD FAILED"
            exit 1
         fi
    else
        echo "⚠️  [Backend] PHPMD not found, skipping."
    fi
    
    # Return to root if we changed directory
    if [ -d "../../apps/backend" ]; then
        cd ../..
    fi
    
    echo "✅ [Backend] Verified."
fi

echo ""
echo "🎉 All local verifications passed!"
exit 0
