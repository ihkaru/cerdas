import { SQLiteDBConnection } from '@capacitor-community/sqlite';
import { useLogger } from '../../../common/utils/logger';
import { generateUUID } from '../../../common/utils/uuid';
import type { Assignment, Form } from '../types';

const log = useLogger('DashboardRepository');

export const DashboardRepository = {
    async getForms(db: SQLiteDBConnection): Promise<Form[]> {
        const res = await db.query(`SELECT * FROM forms`);
        return (res.values || []).map(row => ({
            ...row,
            layout: typeof row.layout === 'string' ? JSON.parse(row.layout) : row.layout,
            settings: typeof row.settings === 'string' ? JSON.parse(row.settings) : row.settings
        }));
    },

    async getAssignments(db: SQLiteDBConnection, limit: number = 50, offset: number = 0): Promise<Assignment[]> {
        log.debug(`getAssignments fetching limit=${limit} offset=${offset}...`);
        
        // LEFT JOIN to get response data
        const res = await db.query(
            `SELECT a.*, r.data as response_data 
             FROM assignments a 
             LEFT JOIN responses r ON a.id = r.assignment_id 
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
        const res = await db.query(
            `SELECT a.*, r.data as response_data 
             FROM assignments a 
             LEFT JOIN responses r ON a.id = r.assignment_id 
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

    async getForm(db: SQLiteDBConnection, id: string): Promise<Form | null> {
        const res = await db.query(`SELECT * FROM forms WHERE id = ?`, [id]);
        if (!res.values || res.values.length === 0) return null;
        const row = res.values[0];
        
        let parsedSchema = row.schema;
        if (typeof parsedSchema === 'string') {
            try {
                parsedSchema = JSON.parse(parsedSchema);
            } catch (e) {
                log.error('Failed to parse schema JSON', e);
                parsedSchema = { fields: [] };
            }
        }
        
        if (parsedSchema && typeof parsedSchema === 'object') {
            if ('schema' in parsedSchema) {
                let innerSchema = parsedSchema.schema;
                if (typeof innerSchema === 'string') {
                    try {
                        innerSchema = JSON.parse(innerSchema);
                    } catch (e) {
                        innerSchema = { fields: [] };
                    }
                }
                parsedSchema = innerSchema;
            }
        }
        
        if (!parsedSchema || typeof parsedSchema !== 'object' || !('fields' in parsedSchema)) {
            parsedSchema = { fields: [] };
        }
        
        return {
            ...row,
            layout: typeof row.layout === 'string' ? JSON.parse(row.layout) : row.layout,
            settings: typeof row.settings === 'string' ? JSON.parse(row.settings) : row.settings,
            schema: parsedSchema
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

    async createLocalAssignment(db: SQLiteDBConnection, formId: string): Promise<string> {
        const id = generateUUID();
        const now = new Date().toISOString();
        await db.run(
            `INSERT INTO assignments (id, form_id, status, created_at, updated_at) VALUES (?, ?, 'assigned', ?, ?)`,
            [id, formId, now, now]
        );
        return id;
    }
};
