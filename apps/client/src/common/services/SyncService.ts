/* eslint-disable @typescript-eslint/no-explicit-any */

import { apiClient } from '../api/ApiClient';
import { databaseService } from '../database/DatabaseService';
import { logger } from '../utils/logger';
import { generateUUID } from '../utils/uuid';

export class SyncService {

    // Global Sync: Running on Dashboard
    async syncGlobal() {
        try {
            await this.push(); // Priority: Always secure data first
            await this.pullGlobal();
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
            await this.push(); // Push before ensuring consistency
            
            onProgress?.('Downloading table structure...', 20);
            await this.pullTable(tableId);
            
            onProgress?.('Downloading assignments...', 30);
            await this.pullAssignments(tableId, onProgress);
            
            onProgress?.('Downloading responses...', 90);
            await this.pullResponses(tableId); // Optimized to pull relevant responses
            
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
            
            // 3. Pull Assignments
            onProgress?.('Downloading assignments...', 30);
            await this.pullAssignments(tableId, onProgress);
            
            // 4. Pull Responses
            onProgress?.('Downloading responses...', 90);
            await this.pullResponses(tableId); 
            
            onProgress?.('Sync complete!', 100);
            await databaseService.save(); // Persist changes (Web)
            return { success: true };
        } catch (error) {
            logger.error(`App Sync Data Only failed for ${tableId}`, error);
            throw error;
        }
    }

    // NEW: Multi-Table Sync for App-level Views
    async syncApp(appId: string, onProgress?: (phase: string, progress?: number) => void) {
        try {
            onProgress?.('Fetching app configuration...', 0);
            
            // 1. Ensure we have the latest App Config (Views, Nav, etc)
            let app = await this.pullApp(appId);
            let isLegacyTable = false;

            if (!app) {
                // Fallback 1: Local App Metadata
                app = await this.getAppMetadata(appId);
            }
            
            if (!app) {
                // Fallback 2: Treat as Legacy Table ID
                // If App ID is not found in apps table (server or local), it might be a direct Table ID (Legacy URL)
                logger.info(`[SyncService] App ${appId} not found, treating as potential Table ID`);
                isLegacyTable = true;
                app = { id: appId }; // Pseudo-app object
            }

            // 2. Identify ALL tables used by this App
            const tableIds = new Set<string>();
            
            // A. Legacy/Default Table (App ID is often the Table ID in legacy apps)
            tableIds.add(String(appId));

            // B. Tables from View Configs (Only for real Apps)
            if (!isLegacyTable && app.view_configs) {
                const views = typeof app.view_configs === 'string' ? JSON.parse(app.view_configs) : app.view_configs;
                Object.values(views).forEach((v: any) => {
                    if (v.table_id) tableIds.add(String(v.table_id));
                });
            }

            const uniqueTables = Array.from(tableIds);
            const totalTables = uniqueTables.length;
            
            logger.info(`[SyncService] Syncing App ${appId} with tables: ${uniqueTables.join(', ')}`);

            // 3. Sync Each Table
            for (let i = 0; i < totalTables; i++) {
                const tableId = uniqueTables[i]!;
                const baseProgress = (i / totalTables) * 100;
                const progressPerTable = 100 / totalTables;

                await this.syncTable(tableId, (phase, stepProgress) => {
                     // Scale table progress to overall progress
                     const currentTableContribution = ((stepProgress || 0) / 100) * progressPerTable;
                     const total = Math.min(99, Math.round(baseProgress + currentTableContribution));
                     onProgress?.(`Syncing ${tableId}: ${phase}`, total);
                });
            }

            onProgress?.('App Sync Complete!', 100);
            return { success: true };

        } catch (error) {
            logger.error(`App Sync failed for ${appId}`, error);
            throw error;
        }
    }

    private async pullApp(appId: string) {
        try {
            const res = await apiClient.get(`/apps/${appId}`);
            if (res.success && res.data) {
                const db = await databaseService.getDB();
                await this.syncApps(db, [res.data]); // Re-use syncApps logic for single item
                return res.data;
            }
        } catch (e: any) {
            // Check if it's a 404 (Not Found) - expected for legacy table IDs
            if (e.status === 404 || e.message?.includes('404')) {
                logger.info(`[SyncService] App ${appId} not found (404), assuming Legacy Table ID.`);
            } else {
                logger.warn(`[SyncService] Failed to pull app ${appId}`, e);
            }
        }
        return null;
    }

    // 1. GLOBAL PULL: Dashboard Stats & App List
    private async pullGlobal() {
        const db = await databaseService.getDB();
        const res = await apiClient.get('/dashboard');
        
        if (res.success && res.data) {
            // A. Update Tables List
            // We use INSERT OR IGNORE to create row, then UPDATE specific metadata cols
            const tables = res.data.tables || [];
            
            for (const table of tables) {
                // Check if exists
                const existing = await db.query(`SELECT version FROM tables WHERE id = ?`, [table.id]);
                
                if (existing.values && existing.values.length > 0) {
                    // Update meta only
                    await db.run(
                        `UPDATE tables SET name = ?, description = ?, version = ?, version_policy = ?, synced_at = ? WHERE id = ?`, 
                        [table.name, table.description, table.version, table.version_policy || 'accept_all', new Date().toISOString(), table.id]
                    );
                } else {
                    // Insert new (fields is null initially)
                    await db.run(
                        `INSERT INTO tables (id, app_id, name, description, version, version_policy, synced_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [table.id, table.app_id || table.id, table.name, table.description, table.version, table.version_policy || 'accept_all', new Date().toISOString()]
                    );
                }
            }

            // A2. Update Apps List (NEW)
            await this.syncApps(db, res.data.apps || []);

            // B. ORPHAN CLEANUP: Delete local tables NOT in server response
            const serverTableIds = tables.map((t: { id: string }) => t.id);
            if (serverTableIds.length > 0) {
                const placeholders = serverTableIds.map(() => '?').join(',');
                await db.run(
                    `DELETE FROM tables WHERE id NOT IN (${placeholders})`,
                    serverTableIds
                );
                // WARNING: Do NOT clean up assignments here. 
                // pullGlobal returns "My Apps" tables, but we might have synced other tables (Ad-hoc/Legacy) locally.
                // Cleaning them up here wipes valid data.
                // await db.run(
                //    `DELETE FROM assignments WHERE table_id NOT IN (${placeholders})`,
                //    serverTableIds
                // );
                logger.info('[Sync] Orphan cleanup: removed tables not on server');
            } else {
                // Server returned empty tables list - clear all local data
                await db.run(`DELETE FROM tables`);
                await db.run(`DELETE FROM assignments`);
                logger.warn('[Sync] Server returned no tables, cleared all local data');
            }


            // C. Store Dashboard Stats (in LocalStorage for speed access by UI)
            localStorage.setItem('dashboard_stats', JSON.stringify(res.data.stats));
            localStorage.setItem('app_pending_counts', JSON.stringify(
                tables.reduce((acc: any, t: any) => ({ ...acc, [t.id]: t.pending_tasks || 0 }), {})
            ));
        }
    }

    private async syncApps(db: any, apps: any[]) {
        for (const app of apps) {
            // Check if exists
            const existing = await db.query(`SELECT version FROM apps WHERE id = ?`, [app.id]);
            
            if (existing.values && existing.values.length > 0) {
                await db.run(
                    `UPDATE apps SET slug = ?, name = ?, description = ?, navigation = ?, view_configs = ?, version = ?, synced_at = ? WHERE id = ?`,
                    [
                        app.slug, 
                        app.name, 
                        app.description, 
                        JSON.stringify(app.navigation || []), 
                        JSON.stringify(app.view_configs || {}), 
                        app.version || 1, 
                        new Date().toISOString(), 
                        app.id
                    ]
                );
            } else {
                await db.run(
                    `INSERT INTO apps (id, slug, name, description, navigation, view_configs, version, synced_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        app.id, 
                        app.slug, 
                        app.name, 
                        app.description, 
                        JSON.stringify(app.navigation || []), 
                        JSON.stringify(app.view_configs || {}), 
                        app.version || 1, 
                        new Date().toISOString()
                    ]
                );
            }
        }

        // Cleanup Orphan Apps
        const serverAppIds = apps.map((a: { id: string }) => a.id);
        if (serverAppIds.length > 0) {
            const placeholders = serverAppIds.map(() => '?').join(',');
            await db.run(
                `DELETE FROM apps WHERE id NOT IN (${placeholders})`,
                serverAppIds
            );
            logger.info('[Sync] Orphan cleanup: removed apps not on server');
        } else {
            await db.run(`DELETE FROM apps`);
            logger.warn('[Sync] Server returned no apps, cleared all local apps');
        }
    }

    private async pullTable(tableId: string) {
        const db = await databaseService.getDB();
        
        const res = await apiClient.get(`/tables/${tableId}`);
        if (res.success && res.data) {
            const table = res.data;
            this.logPullTableDebug(table);

            const version = this.determineVersion(table);
            
             if (version) {
                 // Use server-provided ID (UUID) to ensure we update the correct local record
                 // even if we requested via slug/AppID
                 await this.cacheAndSaveTable(db, table.id, version, table);
             }
        }
    }

    private logPullTableDebug(table: any) {
        logger.info(`[SyncService] 📥 Pulled Table ${table.id}`, {
            serverTableId: table.id,
            serverVersion: table.version,
            updatedAt: table.updated_at,
            versionsCount: table.versions?.length || 0,
            hasCurrentModel: !!table.current_version_model,
            currentModelVer: table.current_version_model?.version,
            latestPubVer: table.latest_published_version?.version,
            firstFallbackVer: table.versions?.[0]?.version
        });
    }

    private determineVersion(table: any) {
        // Use current_version_model from 'show' endpoint
        const version = table.current_version_model || table.latest_published_version || (table.versions?.[0]);

        let versionSource = 'versions[0] (fallback)';
        if (table.current_version_model) versionSource = 'current_version_model';
        else if (table.latest_published_version) versionSource = 'latest_published_version';

        logger.info(`[SyncService] 🧐 Version Selection logic for ${table.id}:`, {
            selectedVersion: version?.version,
            source: versionSource
        });
        return version;
    }

    private async cacheAndSaveTable(db: any, tableId: string, version: any, table: any) {
         // Check if 'schema' or 'fields' exists in version. Legacy support.
         const fieldsData = version.fields || version.schema;
         const layoutData = version.layout || {};
         
         logger.info(`[SyncService] Saving Table ${tableId}. Layout:`, {
             hasLayout: !!version.layout,
             layoutKeys: Object.keys(layoutData),
             grouping: (layoutData as any).grouping ? 'YES' : 'NO'
         });

        // Cache current schema version before overwriting (for version pinning)
        try {
            const currentRow = await db.query(
                'SELECT version, fields, layout FROM tables WHERE id = ?', [tableId]
            );
            const cur = currentRow.values?.[0];
            if (cur?.version && cur?.fields) {
                await db.run(
                    `INSERT OR IGNORE INTO table_versions (table_id, version, fields, layout, cached_at) VALUES (?, ?, ?, ?, ?)`,
                    [tableId, cur.version, cur.fields, cur.layout || '{}', new Date().toISOString()]
                );
                logger.info(`[SyncService] Cached schema v${cur.version} for table ${tableId}`);
            }
        } catch (cacheErr) {
            logger.warn('[SyncService] Failed to cache schema version', cacheErr);
        }

        // Also cache the NEW version being pulled
        try {
            await db.run(
                `INSERT OR IGNORE INTO table_versions (table_id, version, fields, layout, cached_at) VALUES (?, ?, ?, ?, ?)`,
                [tableId, version.version, JSON.stringify(fieldsData), JSON.stringify(layoutData), new Date().toISOString()]
            );
        } catch (cacheErr) {
            logger.warn('[SyncService] Failed to cache new schema version', cacheErr);
        }

        await db.run(
            `UPDATE tables SET fields = ?, layout = ?, settings = ?, version = ?, synced_at = ? WHERE id = ?`,
            [
                JSON.stringify(fieldsData), 
                JSON.stringify(layoutData),
                JSON.stringify(table.settings || {}),
                version.version,
                new Date().toISOString(),
                tableId
            ]
        );
    }

    // --- Assignment Sync Helpers ---

    /** Build batch statements for UPSERT into local SQLite */
    private buildAssignmentBatch(items: any[], stmtAssign: string, syncTimestamp: string) {
        return items.map((assign: any) => ({
            statement: stmtAssign,
            values: [
                assign.id,
                assign.table_id || assign.form_id || assign.app_schema_id,
                assign.organization_id,
                assign.supervisor_id,
                assign.enumerator_id,
                JSON.stringify(assign.prelist_data),
                assign.status,
                syncTimestamp,
                assign.external_id || null
            ]
        }));
    }

    /** Delete locally any assignments that were soft-deleted on server */
    private async handleTombstones(db: any, deletedIds: string[]) {
        if (!deletedIds || deletedIds.length === 0) return;
        logger.info(`[Sync] Deleting ${deletedIds.length} tombstoned assignments locally`);
        for (const id of deletedIds) {
            await db.run(`DELETE FROM assignments WHERE id = ?`, [id]);
            await db.run(`DELETE FROM responses WHERE assignment_id = ?`, [id]);
        }
    }

    /** Remove local assignments not present on server (initial sync only) */
    private async cleanupOrphanAssignments(db: any, tableId: string, fetchedIds: string[]) {
        if (fetchedIds.length === 0) {
            await db.run(`DELETE FROM assignments WHERE table_id = ?`, [tableId]);
            logger.warn(`[Sync] No assignments from server for table ${tableId}, cleared local`);
            return;
        }

        // FIX: The previous chunked NOT IN approach was destructive!
        // Each chunk's DELETE would remove records from other chunks.
        // Instead, query existing local IDs and compute the diff using a Set.
        const localResult = await db.query(
            'SELECT id FROM assignments WHERE table_id = ?', [tableId]
        );
        const localIds: string[] = (localResult.values || []).map((r: { id: string }) => r.id);

        console.log(`[SyncService] Cleanup Orphans. Local: ${localIds.length}, Fetched: ${fetchedIds.length}`);

        const fetchedSet = new Set(fetchedIds);
        const orphanIds = localIds.filter((id: string) => !fetchedSet.has(id));

        if (orphanIds.length > 0) {
            console.log(`[Sync] Removing ${orphanIds.length} orphan assignments for table ${tableId}`);
            for (const id of orphanIds) {
                await db.run('DELETE FROM assignments WHERE id = ?', [id]);
            }
        } else {
            console.log(`[Sync] No orphan assignments found for table ${tableId}`);
        }
    }

    // 3. ASSIGNMENTS PULL (Delta-Sync Aware)
    //
    // Clock Safety: We NEVER use `new Date()` for sync timestamps.
    // Instead, we use `server_time` from the API response. This protects against
    // devices with incorrect date/time settings (e.g., auto-update disabled).
    //

    /** Process a single page: insert batch + handle tombstones. Returns count of items inserted. */
    private async processAssignmentPage(
        db: any, res: any, stmtAssign: string, syncTimestamp: string, trackIds: boolean, fetchedIds: string[]
    ): Promise<number> {
        const items = res.data?.data || [];
        const batchSet = this.buildAssignmentBatch(items, stmtAssign, syncTimestamp);

        if (trackIds) {
            for (const a of items) fetchedIds.push(a.id);
        }

        let inserted = 0;
        if (batchSet.length > 0) {
            try { 

                await db.executeSet(batchSet); 

                inserted = batchSet.length; 
                
            }
            catch (e) { 
                console.error('[Sync] Assignment batch insert failed', e); 
            }
        }

        await this.handleTombstones(db, res.deleted_ids);
        return inserted;
    }

    /** Fetch all assignment pages via cursor pagination */
    private async fetchAssignmentPages(
        db: any, baseUrl: string, stmtAssign: string, trackIds: boolean,
        onProgress?: (phase: string, progress?: number) => void
    ) {
        let cursor: string | null = null;
        let totalItems = 0;
        let serverTime = '';
        const fetchedIds: string[] = [];
        let pageNum = 0;

        do {
            pageNum++;
            const cursorParam = cursor ? `&cursor=${encodeURIComponent(cursor)}` : '';
            const res = await apiClient.get(`${baseUrl}${cursorParam}`);

            if (!res.success) { logger.warn('[Sync] API failure, stopping'); break; }
            if (!serverTime && res.server_time) serverTime = res.server_time;

            const hasNext = !!res.data?.next_cursor;
            const progress = hasNext ? 30 + Math.min(pageNum * 10, 55) : 85;
            onProgress?.(hasNext ? `Downloading assignments (page ${pageNum})...` : 'Downloading assignments (final page)...', progress);

            const syncTimestamp = serverTime || new Date().toISOString();
            totalItems += await this.processAssignmentPage(db, res, stmtAssign, syncTimestamp, trackIds, fetchedIds);

            cursor = res.data?.next_cursor || null;
            await new Promise(resolve => setTimeout(resolve, 10));
        } while (cursor);

        return { totalItems, serverTime, fetchedIds };
    }

    private async pullAssignments(tableId: string, onProgress?: (phase: string, progress?: number) => void) {
        const db = await databaseService.getDB();
        const syncKey = `sync_assignments_${tableId}`;
        const lastSync = localStorage.getItem(syncKey);
        const isInitialSync = !lastSync;

        logger.info('[Sync] pullAssignments START:', {
            tableId, mode: isInitialSync ? 'INITIAL' : 'DELTA', lastSync: lastSync || 'never'
        });

        const stmtAssign = `INSERT OR REPLACE INTO assignments (id, table_id, organization_id, supervisor_id, enumerator_id, prelist_data, status, synced_at, external_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const baseParams = `table_id=${tableId}&per_page=2000&use_cursor=true`;
        const deltaParams = lastSync
            ? `&updated_since=${encodeURIComponent(lastSync)}&include_deleted=1`
            : '';
        const baseUrl = `/assignments?${baseParams}${deltaParams}`;

        const { totalItems, serverTime, fetchedIds } = await this.fetchAssignmentPages(
            db, baseUrl, stmtAssign, isInitialSync, onProgress
        );

        if (isInitialSync) {
            await this.cleanupOrphanAssignments(db, tableId, fetchedIds);
        }

        // Save server_time as checkpoint (server-authoritative, clock-safe)
        if (serverTime) {
            localStorage.setItem(syncKey, serverTime);
            logger.info(`[Sync] Checkpoint saved: ${syncKey} = ${serverTime}`);
        }

        logger.info('[Sync] pullAssignments END:', { tableId, totalItems, mode: isInitialSync ? 'INITIAL' : 'DELTA' });
    }

    // 4. RESPONSES PULL
    private async pullResponses(tableId?: string) {
        try {
            const db = await databaseService.getDB();
            
            // Allow filtering by specific table ID if provided
            const url = tableId ? `/responses?table_id=${tableId}` : '/responses';
            logger.info(`[Sync] Pulling responses from: ${url}`);

            const responsesRes = await apiClient.get(url); 
            
            if (responsesRes.success && Array.isArray(responsesRes.data)) {
                logger.info(`[Sync] Found ${responsesRes.data.length} responses from server.`);
                
                const stmtResponse = `INSERT OR REPLACE INTO responses (local_id, server_id, assignment_id, data, synced_at, created_at, updated_at, is_synced) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
                
                const batchResponses = responsesRes.data.map((res: any) => ({
                    statement: stmtResponse,
                    values: [
                        res.local_id || generateUUID(),
                        res.id, // server_id
                        res.assignment_id,
                        typeof res.data === 'string' ? res.data : JSON.stringify(res.data),
                        new Date().toISOString(),
                        res.created_at,
                        res.updated_at,
                        1 // is_synced = true
                    ]
                }));

                if (batchResponses.length > 0) {
                    try {
                        const fixedBatch = batchResponses.map((b: any) => ({
                           statement: b.statement,
                           values: [
                               b.values[0],
                               b.values[1],
                               String(b.values[2]), 
                               b.values[3],
                               b.values[4],
                               b.values[5],
                               b.values[6],
                               b.values[7]
                           ]
                        }));
                        await db.executeSet(fixedBatch);
                        logger.info(`[Sync] Imported ${fixedBatch.length} responses.`);
                    } catch (e) {
                         logger.error('[Sync] Failed to execute response batch', e);
                    }
                }
            } 
        } catch (e) {
            logger.warn('Failed to pull responses', e);
        }
        return null;
    }

    // 6. GET LOCAL APP METADATA
    async getAppMetadata(appId: string) {
        const db = await databaseService.getDB();
        const res = await db.query(`SELECT * FROM apps WHERE id = ? OR slug = ?`, [appId, appId]);
        if (res.values && res.values.length > 0) {
            const row = res.values[0];
            return {
                ...row,
                navigation: row.navigation ? JSON.parse(row.navigation) : [],
                views: row.views ? JSON.parse(row.views) : []
            };
        }
        return null;
    }

    async push() {
        const db = await databaseService.getDB();
        
        // Get unsynced responses joined with assignments to get table_id
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
        // Build payload with submitted_version from local table
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
                await db.run(`UPDATE responses SET is_synced = 1, server_id = ? WHERE local_id = ?`, [item.server_id, item.local_id]);

                // Handle Ad-hoc Assignment Mapping (Swap UUID for Server ID)
                if (item.new_assignment_id) {
                     const respRow = await db.query(`SELECT assignment_id FROM responses WHERE local_id = ?`, [item.local_id]);
                     const oldAssignId = respRow.values?.[0]?.assignment_id;

                     await db.run(`UPDATE responses SET assignment_id = ? WHERE local_id = ?`, [item.new_assignment_id, item.local_id]);
                     
                     if (oldAssignId && oldAssignId.length > 20) {
                          await db.run(`UPDATE assignments SET id = ? WHERE id = ?`, [item.new_assignment_id, oldAssignId]);
                     }
                }
            } else if (item.status === 'version_rejected') {
                // Keep item unsynced — user needs to update form version first
                logger.warn('[SyncService] Version rejected:', item.message);
                // Dispatch event so UI can show version gate
                window.dispatchEvent(new CustomEvent('version-rejected', {
                    detail: { localId: item.local_id, requiredVersion: item.required_version, message: item.message }
                }));
            }
        }
    }
}

export const syncService = new SyncService();
