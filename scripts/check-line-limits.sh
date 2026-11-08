#!/usr/bin/env bash
# Wrapper for agy-ops gate and CI execution
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

if command -v bun >/dev/null 2>&1; then
    exec bun "$SCRIPT_DIR/check-line-limits.mjs" "$@"
else
    exec node "$SCRIPT_DIR/check-line-limits.mjs" "$@"
fi
