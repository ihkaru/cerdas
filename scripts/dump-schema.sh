#!/bin/bash

# ============================================================================
# CERDAS - Database Schema Dump Tool
# ============================================================================
# Dumps the database schema (no data) from the active MariaDB container.
# ============================================================================

# 1. Load configuration from .env.docker
if [ ! -f .env.docker ]; then
    echo "Error: .env.docker file not found!"
    exit 1
fi

DB_NAME=$(grep DB_DATABASE .env.docker | cut -d'=' -f2)
DB_USER=$(grep DB_USERNAME .env.docker | cut -d'=' -f2)
DB_PASS=$(grep DB_PASSWORD .env.docker | cut -d'=' -f2)
CONTAINER_NAME="cerdas-mariadb-1"

OUTPUT_FILE="schema-final.sql"

echo "========================================"
echo "  CERDAS - Dumping Schema "
echo "========================================"
echo "  Container: $CONTAINER_NAME"
echo "  Database:  $DB_NAME"
echo "  Output:    $OUTPUT_FILE"
echo "========================================"

# 2. Run dump command inside container
# --no-data: schema only
# --skip-comments: cleaner SQL
# --compact: minimal overhead
docker exec $CONTAINER_NAME mariadb-dump -u $DB_USER -p$DB_PASS --no-data --skip-comments $DB_NAME > $OUTPUT_FILE

if [ $? -eq 0 ]; then
    echo "Check: Success! Schema dumped to $OUTPUT_FILE"
    # Optional: cleanup output to remove MariaDB-specific session variables for portability
    sed -i '/\/\*!/d' $OUTPUT_FILE
    echo "Check: Cleaned up session variables for better portability."
else
    echo "Error: Dump failed! Is the container running?"
fi

echo "========================================"
