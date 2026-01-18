
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

    // App Sync: Running when opening an App (Form)
    async syncApp(formId: string, onProgress?: (phase: string, progress?: number) => void) {
        try {
            onProgress?.('Uploading pending data...', 10);
            await this.push(); // Push before ensuring consistency
            
            onProgress?.('Downloading form structure...', 20);
            await this.pullForm(formId);
            
            onProgress?.('Downloading assignments...', 30);
            await this.pullAssignments(formId, onProgress);
            
            onProgress?.('Downloading responses...', 90);
            await this.pullResponses(formId); // Optimized to pull relevant responses
            
            onProgress?.('Sync complete!', 100);
            await databaseService.save(); // Persist changes (Web)
            return { success: true };
        } catch (error) {
            logger.error(`App Sync failed for ${formId}`, error);
            throw error;
        }
    }

    // App Sync: Data Only (For Preview Mode where schema is local draft)
    async syncAppDataOnly(formId: string, onProgress?: (phase: string, progress?: number) => void) {
        try {
            onProgress?.('Uploading pending data...', 10);
            await this.push(); 
            
            // SKIP pullForm() to keep the local draft schema
            
            onProgress?.('Downloading assignments...', 30);
            await this.pullAssignments(formId, onProgress);
            
            onProgress?.('Downloading responses...', 90);
            await this.pullResponses(formId); 
            
            onProgress?.('Sync complete!', 100);
            await databaseService.save(); // Persist changes (Web)
            return { success: true };
        } catch (error) {
            logger.error(`App Sync Data Only failed for ${formId}`, error);
            throw error;
        }
    }

    // 1. GLOBAL PULL: Dashboard Stats & App List
    private async pullGlobal() {
        // ... (unchanged)
        const db = await databaseService.getDB();
        const res = await apiClient.get('/dashboard');
        
        if (res.success && res.data) {
            // A. Update Forms List (Lightweight upsert)
            // We use INSERT OR IGNORE to create row, then UPDATE specific metadata cols
            const forms = res.data.forms || [];
            
            for (const form of forms) {
                // Check if exists
                const existing = await db.query(`SELECT version FROM forms WHERE id = ?`, [form.id]);
                
                if (existing.values && existing.values.length > 0) {
                    // Update meta only
                    await db.run(
                        `UPDATE forms SET name = ?, description = ?, version = ?, synced_at = ? WHERE id = ?`, 
                        [form.name, form.description, form.version, new Date().toISOString(), form.id]
                    );
                } else {
                    // Insert new (schema is null initially)
                    await db.run(
                        `INSERT INTO forms (id, app_id, name, description, version, synced_at) VALUES (?, ?, ?, ?, ?, ?)`,
                        [form.id, form.app_id || '1', form.name, form.description, form.version, new Date().toISOString()]
                    );
                }
            }

            // B. Store Dashboard Stats (in LocalStorage for speed access by UI)
            localStorage.setItem('dashboard_stats', JSON.stringify(res.data.stats));
            localStorage.setItem('app_pending_counts', JSON.stringify(
                forms.reduce((acc: any, f: any) => ({ ...acc, [f.id]: f.pending_tasks || 0 }), {})
            ));
        }
    }

    // 2. FORM PULL (Full JSON)
    private async pullForm(formId: string) {
        // ... (body unchanged, specific lines omitted for brevity in tool)
        const db = await databaseService.getDB();
        
        // Only pull if version mismatch or schema missing
        // For now, let's pull always to ensure freshness, or check version logic later
        const res = await apiClient.get(`/forms/${formId}`);
        if (res.success && res.data) {
            const form = res.data;
            // Use current_version_model from 'show' endpoint, or latest_published_version from 'index', or fallback
            // Note: FormController.show loads 'currentVersionModel'
            const version = form.current_version_model || form.latest_published_version || (form.versions?.[0]);
            
            if (version) {
                await db.run(
                    `UPDATE forms SET schema = ?, layout = ?, settings = ?, version = ?, synced_at = ? WHERE id = ?`,
                    [
                        JSON.stringify(version.schema), // Schema is usually inside version for forms
                        JSON.stringify(version.layout || {}),
                        JSON.stringify(form.settings || {}),
                        version.version,
                        new Date().toISOString(),
                        formId
                    ]
                );
            }
        }
    }

    // 3. ASSIGNMENTS PULL
    private async pullAssignments(formId: string, onProgress?: (phase: string, progress?: number) => void) {
        const db = await databaseService.getDB();
        let page = 1;
        let lastPage = 1;
        let totalItems = 0;

        // Backend support ?form_id=X
        const stmtAssign = `INSERT OR REPLACE INTO assignments (id, form_id, organization_id, supervisor_id, enumerator_id, prelist_data, status, synced_at, external_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        do {
            const res = await apiClient.get(`/assignments?form_id=${formId}&page=${page}&per_page=1000`); // 
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
                        assign.form_id || assign.app_schema_id || assign.form_version_id, // Fallback check
                        assign.organization_id,
                        assign.supervisor_id,
                        assign.enumerator_id,
                        JSON.stringify(assign.prelist_data),
                        assign.status,
                        new Date().toISOString(),
                        assign.external_id || null
                    ]
                }));

                if (batchSet.length > 0) {
                    try {
                        await db.executeSet(batchSet);
                        totalItems += batchSet.length;
                        console.log(`[Sync] Imported batch of ${batchSet.length} assignments.`);
                    } catch (e) {
                         console.error('[Sync] Failed to insert assignments batch', e);
                    }
                }
                
                page++;
                await new Promise(resolve => setTimeout(resolve, 10)); // Yield to UI
            } else {
                break;
            }
        } while (page <= lastPage);
    }

    // 4. RESPONSES PULL
    private async pullResponses(formId?: string) {
        try {
            const db = await databaseService.getDB();
            
            // Allow filtering by specific form/schema ID if provided
            const url = formId ? `/responses?app_schema_id=${formId}` : '/responses';
            logger.info(`[Sync] Pulling responses from: ${url}`);

            const responsesRes = await apiClient.get(url); 
            
            if (responsesRes.success && Array.isArray(responsesRes.data)) {
                logger.info(`[Sync] Found ${responsesRes.data.length} responses from server.`);
                logger.info("==============================");
                if (responsesRes.data.length > 0) {
                     logger.info('[Sync][First-Response-Check]  First synced response data from server:', responsesRes.data[0]);
                }

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
                        // Cast assignment_id to string to be safe for SQLite join
                        const fixedBatch = batchResponses.map((b: any) => ({
                           statement: b.statement,
                           values: [
                               b.values[0],
                               b.values[1],
                               String(b.values[2]), // assignment_id as string
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
            } else {
                logger.warn('[Sync] Response pull returned empty or invalid format', responsesRes);
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
        
        // Get unsynced responses joined with assignments to get schema_id
        const res = await db.query(`
            SELECT r.*, a.form_id 
            FROM responses r 
            LEFT JOIN assignments a ON r.assignment_id = a.id
            WHERE r.is_synced = 0
        `);
        const unsynced = res.values || [];

        if (unsynced.length === 0) return;

        // BATCHING: Process one at a time to prevent MySQL Packet Too Large (2006) errors with Base64 images
        const BATCH_SIZE = 1;
        
        for (let i = 0; i < unsynced.length; i += BATCH_SIZE) {
            const chunk = unsynced.slice(i, i + BATCH_SIZE);
            const payload = chunk.map(r => ({
                local_id: r.local_id,
                assignment_id: r.assignment_id,
                form_id: r.form_id,
                data: JSON.parse(r.data),
                created_at: r.created_at,
                updated_at: r.updated_at,
                device_id: 'device-1' // TODO: Get real device ID
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
                throw e; // Re-throw to stop the sync process
            }
        }
    }
}

export const syncService = new SyncService();
