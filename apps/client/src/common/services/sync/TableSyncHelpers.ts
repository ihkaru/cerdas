/* eslint-disable @typescript-eslint/no-explicit-any */

import { apiClient } from '../../api/ApiClient';
import { databaseService } from '../../database/DatabaseService';
import { logger } from '../../utils/logger';

// --- Table Metadata Sync ---

export async function syncTablesMetadata(db: any, tables: any[]) {
    for (const table of tables) {
        const existing = await db.query(`SELECT version FROM tables WHERE id = ?`, [table.id]);

        if (existing.values && existing.values.length > 0) {
            await db.run(
                `UPDATE tables SET name = ?, description = ?, version = ?, version_policy = ?, synced_at = ? WHERE id = ?`,
                [table.name, table.description, table.version, table.version_policy || 'accept_all', new Date().toISOString(), table.id]
            );
        } else {
            await db.run(
                `INSERT INTO tables (id, app_id, name, description, version, version_policy, synced_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [table.id, table.app_id || table.id, table.name, table.description, table.version, table.version_policy || 'accept_all', new Date().toISOString()]
            );
        }
    }
}

export async function cleanupOrphansAndTombstones(
    db: any,
    lastSync: string | null,
    tables: any[],
    deletedTableIds: string[],
    deletedAppIds: string[] = []
) {
    if (!lastSync) {
        // Initial Sync: Delete local tables NOT in server response
        const serverTableIds = tables.map((t: { id: string }) => t.id);
        if (serverTableIds.length > 0) {
            const placeholders = serverTableIds.map(() => '?').join(',');
            await db.run(`DELETE FROM tables WHERE id NOT IN (${placeholders})`, serverTableIds);
            logger.info('[Sync] Orphan cleanup: removed tables not on server');
        } else {
            await db.run(`DELETE FROM tables`);
            await db.run(`DELETE FROM assignments`);
            logger.warn('[Sync] Server returned no tables, cleared all local data');
        }
    } else {
        // Delta Sync: Use exact tombstones returned from backend
        if (deletedTableIds && deletedTableIds.length > 0) {
            const placeholders = deletedTableIds.map(() => '?').join(',');
            await db.run(
                `DELETE FROM responses WHERE assignment_id IN (SELECT id FROM assignments WHERE table_id IN (${placeholders}))`,
                deletedTableIds
            );
            await db.run(`DELETE FROM assignments WHERE table_id IN (${placeholders})`, deletedTableIds);
            await db.run(`DELETE FROM table_versions WHERE table_id IN (${placeholders})`, deletedTableIds);
            await db.run(`DELETE FROM tables WHERE id IN (${placeholders})`, deletedTableIds);
            logger.info(`[Sync] Delta cleanup: removed ${deletedTableIds.length} deleted tables`);
        }

        if (deletedAppIds && deletedAppIds.length > 0) {
            const placeholders = deletedAppIds.map(() => '?').join(',');
            await db.run(
                `DELETE FROM responses WHERE assignment_id IN (
                    SELECT id FROM assignments WHERE table_id IN (
                        SELECT id FROM tables WHERE app_id IN (${placeholders})
                    )
                )`,
                deletedAppIds
            );
            await db.run(
                `DELETE FROM assignments WHERE table_id IN (
                    SELECT id FROM tables WHERE app_id IN (${placeholders})
                )`,
                deletedAppIds
            );
            await db.run(
                `DELETE FROM table_versions WHERE table_id IN (
                    SELECT id FROM tables WHERE app_id IN (${placeholders})
                )`,
                deletedAppIds
            );
            await db.run(`DELETE FROM tables WHERE app_id IN (${placeholders})`, deletedAppIds);
            await db.run(`DELETE FROM apps WHERE id IN (${placeholders})`, deletedAppIds);
            logger.info(`[Sync] Delta cleanup: removed ${deletedAppIds.length} deleted apps`);
        }
    }
}

export function syncDashboardUIState(stats: any, tables: any[]) {
    if (stats) {
        localStorage.setItem('dashboard_stats', JSON.stringify(stats));
    }
    const pendingCounts = tables.reduce((acc: any, t: any) => ({
        ...acc,
        [t.id]: t.pending_tasks || 0
    }), {});
    localStorage.setItem('app_pending_counts', JSON.stringify(pendingCounts));
}

export async function syncApps(db: any, apps: any[], isInitialSync = true) {
    for (const app of apps) {
        const existing = await db.query(`SELECT version FROM apps WHERE id = ?`, [app.id]);

        if (existing.values && existing.values.length > 0) {
            await db.run(
                `UPDATE apps SET slug = ?, name = ?, description = ?, navigation = ?, view_configs = ?, version = ?, start_date = ?, end_date = ?, expired_behavior = ?, mode = ?, synced_at = ? WHERE id = ?`,
                [
                    app.slug, app.name, app.description,
                    JSON.stringify(app.navigation || []),
                    JSON.stringify(app.view_configs || {}),
                    app.version || 1,
                    app.start_date || null, app.end_date || null,
                    app.expired_behavior || 'read_only',
                    app.mode || 'simple',
                    new Date().toISOString(), app.id
                ]
            );
        } else {
            await db.run(
                `INSERT INTO apps (id, slug, name, description, navigation, view_configs, version, start_date, end_date, expired_behavior, mode, synced_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    app.id, app.slug, app.name, app.description,
                    JSON.stringify(app.navigation || []),
                    JSON.stringify(app.view_configs || {}),
                    app.version || 1,
                    app.start_date || null, app.end_date || null,
                    app.expired_behavior || 'read_only',
                    app.mode || 'simple',
                    new Date().toISOString()
                ]
            );
        }
    }

    if (isInitialSync) {
        const serverAppIds = apps.map((a: { id: string }) => a.id);
        if (serverAppIds.length > 0) {
            const placeholders = serverAppIds.map(() => '?').join(',');
            await db.run(`DELETE FROM apps WHERE id NOT IN (${placeholders})`, serverAppIds);
            logger.info('[Sync] Orphan cleanup: removed apps not on server');
        } else {
            await db.run(`DELETE FROM apps`);
            logger.warn('[Sync] Server returned no apps, cleared all local apps');
        }
    }
}

// --- Table Schema Pull ---

export function logPullTableDebug(table: any) {
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

export function determineVersion(table: any) {
    const version = table.current_version_model || table.latest_published_version || table.versions?.[0];
    let versionSource = 'versions[0] (fallback)';
    if (table.current_version_model) versionSource = 'current_version_model';
    else if (table.latest_published_version) versionSource = 'latest_published_version';
    logger.info(`[SyncService] 🧐 Version Selection for ${table.id}:`, {
        selectedVersion: version?.version,
        source: versionSource
    });
    return version;
}

export async function cacheAndSaveTable(db: any, tableId: string, version: any, table: any) {
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
        const currentRow = await db.query('SELECT version, fields, layout FROM tables WHERE id = ?', [tableId]);
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

    // UPSERT: Ensure the tables row EXISTS with app_id before updating schema data.
    // On fresh Android installs, the tables table is empty (no prior global sync),
    // so a plain UPDATE would silently affect 0 rows, losing the schema AND app_id.
    // Without app_id, getSiblingTables() returns [] and assignment queries use the wrong ID.
    await db.run(
        `INSERT OR IGNORE INTO tables (id, app_id, name, description, version, version_policy, synced_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [tableId, table.app_id || null, table.name || null, table.description || null, version.version, table.version_policy || 'accept_all', new Date().toISOString()]
    );

    await db.run(
        `UPDATE tables SET fields = ?, layout = ?, settings = ?, version = ?, app_id = COALESCE(app_id, ?), name = COALESCE(name, ?), synced_at = ? WHERE id = ?`,
        [
            JSON.stringify(fieldsData),
            JSON.stringify(layoutData),
            JSON.stringify(table.settings || {}),
            version.version,
            table.app_id || null,
            table.name || null,
            new Date().toISOString(),
            tableId
        ]
    );

    logger.info(`[SyncService] UPSERT Table ${tableId}: app_id=${table.app_id || 'unknown'}`);
}

export async function pullTable(tableId: string) {
    const db = await databaseService.getDB();
    try {
        const res = await apiClient.get(`/tables/${tableId}`);
        if (res.success && res.data) {
            const table = res.data;
            logPullTableDebug(table);
            const version = determineVersion(table);
            if (version) {
                await cacheAndSaveTable(db, table.id, version, table);
            }
        }
    } catch (e: any) {
        if (e.status === 404 || e.message?.includes('404')) {
            logger.warn(`[SyncService] Table ${tableId} not found on server (404). Cleaning up.`);
            await db.run('DELETE FROM tables WHERE id = ?', [tableId]);
            await db.run('DELETE FROM assignments WHERE table_id = ?', [tableId]);
            window.dispatchEvent(new CustomEvent('table-deleted-from-server', { detail: { tableId } }));
            throw new Error(`Table ${tableId} has been deleted or is unavailable.`);
        } else {
            logger.error(`[SyncService] Failed to pull table ${tableId}`, e);
            throw e;
        }
    }
}

export async function pullApp(appId: string) {
    try {
        const res = await apiClient.get(`/apps/${appId}`);
        if (res.success && res.data) {
            const db = await databaseService.getDB();
            // isInitialSync=false: only upsert this app, don't delete others
            await syncApps(db, [res.data], false);
            return res.data;
        }
    } catch (e: any) {
        if (e.status === 404 || e.message?.includes('404')) {
            logger.warn(`[SyncService] App ${appId} not found on server (404)`);
        } else {
            logger.warn(`[SyncService] Failed to pull app ${appId}`, e);
        }
    }
    return null;
}

export async function pullGlobal() {
    const db = await databaseService.getDB();
    const syncKey = 'sync_global';
    const lastSync = localStorage.getItem(syncKey);
    const url = lastSync ? `/dashboard?updated_since=${encodeURIComponent(lastSync)}` : '/dashboard';

    logger.info(`[Sync] Pulling Global Scope from: ${url}`);
    const res = await apiClient.get(url);

    if (res.success && res.data) {
        await syncTablesMetadata(db, res.data.tables || []);
        await syncApps(db, res.data.apps || [], !lastSync);
        await cleanupOrphansAndTombstones(
            db,
            lastSync,
            res.data.tables || [],
            res.deleted_tables || [],
            res.deleted_apps || []
        );
        syncDashboardUIState(res.data.stats, res.data.tables || []);
        if (res.server_time) {
            localStorage.setItem(syncKey, res.server_time);
            logger.debug(`[Sync] Global checkpoint saved: ${res.server_time}`);
        }
    }
}
