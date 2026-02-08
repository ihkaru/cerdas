
import { SQLiteDBConnection } from '@capacitor-community/sqlite';
import { useLogger } from '../../../common/utils/logger';
import { generateUUID } from '../../../common/utils/uuid';
import type { Assignment, Table } from '../types';

const log = useLogger('DashboardRepository');

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
        
        let parsedFields = row.fields;
        if (typeof parsedFields === 'string') {
            try {
                parsedFields = JSON.parse(parsedFields);
            } catch (e) {
                log.error('Failed to parse fields JSON', e);
                parsedFields = { fields: [] };
            }
        }
        
        if (parsedFields && typeof parsedFields === 'object') {
            if (Array.isArray(parsedFields)) {
                // Correct structure (Direct Array of Fields)
            } else if ('fields' in parsedFields && Array.isArray(parsedFields.fields)) {
                // Correct structure (Object with fields array)
            } else if ('schema' in parsedFields) {
                // Nested schema object, extract
                let inner = (parsedFields as any).schema;
                if (typeof inner === 'string') {
                    try { inner = JSON.parse(inner); } catch(e) {}
                }
                parsedFields = inner;
            }
        }
        
        if (!parsedFields || typeof parsedFields !== 'object' || (!Array.isArray(parsedFields) && !('fields' in parsedFields))) {
            parsedFields = { fields: [] };
        }
        
        return {
            ...row,
            layout: typeof row.layout === 'string' ? JSON.parse(row.layout) : row.layout,
            settings: typeof row.settings === 'string' ? JSON.parse(row.settings) : row.settings,
            fields: parsedFields
        };
    },

    async getResponse(db: SQLiteDBConnection, assignmentId: string): Promise<any | null> {
        const res = await db.query(`SELECT * FROM responses WHERE assignment_id = ?`, [assignmentId]);
        if (!res.values || res.values.length === 0) return null;
        const row = res.values[0];
        return typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
    },

    async saveResponse(db: SQLiteDBConnection, assignmentId: string, data: any, isDraft: boolean) {
        log.info('saveResponse call:', { assignmentId, isDraft });
        const now = new Date().toISOString();
        const dataStr = JSON.stringify(data);
        
        const existing = await db.query(`SELECT local_id FROM responses WHERE assignment_id = ?`, [assignmentId]);
        
        if (existing.values && existing.values.length > 0) {
            await db.run(`UPDATE responses SET data = ?, updated_at = ?, is_synced = 0 WHERE assignment_id = ?`, 
                [dataStr, now, assignmentId]);
        } else {
            const localId = generateUUID();
            await db.run(`INSERT INTO responses (local_id, assignment_id, data, is_synced, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?)`, 
                [localId, assignmentId, dataStr, now, now]);
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
    }
};
