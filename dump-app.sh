#!/bin/bash

# ============================================================================
# CERDAS - Single App Data Dump Tool
# ============================================================================
# Dumps all data related to a single app (including structure and responses).
# Usage: ./dump-app.sh [app-slug]
# ============================================================================

if [ -z "$1" ]; then
    echo "Usage: ./dump-app.sh [app-slug]"
    echo "Example: ./dump-app.sh cetar-pbi"
    exit 1
fi

APP_SLUG=$1
CONTAINER_NAME="cerdas-mariadb-1"

# Load credentials from .env.docker
DB_NAME=$(grep DB_DATABASE .env.docker | cut -d'=' -f2)
DB_USER=$(grep DB_USERNAME .env.docker | cut -d'=' -f2)
DB_PASS=$(grep DB_PASSWORD .env.docker | cut -d'=' -f2)

# 1. Find App ID
APP_ID=$(docker exec $CONTAINER_NAME mariadb -u $DB_USER -p$DB_PASS -N -s -e "SELECT id FROM apps WHERE slug='$APP_SLUG';" $DB_NAME)

if [ -z "$APP_ID" ]; then
    echo "Error: Application with slug '$APP_SLUG' not found!"
    exit 1
fi

OUTPUT_FILE="dump_app_${APP_SLUG}.sql"
echo "Found App ID: $APP_ID"
echo "Dumping data to $OUTPUT_FILE..."

# Start the file
echo "-- CERDAS Data Dump for App: $APP_SLUG ($APP_ID)" > $OUTPUT_FILE
echo "-- Generated on: $(date)" >> $OUTPUT_FILE
echo "SET FOREIGN_KEY_CHECKS=0;" >> $OUTPUT_FILE

# Helper function to dump with where clause
dump_table() {
    local table=$1
    local where=$2
    
    # Check if data exists first
    local count=$(docker exec $CONTAINER_NAME mariadb -u $DB_USER -p$DB_PASS -N -s -e "SELECT COUNT(*) FROM $table WHERE $where;" $DB_NAME)
    
    if [ "$count" -gt 0 ]; then
        echo "  [+] Dumping $table ($count rows)..."
        echo "-- Table: $table ($count rows found)" >> $OUTPUT_FILE
        docker exec $CONTAINER_NAME mysqldump -u $DB_USER -p$DB_PASS --no-create-info --skip-comments --compact --single-transaction --skip-lock-tables --where="$where" $DB_NAME $table >> $OUTPUT_FILE
        echo "" >> $OUTPUT_FILE
    else
        echo "  [-] Skipping $table (Table is empty for this app)"
        echo "-- Table: $table (SKIPPED: No data found for this app)" >> $OUTPUT_FILE
        echo "" >> $OUTPUT_FILE
    fi
}

# 2. Dump Apps
dump_table "apps" "id='$APP_ID'"

# 3. Dump Tables
dump_table "tables" "app_id='$APP_ID'"

# 4. Dump Table Versions
dump_table "table_versions" "table_id IN (SELECT id FROM tables WHERE app_id='$APP_ID')"

# 5. Dump Views
dump_table "views" "app_id='$APP_ID'"

# 6. Dump Assignments (Limited to 2 for testing)
ASSIGNMENT_IDS=$(docker exec $CONTAINER_NAME mariadb -u $DB_USER -p$DB_PASS -N -s -e "SELECT id FROM assignments WHERE table_id IN (SELECT id FROM tables WHERE app_id='$APP_ID') LIMIT 2;" $DB_NAME | tr '\n' ',' | sed 's/,$//' | sed "s/,/','/g")

if [ ! -z "$ASSIGNMENT_IDS" ]; then
    echo "  [+] Dumping assignments (Limited to 2 rows)..."
    echo "-- Table: assignments (Limited to 2)" >> $OUTPUT_FILE
    docker exec $CONTAINER_NAME mysqldump -u $DB_USER -p$DB_PASS --no-create-info --skip-comments --compact --single-transaction --skip-lock-tables --where="id IN ('$ASSIGNMENT_IDS')" $DB_NAME assignments >> $OUTPUT_FILE
    echo "" >> $OUTPUT_FILE

    # 7. Dump Responses (Only for those 2 assignments)
    # Check count first
    RESP_COUNT=$(docker exec $CONTAINER_NAME mariadb -u $DB_USER -p$DB_PASS -N -s -e "SELECT COUNT(*) FROM responses WHERE assignment_id IN ('$ASSIGNMENT_IDS');" $DB_NAME)
    
    if [ "$RESP_COUNT" -gt 0 ]; then
        echo "  [+] Dumping responses ($RESP_COUNT rows)..."
        echo "-- Table: responses (Linked to limited assignments)" >> $OUTPUT_FILE
        docker exec $CONTAINER_NAME mysqldump -u $DB_USER -p$DB_PASS --no-create-info --skip-comments --compact --single-transaction --skip-lock-tables --where="assignment_id IN ('$ASSIGNMENT_IDS')" $DB_NAME responses >> $OUTPUT_FILE
        echo "" >> $OUTPUT_FILE
    else
        echo "  [-] Skipping responses (No responses found for these assignments)"
        echo "-- Table: responses (SKIPPED: No data found)" >> $OUTPUT_FILE
        echo "" >> $OUTPUT_FILE
    fi
else
    echo "  [-] Skipping assignments (No data found for this app)"
    echo "-- Table: assignments (SKIPPED: No data found for this app)" >> $OUTPUT_FILE
fi

# 8. Dump other child tables (Limited to 2 for consistency)
echo "-- Table: app_records (Limited to 2)" >> $OUTPUT_FILE
docker exec $CONTAINER_NAME mysqldump -u $DB_USER -p$DB_PASS --no-create-info --skip-comments --compact --single-transaction --skip-lock-tables --where="app_id='$APP_ID' LIMIT 2" $DB_NAME app_records >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

dump_table "app_invitations" "app_id='$APP_ID'"

echo "SET FOREIGN_KEY_CHECKS=1;" >> $OUTPUT_FILE

echo "========================================"
echo "  Success! App data dumped to $OUTPUT_FILE"
echo "========================================"
