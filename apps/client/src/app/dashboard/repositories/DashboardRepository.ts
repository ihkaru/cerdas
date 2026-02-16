
import { SQLiteDBConnection } from '@capacitor-community/sqlite';
import { useLogger } from '../../../common/utils/logger';
import { generateUUID } from '../../../common/utils/uuid';
import type { App, Assignment, Table } from '../types';

const log = useLogger('DashboardRepository');

/** Parse and normalize the fields column from a table row */
function normalizeFields(raw: unknown): unknown {
    let parsed = raw;
    if (typeof parsed === 'string') {
        try { parsed = JSON.parse(parsed); }
        catch (e) { log.error('Failed to parse fields JSON', e); return { fields: [] }; }
    }
    if (!parsed || typeof parsed !== 'object') return { fields: [] };

    // Already correct: direct array or { fields: [...] }
    if (Array.isArray(parsed)) return parsed;
    const obj = parsed as Record<string, unknown>;
    if ('fields' in obj && Array.isArray(obj.fields)) return parsed;

    // Nested schema — unwrap
    if ('schema' in obj) {
        let inner = obj.schema;
        if (typeof inner === 'string') {
            try { inner = JSON.parse(inner); } catch { inner = { fields: [] }; }
        }
        return inner;
    }
    return { fields: [] };
}

export const DashboardRepository = {
    async getTables(db: SQLiteDBConnection): Promise<Table[]> {
        const res = await db.query(`SELECT * FROM tables`);
        return (res.values || []).map(row => ({
            ...row,
            layout: typeof row.layout === 'string' ? JSON.parse(row.layout) : row.layout,
            fields: typeof row.fields === 'string' ? JSON.parse(row.fields) : row.fields,
            settings: typeof row.settings === 'string' ? JSON.parse(row.settings) : row.settings
        }));
    },

    async getApps(db: SQLiteDBConnection): Promise<App[]> {
        const res = await db.query(`SELECT * FROM apps ORDER BY name ASC`);
        return (res.values || []).map(row => ({
            id: row.id,
            slug: row.slug,
            name: row.name,
            description: row.description,
            version: row.version,
            navigation: typeof row.navigation === 'string' ? JSON.parse(row.navigation) : row.navigation,
            view_configs: typeof row.view_configs === 'string' ? JSON.parse(row.view_configs) : row.view_configs,
            synced_at: row.synced_at
        }));
    },

    async getAssignments(db: SQLiteDBConnection, limit: number = 50, offset: number = 0): Promise<Assignment[]> {
        log.debug(`getAssignments fetching limit=${limit} offset=${offset}...`);
        
        // LEFT JOIN with subquery to get only LATEST response per assignment (prevents duplicates)
        const res = await db.query(
            `SELECT a.*, latest_response.data as response_data 
             FROM assignments a 
             LEFT JOIN (
                SELECT assignment_id, data, updated_at
                FROM responses r1
                WHERE r1.updated_at = (
                    SELECT MAX(r2.updated_at) 
                    FROM responses r2 
                    WHERE r2.assignment_id = r1.assignment_id
                )
             ) AS latest_response ON a.id = latest_response.assignment_id
             ORDER BY a.synced_at DESC 
             LIMIT ? OFFSET ?`, 
            [limit, offset]
        );
        const count = res.values?.length || 0;
        
        // Log statuses for debugging
        const preview = (res.values || []).slice(0, 5).map(r => 
            `${r.external_id || r.id}: ${r.status} [Resp: ${!!r.response_data}]`
        ).join(', ');
        log.debug(`getAssignments fetched ${count} rows. Preview: [${preview}]`);

        return (res.values || []).map(row => ({
            ...row,
            prelist_data: typeof row.prelist_data === 'string' ? JSON.parse(row.prelist_data || '{}') : row.prelist_data,
            response_data: typeof row.response_data === 'string' ? JSON.parse(row.response_data || '{}') : row.response_data
        }));
    },

    async getAssignmentCount(db: SQLiteDBConnection): Promise<number> {
        const res = await db.query(`SELECT COUNT(*) as count FROM assignments`);
        return res.values?.[0]?.count || 0;
    },

    async getAssignmentStats(db: SQLiteDBConnection): Promise<{ status: string; count: number }[]> {
        // Always calculate from Local DB for accurate real-time stats
        const res = await db.query(`SELECT status, COUNT(*) as count FROM assignments GROUP BY status`);
        const dbStats = (res.values || []).map(row => ({ status: row.status || 'assigned', count: row.count || 0 }));
        
        // Ensure all statuses are represented (even if 0)
        const statusMap = new Map<string, number>();
        statusMap.set('assigned', 0);
        statusMap.set('in_progress', 0);
        statusMap.set('completed', 0);
        statusMap.set('synced', 0);
        
        for (const stat of dbStats) {
            statusMap.set(stat.status, stat.count);
        }
        
        return Array.from(statusMap.entries()).map(([status, count]) => ({ status, count }));
    },

    async getAssignmentById(db: SQLiteDBConnection, id: string): Promise<Assignment | null> {
        // Use subquery to get only latest response (prevents duplicates)
        const res = await db.query(
            `SELECT a.*, latest_response.data as response_data 
             FROM assignments a 
             LEFT JOIN (
                SELECT assignment_id, data, updated_at
                FROM responses r1
                WHERE r1.updated_at = (
                    SELECT MAX(r2.updated_at) 
                    FROM responses r2 
                    WHERE r2.assignment_id = r1.assignment_id
                )
             ) AS latest_response ON a.id = latest_response.assignment_id
             WHERE a.id = ?`, 
            [id]
        );
        if (!res.values || res.values.length === 0) return null;
        const row = res.values[0];
        return {
            ...row,
            prelist_data: typeof row.prelist_data === 'string' ? JSON.parse(row.prelist_data || '{}') : row.prelist_data,
            response_data: typeof row.response_data === 'string' ? JSON.parse(row.response_data || '{}') : row.response_data
        };
    },

    async getTable(db: SQLiteDBConnection, id: string): Promise<Table | null> {
        const res = await db.query(`SELECT * FROM tables WHERE id = ?`, [id]);
        if (!res.values || res.values.length === 0) return null;
        const row = res.values[0];
        
        return {
            ...row,
            layout: typeof row.layout === 'string' ? JSON.parse(row.layout) : row.layout,
            settings: typeof row.settings === 'string' ? JSON.parse(row.settings) : row.settings,
            fields: normalizeFields(row.fields)
        };
    },

    async getResponse(db: SQLiteDBConnection, assignmentId: string): Promise<{ data: Record<string, unknown>; schemaVersion: number | null } | null> {
        const res = await db.query(`SELECT data, schema_version FROM responses WHERE assignment_id = ?`, [assignmentId]);
        if (!res.values || res.values.length === 0) return null;
        const row = res.values[0];
        const data = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
        return { data, schemaVersion: row.schema_version || null };
    },

    async saveResponse(db: SQLiteDBConnection, assignmentId: string, data: Record<string, unknown>, isDraft: boolean) {
        log.info('saveResponse call:', { assignmentId, isDraft });
        const now = new Date().toISOString();
        const dataStr = JSON.stringify(data);
        
        const existing = await db.query(`SELECT local_id FROM responses WHERE assignment_id = ?`, [assignmentId]);
        
        if (existing.values && existing.values.length > 0) {
            await db.run(`UPDATE responses SET data = ?, updated_at = ?, is_synced = 0 WHERE assignment_id = ?`, 
                [dataStr, now, assignmentId]);
        } else {
            // Pin schema_version on first creation
            const assignRow = await db.query(`SELECT a.table_id, t.version FROM assignments a JOIN tables t ON t.id = a.table_id WHERE a.id = ?`, [assignmentId]);
            const schemaVer = assignRow.values?.[0]?.version || null;

            const localId = generateUUID();
            await db.run(`INSERT INTO responses (local_id, assignment_id, data, schema_version, is_synced, created_at, updated_at) VALUES (?, ?, ?, ?, 0, ?, ?)`, 
                [localId, assignmentId, dataStr, schemaVer, now, now]);
            log.info('Created response with schema_version:', { assignmentId, schemaVer });
        }
        
        if (!isDraft) {
             const res = await db.run(`UPDATE assignments SET status = 'completed' WHERE id = ?`, [assignmentId]);
             log.info('Updated (Finish) status COMPLETE:', { changes: res?.changes });
        } else {
             // Debug: Check current status to understand why update might fail
             const check = await db.query(`SELECT status FROM assignments WHERE id = ?`, [assignmentId]);
             const currentStatus = check.values?.[0]?.status;
             log.info('Draft Save - Current Assignment Status:', { id: assignmentId, status: currentStatus });

             // Relaxed condition: Update to in_progress if it's NOT completed and NOT already in_progress
             // This handles 'assigned', null, or other states
             const res = await db.run(`UPDATE assignments SET status = 'in_progress' WHERE id = ? AND status NOT IN ('completed', 'in_progress')`, [assignmentId]);
             log.info('Updated (Draft) status IN_PROGRESS:', { changes: res?.changes, assignmentId });
        }
    },

    async getPendingUploadCount(db: SQLiteDBConnection): Promise<number> {
        const res = await db.query(`SELECT COUNT(*) as count FROM responses WHERE is_synced = 0`);
        return res.values?.[0]?.count || 0;
    },

    async createLocalAssignment(db: SQLiteDBConnection, tableId: string): Promise<string> {
        const id = generateUUID();
        const now = new Date().toISOString();
        await db.run(
            `INSERT INTO assignments (id, table_id, status, created_at, updated_at) VALUES (?, ?, 'assigned', ?, ?)`,
            [id, tableId, now, now]
        );
        return id;
    },

    /**
     * Load cached schema for a specific table version from table_versions.
     * Used to render drafts with the schema they were originally created with.
     */
    async getSchemaForVersion(db: SQLiteDBConnection, tableId: string, version: number): Promise<{ fields: unknown; layout: unknown } | null> {
        const res = await db.query(
            `SELECT fields, layout FROM table_versions WHERE table_id = ? AND version = ?`,
            [tableId, version]
        );
        if (!res.values || res.values.length === 0) return null;
        const row = res.values[0];
        return {
            fields: typeof row.fields === 'string' ? JSON.parse(row.fields) : row.fields,
            layout: typeof row.layout === 'string' ? JSON.parse(row.layout) : row.layout,
        };
    },

    /**
     * Migrate a draft response from its pinned schema version to the current (latest) table version.
     * - Keeps data for fields that exist in the new schema
     * - Discards data for fields removed in the new schema
     * - Updates schema_version to the new version
     * 
     * Returns the new schema fields for re-rendering.
     */
    async migrateToLatestVersion(
        db: SQLiteDBConnection,
        assignmentId: string,
        tableId: string
    ): Promise<{ newVersion: number; newFields: unknown[]; newLayout: unknown; migratedData: Record<string, unknown> } | null> {
        // 1. Get current table schema (latest)
        const table = await this.getTable(db, tableId);
        if (!table || !table.version || !table.fields) return null;

        const newVersion = table.version;
        const newFields = Array.isArray(table.fields) ? table.fields : (table.fields as Record<string, unknown>).fields as unknown[] || [];

        // 2. Extract field names from the new schema
        const newFieldNames = new Set(
            newFields.map((f: unknown) => (f as Record<string, string>).name).filter(Boolean)
        );

        // 3. Get existing response data
        const response = await this.getResponse(db, assignmentId);
        if (!response) return null;

        // 4. Filter data: keep only fields that exist in the new schema
        const oldData = response.data || {};
        const migratedData: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(oldData)) {
            if (newFieldNames.has(key)) {
                migratedData[key] = value;
            }
        }

        // 5. Update response: set new schema_version and filtered data
        const now = new Date().toISOString();
        await db.run(
            `UPDATE responses SET data = ?, schema_version = ?, updated_at = ?, is_synced = 0 WHERE assignment_id = ?`,
            [JSON.stringify(migratedData), newVersion, now, assignmentId]
        );

        log.info('[migrateToLatestVersion] Migration complete', {
            assignmentId,
            fromVersion: response.schemaVersion,
            toVersion: newVersion,
            keptFields: Object.keys(migratedData).length,
            droppedFields: Object.keys(oldData).length - Object.keys(migratedData).length
        });

        return {
            newVersion,
            newFields,
            newLayout: table.layout || {},
            migratedData
        };
    }
};
