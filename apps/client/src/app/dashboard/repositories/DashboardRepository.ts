
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
            start_date: row.start_date,
            end_date: row.end_date,
            expired_behavior: row.expired_behavior || 'read_only',
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

    /**
     * Per-app assignment stats via JOIN: assignments → tables → app_id.
     * Used for smart urgency sorting and badge display in AppGallery.
     * Returns one row per app that has at least 1 assignment.
     */
    async getAppStats(db: SQLiteDBConnection): Promise<{ app_id: string; pending: number; in_progress: number; completed: number; total: number }[]> {
        const res = await db.query(`
            SELECT 
                t.app_id,
                SUM(CASE WHEN a.status = 'assigned' THEN 1 ELSE 0 END)               AS pending,
                SUM(CASE WHEN a.status IN ('in_progress', 'rejected') THEN 1 ELSE 0 END) AS in_progress,
                SUM(CASE WHEN a.status IN ('completed', 'synced', 'submitted', 'approved') THEN 1 ELSE 0 END) AS completed,
                COUNT(*) AS total
            FROM assignments a
            JOIN tables t ON a.table_id = t.id
            WHERE t.app_id IS NOT NULL
            GROUP BY t.app_id
        `);
        return (res.values || []).map(row => ({
            app_id: row.app_id,
            pending:     Number(row.pending)     || 0,
            in_progress: Number(row.in_progress) || 0,
            completed:   Number(row.completed)   || 0,
            total:       Number(row.total)        || 0,
        }));
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
    },    async isTableReadOnly(db: SQLiteDBConnection, tableId: string): Promise<boolean> {
        const res = await db.query(`
            SELECT a.end_date, a.expired_behavior 
            FROM apps a
            JOIN tables t ON a.id = t.app_id
            WHERE t.id = ?
        `, [tableId]);
        if (!res.values || res.values.length === 0) return false;
        const row = res.values[0];
        if (!row.end_date) return false;
        
        const now = new Date();
        const isExpired = now > new Date(row.end_date);
        return isExpired && row.expired_behavior === 'read_only';
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
        
        const existing = await db.query(`SELECT local_id, assignment_id FROM responses WHERE assignment_id = ? OR assignment_id IN (SELECT id FROM assignments WHERE external_id = ?)`, [assignmentId, assignmentId]);
        
        if (existing.values && existing.values.length > 0) {
            const targetAssignmentId = existing.values[0].assignment_id;
            await db.run(`UPDATE responses SET data = ?, updated_at = ?, is_synced = 0 WHERE assignment_id = ?`, 
                [dataStr, now, targetAssignmentId]);
        } else {
            // Pin schema_version on first creation
            const assignRow = await db.query(`SELECT a.id, a.table_id, t.version FROM assignments a JOIN tables t ON t.id = a.table_id WHERE a.id = ? OR a.external_id = ?`, [assignmentId, assignmentId]);
            const realAssignmentId = assignRow.values?.[0]?.id || assignmentId;
            const schemaVer = assignRow.values?.[0]?.version || null;

            const localId = generateUUID();
            await db.run(`INSERT INTO responses (local_id, assignment_id, data, schema_version, is_synced, created_at, updated_at) VALUES (?, ?, ?, ?, 0, ?, ?)`, 
                [localId, realAssignmentId, dataStr, schemaVer, now, now]);
            log.info('Created response with schema_version:', { assignmentId: realAssignmentId, schemaVer });
        }
        
        if (!isDraft) {
             // Final submit: mark as submitted locally (server sync will transition it to synced/submitted)
             const res = await db.run(`UPDATE assignments SET status = 'submitted' WHERE id = ? OR external_id = ?`, [assignmentId, assignmentId]);
             log.info('Updated (Finish) status SUBMITTED:', { changes: res?.changes });
        } else {
             // Debug: Check current status to understand why update might fail
             const check = await db.query(`SELECT status FROM assignments WHERE id = ? OR external_id = ?`, [assignmentId, assignmentId]);
             const currentStatus = check.values?.[0]?.status;
             log.info('Draft Save - Current Assignment Status:', { id: assignmentId, status: currentStatus });

             // Relaxed condition: Update to in_progress if it's NOT submitted/synced and NOT already in_progress
             const res = await db.run(`UPDATE assignments SET status = 'in_progress' WHERE (id = ? OR external_id = ?) AND status NOT IN ('submitted', 'synced', 'in_progress')`, [assignmentId, assignmentId]);
             log.info('Updated (Draft) status IN_PROGRESS:', { changes: res?.changes, assignmentId });
        }
    },

    async getPendingUploadCount(db: SQLiteDBConnection, tableId?: string): Promise<number> {
        if (tableId) {
            const res = await db.query(`
                SELECT COUNT(*) as count 
                FROM responses r
                JOIN assignments a ON r.assignment_id = a.id
                WHERE r.is_synced = 0 AND a.table_id = ?
            `, [tableId]);
            return res.values?.[0]?.count || 0;
        }
        const res = await db.query(`SELECT COUNT(*) as count FROM responses WHERE is_synced = 0`);
        return res.values?.[0]?.count || 0;
    },

    async createLocalAssignment(db: SQLiteDBConnection, tableId: string): Promise<string> {
        const id = generateUUID();
        const now = new Date().toISOString();
        await db.run(
            `INSERT INTO assignments (id, external_id, table_id, status, created_at, updated_at) VALUES (?, ?, ?, 'assigned', ?, ?)`,
            [id, id, tableId, now, now]
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
