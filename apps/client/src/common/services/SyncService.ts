/* eslint-disable @typescript-eslint/no-explicit-any */

import { databaseService } from '../database/DatabaseService';
import { logger } from '../utils/logger';
import { apiClient } from '../api/ApiClient';
import { pullGlobal, pullTable, pullApp } from './sync/TableSyncHelpers';
import { pullAssignments, pullResponses } from './sync/AssignmentSyncHelpers';

export class SyncService {

    // Global Sync: Running on Dashboard
    async syncGlobal() {
        try {
            await this.push(); // Priority: Always secure data first
            await pullGlobal();
            await databaseService.save(); // Persist changes (Web)
            return { success: true };
        } catch (error) {
            logger.error('Global Sync failed', error);
            throw error;
        }
    }

    // App Sync: Running when opening an App (Table)
    async syncTable(tableId: string, onProgress?: (phase: string, progress?: number) => void) {
        try {
            onProgress?.('Uploading pending data...', 10);
            await this.push();

            onProgress?.('Downloading table structure...', 20);
            await pullTable(tableId);

            onProgress?.('Downloading assignments...', 30);
            await pullAssignments(tableId, onProgress);

            onProgress?.('Downloading responses...', 90);
            await pullResponses(tableId);

            onProgress?.('Sync complete!', 100);
            await databaseService.save(); // Persist changes (Web)
            return { success: true };
        } catch (error) {
            logger.error(`App Sync failed for ${tableId}`, error);
            throw error;
        }
    }

    // App Sync: Data Only (For Preview Mode where schema is local draft)
    async syncTableDataOnly(tableId: string, onProgress?: (phase: string, progress?: number) => void) {
        try {
            onProgress?.('Uploading pending data...', 10);
            await this.push();

            // SKIP pullTable() to keep the local draft schema

            onProgress?.('Downloading assignments...', 30);
            await pullAssignments(tableId, onProgress);

            onProgress?.('Downloading responses...', 90);
            await pullResponses(tableId);

            onProgress?.('Sync complete!', 100);
            await databaseService.save(); // Persist changes (Web)
            return { success: true };
        } catch (error) {
            logger.error(`App Sync Data Only failed for ${tableId}`, error);
            throw error;
        }
    }

    // Multi-Table Sync for App-level Views
    async syncApp(appId: string, onProgress?: (phase: string, progress?: number) => void) {
        try {
            onProgress?.('Fetching app configuration...', 0);

            // 1. Ensure we have the latest App Config (Views, Nav, etc)
            let app = await pullApp(appId);
            let isLegacyTable = false;

            if (!app) {
                // Fallback 1: Local App Metadata
                app = await this.getAppMetadata(appId);
            }

            if (!app) {
                // Fallback 2: Treat as Legacy Table ID
                logger.info(`[SyncService] App ${appId} not found, treating as potential Table ID`);
                isLegacyTable = true;
                app = { id: appId };
            }

            // 2. Identify ALL tables used by this App
            const uniqueTables = this.getAppTableIds(app, isLegacyTable);
            const totalTables = uniqueTables.length;
            logger.info(`[SyncService] Syncing App ${appId} with tables: ${uniqueTables.join(', ')}`);

            // 3. Sync Each Table
            for (let i = 0; i < totalTables; i++) {
                const tableId = uniqueTables[i] ?? '';
                const baseProgress = (i / totalTables) * 100;
                const progressPerTable = 100 / totalTables;

                try {
                    await this.syncTable(tableId, (phase, stepProgress) => {
                        const currentTableContribution = ((stepProgress || 0) / 100) * progressPerTable;
                        const total = Math.min(99, Math.round(baseProgress + currentTableContribution));
                        onProgress?.(`Syncing ${tableId}: ${phase}`, total);
                    });
                } catch (tableError: any) {
                    // Skip 404 orphaned tables; abort for other critical errors
                    if (tableError.message?.includes('404') || tableError.message?.includes('deleted')) {
                        logger.warn(`[SyncService] Skipping orphaned table ${tableId} during App Sync.`);
                        continue;
                    }
                    throw tableError;
                }
            }

            onProgress?.('App Sync Complete!', 100);
            return { success: true };

        } catch (error) {
            logger.error(`App Sync failed for ${appId}`, error);
            throw error;
        }
    }

    private getAppTableIds(app: any, isLegacyTable: boolean): string[] {
        const tableIds = new Set<string>();

        if (isLegacyTable && app.id) {
            tableIds.add(String(app.id));
        }

        if (!isLegacyTable && app.view_configs) {
            const views = typeof app.view_configs === 'string' ? JSON.parse(app.view_configs) : app.view_configs;
            Object.values(views).forEach((v: any) => {
                if (v.table_id) tableIds.add(String(v.table_id));
            });
        }

        if (!isLegacyTable && app.tables && Array.isArray(app.tables)) {
            app.tables.forEach((t: any) => {
                if (t.id) tableIds.add(String(t.id));
            });
        }

        return Array.from(tableIds);
    }

    // --- Local Queries ---

    async getAppMetadata(appId: string) {
        const db = await databaseService.getDB();
        const res = await db.query(`SELECT * FROM apps WHERE id = ? OR slug = ?`, [appId, appId]);
        if (res.values && res.values.length > 0) {
            const row = res.values[0];
            const tablesRes = await db.query(`SELECT * FROM tables WHERE app_id = ?`, [row.id]);
            return {
                ...row,
                navigation: row.navigation ? JSON.parse(row.navigation) : [],
                view_configs: row.view_configs ? JSON.parse(row.view_configs) : {},
                tables: tablesRes.values || []
            };
        }
        return null;
    }

    async getUnsyncedCount(): Promise<number> {
        try {
            const db = await databaseService.getDB();
            const res = await db.query(`SELECT count(*) as count FROM responses WHERE is_synced = 0`);
            return res.values?.[0]?.count || 0;
        } catch (e) {
            logger.warn('Failed to get unsynced count', e);
            return 0;
        }
    }

    // --- Push (Upload unsynced responses) ---

    async push() {
        const db = await databaseService.getDB();

        const res = await db.query(`
            SELECT r.*, a.table_id
            FROM responses r
            LEFT JOIN assignments a ON r.assignment_id = a.id
            WHERE r.is_synced = 0
        `);
        const unsynced = res.values || [];
        if (unsynced.length === 0) return;

        const BATCH_SIZE = 1;
        for (let i = 0; i < unsynced.length; i += BATCH_SIZE) {
            const chunk = unsynced.slice(i, i + BATCH_SIZE);
            await this.processPushBatch(db, chunk);
        }
    }

    private async processPushBatch(db: any, chunk: any[]) {
        const payloadPromises = chunk.map(async (r: any) => {
            let submittedVersion: number | undefined;
            if (r.table_id) {
                const tbl = await db.query(`SELECT version FROM tables WHERE id = ?`, [r.table_id]);
                submittedVersion = tbl.values?.[0]?.version;
            }
            return {
                local_id: r.local_id,
                assignment_id: r.assignment_id,
                table_id: r.table_id,
                data: JSON.parse(r.data),
                created_at: r.created_at,
                updated_at: r.updated_at,
                device_id: 'device-1',
                submitted_version: submittedVersion,
            };
        });
        const payload = await Promise.all(payloadPromises);

        try {
            logger.info('[SyncService] Pushing Payload:', payload);
            const response = await apiClient.post('/responses/sync', { responses: payload });
            logger.info('[SyncService] Push Result:', response);
            if (response.success) {
                await this.handlePushResponse(db, response.data);
            }
        } catch (e) {
            logger.error('Push batch failed', e);
            throw e;
        }
    }

    private async handlePushResponse(db: any, items: any[]) {
        for (const item of items) {
            if (item.status === 'success') {
                await db.run(
                    `UPDATE responses SET is_synced = 1, server_id = ? WHERE local_id = ?`,
                    [item.server_id, item.local_id]
                );
                if (item.new_assignment_id) {
                    const respRow = await db.query(
                        `SELECT assignment_id FROM responses WHERE local_id = ?`,
                        [item.local_id]
                    );
                    const oldAssignId = respRow.values?.[0]?.assignment_id;
                    await db.run(
                        `UPDATE responses SET assignment_id = ? WHERE local_id = ?`,
                        [item.new_assignment_id, item.local_id]
                    );
                    if (oldAssignId && oldAssignId.length > 20) {
                        await db.run(
                            `UPDATE assignments SET id = ? WHERE id = ?`,
                            [item.new_assignment_id, oldAssignId]
                        );
                    }
                }
            } else if (item.status === 'version_rejected') {
                logger.warn('[SyncService] Version rejected:', item.message);
                window.dispatchEvent(new CustomEvent('version-rejected', {
                    detail: { localId: item.local_id, requiredVersion: item.required_version, message: item.message }
                }));
            }
        }
    }
}

export const syncService = new SyncService();
