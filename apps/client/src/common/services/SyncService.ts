
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
            
            onProgress?.('Downloading assignments...', 30);
            await this.pullAssignments(tableId, onProgress);
            
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
                        `UPDATE tables SET name = ?, description = ?, version = ?, synced_at = ? WHERE id = ?`, 
                        [table.name, table.description, table.version, new Date().toISOString(), table.id]
                    );
                } else {
                    // Insert new (fields is null initially)
                    await db.run(
                        `INSERT INTO tables (id, app_id, name, description, version, synced_at) VALUES (?, ?, ?, ?, ?, ?)`,
                        [table.id, table.app_id || table.id, table.name, table.description, table.version, new Date().toISOString()]
                    );
                }
            }

            // B. ORPHAN CLEANUP: Delete local tables NOT in server response
            const serverTableIds = tables.map((t: any) => t.id);
            if (serverTableIds.length > 0) {
                const placeholders = serverTableIds.map(() => '?').join(',');
                await db.run(
                    `DELETE FROM tables WHERE id NOT IN (${placeholders})`,
                    serverTableIds
                );
                // Also clean up orphaned assignments for deleted tables
                await db.run(
                    `DELETE FROM assignments WHERE table_id NOT IN (${placeholders})`,
                    serverTableIds
                );
                logger.info('[Sync] Orphan cleanup: removed tables/assignments not on server');
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

    // 2. TABLE PULL (Full JSON)
    private async pullTable(tableId: string) {
        const db = await databaseService.getDB();
        
        const res = await apiClient.get(`/tables/${tableId}`);
        if (res.success && res.data) {
            const table = res.data;
            
            // --- DEBUG LOGGING START ---
            logger.info(`[SyncService] 📥 Pulled Table ${tableId}`, {
                serverTableId: table.id,
                serverVersion: table.version,
                updatedAt: table.updated_at,
                versionsCount: table.versions?.length || 0,
                hasCurrentModel: !!table.current_version_model,
                currentModelVer: table.current_version_model?.version,
                latestPubVer: table.latest_published_version?.version,
                firstFallbackVer: table.versions?.[0]?.version
            });
            // --- DEBUG LOGGING END ---

            // Use current_version_model from 'show' endpoint
            const version = table.current_version_model || table.latest_published_version || (table.versions?.[0]);

            logger.info(`[SyncService] 🧐 Version Selection logic for ${tableId}:`, {
                selectedVersion: version?.version,
                source: table.current_version_model ? 'current_version_model' : 
                        (table.latest_published_version ? 'latest_published_version' : 'versions[0] (fallback)')
            });
            
            if (version) {
                 // Check if 'schema' or 'fields' exists in version. Legacy support.
                 const fieldsData = version.fields || version.schema;
                 const layoutData = version.layout || {};
                 
                 logger.info(`[SyncService] Saving Table ${tableId}. Version Check:`, {
                     tableVersion: table.version,
                     currentModelVer: table.current_version_model?.version,
                     latestPubVer: table.latest_published_version?.version,
                     chosenVer: version.version
                 });

                 logger.info(`[SyncService] Saving Table ${tableId}. Layout:`, {
                     hasLayout: !!version.layout,
                     layoutKeys: Object.keys(layoutData),
                     grouping: (layoutData as any).grouping ? 'YES' : 'NO'
                 });

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
        }
    }

    // 3. ASSIGNMENTS PULL
    private async pullAssignments(tableId: string, onProgress?: (phase: string, progress?: number) => void) {
        const db = await databaseService.getDB();
        let page = 1;
        let lastPage = 1;
        let totalItems = 0;
        const fetchedAssignmentIds: string[] = []; // Track all IDs fetched

        console.log('[SyncService] pullAssignments START:', { tableId });

        const stmtAssign = `INSERT OR REPLACE INTO assignments (id, table_id, organization_id, supervisor_id, enumerator_id, prelist_data, status, synced_at, external_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        do {
            const url = `/assignments?table_id=${tableId}&page=${page}&per_page=1000`;
            console.log('[SyncService] Fetching:', url);
            
            const res = await apiClient.get(url); 
            
            console.log('[SyncService] API Response:', { 
                success: res.success, 
                lastPage: res.data?.last_page,
                dataCount: res.data?.data?.length || 0,
                firstItem: res.data?.data?.[0] || null
            });
            
            if (res.success) {
                const paginated = res.data;
                lastPage = paginated.last_page;
                
                // Calculate rough progress
                const downloadProgress = Math.round((page / lastPage) * 100);
                const overallProgress = 30 + Math.round(downloadProgress * 0.6);
                
                onProgress?.(`Downloading assignments (Page ${page}/${lastPage})...`, overallProgress);

                const batchSet = paginated.data.map((assign: any) => ({
                    statement: stmtAssign,
                    values: [
                        assign.id,
                        assign.table_id || assign.form_id || assign.app_schema_id, 
                        assign.organization_id,
                        assign.supervisor_id,
                        assign.enumerator_id,
                        JSON.stringify(assign.prelist_data),
                        assign.status,
                        new Date().toISOString(),
                        assign.external_id || null
                    ]
                }));

                // Track fetched IDs for orphan cleanup
                for (const assign of paginated.data) {
                    fetchedAssignmentIds.push(assign.id);
                }

                console.log('[SyncService] Batch to insert:', { 
                    count: batchSet.length, 
                    sampleValues: batchSet[0]?.values || null 
                });

                if (batchSet.length > 0) {
                    try {
                        await db.executeSet(batchSet);
                        totalItems += batchSet.length;
                        console.log(`[SyncService] Imported batch of ${batchSet.length} assignments. Total: ${totalItems}`);
                    } catch (e) {
                         console.error('[SyncService] Failed to insert assignments batch', e);
                    }
                }
                
                page++;
                await new Promise(resolve => setTimeout(resolve, 10)); // Yield to UI
            } else {
                console.warn('[SyncService] API returned failure, breaking loop');
                break;
            }
        } while (page <= lastPage);
        
        // ORPHAN CLEANUP: Delete local assignments for this table NOT in server response
        if (fetchedAssignmentIds.length > 0) {
            const placeholders = fetchedAssignmentIds.map(() => '?').join(',');
            await db.run(
                `DELETE FROM assignments WHERE table_id = ? AND id NOT IN (${placeholders})`,
                [tableId, ...fetchedAssignmentIds]
            );
            logger.info(`[Sync] Assignment orphan cleanup for table ${tableId}`);
        } else {
            // Server returned no assignments for this table - clear all local for this table
            await db.run(`DELETE FROM assignments WHERE table_id = ?`, [tableId]);
            logger.warn(`[Sync] No assignments from server for table ${tableId}, cleared local`);
        }
        
        console.log('[SyncService] pullAssignments END:', { tableId, totalItems });
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
            const payload = chunk.map(r => ({
                local_id: r.local_id,
                assignment_id: r.assignment_id,
                table_id: r.table_id,
                data: JSON.parse(r.data),
                created_at: r.created_at,
                updated_at: r.updated_at,
                device_id: 'device-1' 
            }));

            try {
                logger.info('[SyncService] Pushing Payload:', payload);
                const response = await apiClient.post('/responses/sync', { responses: payload });
                logger.info('[SyncService] Push Result:', response);

                if (response.success) {
                    for (const item of response.data) {
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
                        }
                    }
                }
            } catch (e) {
                logger.error('Push batch failed', e);
                throw e; 
            }
        }
    }
}

export const syncService = new SyncService();
