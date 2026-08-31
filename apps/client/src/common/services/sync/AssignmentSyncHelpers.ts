/* eslint-disable @typescript-eslint/no-explicit-any */

import { apiClient } from '../../api/ApiClient';
import { databaseService } from '../../database/DatabaseService';
import { logger } from '../../utils/logger';
import { generateUUID } from '../../utils/uuid';

// --- Assignment Batch Builder ---

/** Build batch statements for UPSERT into local SQLite */
export function buildAssignmentBatch(items: any[], stmtAssign: string, syncTimestamp: string) {
    const activeItems = items.filter((assign: any) => !assign.deleted_at);
    return activeItems.map((assign: any) => ({
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
export async function handleTombstones(db: any, deletedIds: string[]) {
    if (!deletedIds || deletedIds.length === 0) return;
    logger.info(`[Sync] Deleting ${deletedIds.length} tombstoned assignments locally`);
    for (const id of deletedIds) {
        await db.run(`DELETE FROM assignments WHERE id = ?`, [id]);
        await db.run(`DELETE FROM responses WHERE assignment_id = ?`, [id]);
    }
}

/** Remove local untouched assigned prelists not present on server */
export async function cleanupOrphanAssignments(db: any, tableId: string, fetchedIds: string[]) {
    if (fetchedIds.length === 0) {
        await db.run(
            `DELETE FROM assignments WHERE table_id = ? AND status = 'assigned' AND id NOT IN (SELECT assignment_id FROM responses WHERE assignment_id IS NOT NULL)`,
            [tableId]
        );
        logger.warn(`[Sync] No assignments from server for table ${tableId}, cleared local untouched prelists`);
        return;
    }

    const localResult = await db.query(
        `SELECT a.id FROM assignments a 
         WHERE a.table_id = ? AND a.status = 'assigned' AND a.id NOT IN (SELECT assignment_id FROM responses WHERE assignment_id IS NOT NULL)`,
        [tableId]
    );
    const localIds: string[] = (localResult.values || []).map((r: { id: string }) => r.id);

    logger.debug(`[SyncService] Cleanup Orphans. Local untouched prelists: ${localIds.length}, Fetched: ${fetchedIds.length}`);

    const fetchedSet = new Set(fetchedIds);
    const orphanIds = localIds.filter((id: string) => !fetchedSet.has(id));

    if (orphanIds.length > 0) {
        logger.debug(`[Sync] Removing ${orphanIds.length} orphan assignments for table ${tableId}`);
        for (const id of orphanIds) {
            await db.run('DELETE FROM assignments WHERE id = ?', [id]);
        }
    } else {
        logger.debug(`[Sync] No orphan assignments found for table ${tableId}`);
    }
}

// --- Pagination Helpers ---

/** Process a single page: insert batch + handle tombstones. Returns count of items inserted. */
export async function processAssignmentPage(
    db: any, res: any, stmtAssign: string, syncTimestamp: string, trackIds: boolean, fetchedIds: string[]
): Promise<number> {
    const rawItems = res.data?.data || (Array.isArray(res.data) ? res.data : []);
    const deletedItems = rawItems.filter((a: any) => a.deleted_at);
    const activeItems = rawItems.filter((a: any) => !a.deleted_at);

    // Handle soft-deleted tombstones
    const tombstoneIds = [
        ...deletedItems.map((a: any) => a.id),
        ...(res.deleted_ids || [])
    ];
    if (tombstoneIds.length > 0) {
        await handleTombstones(db, tombstoneIds);
    }

    if (trackIds) {
        for (const a of activeItems) fetchedIds.push(a.id);
    }

    const batchSet = buildAssignmentBatch(activeItems, stmtAssign, syncTimestamp);

    let inserted = 0;
    if (batchSet.length > 0) {
        try {
            await db.executeSet(batchSet);
            inserted = batchSet.length;
        } catch (e) {
            logger.error('[Sync] Assignment batch insert failed', e);
        }
    }

    return inserted;
}

/** Fetch all assignment pages via cursor pagination */
export async function fetchAssignmentPages(
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
        onProgress?.(
            hasNext
                ? `Mengunduh penugasan (halaman ${pageNum})...`
                : 'Mengunduh penugasan (halaman terakhir)...',
            progress
        );

        const syncTimestamp = serverTime || new Date().toISOString();
        totalItems += await processAssignmentPage(db, res, stmtAssign, syncTimestamp, trackIds, fetchedIds);

        cursor = res.data?.next_cursor || null;
        await new Promise(resolve => setTimeout(resolve, 10));
    } while (cursor);

    return { totalItems, serverTime, fetchedIds };
}

// --- Assignments Pull ---

// Clock Safety: We NEVER use `new Date()` for sync timestamps.
// Instead, we use `server_time` from the API response. This protects against
// devices with incorrect date/time settings (e.g., auto-update disabled).
export async function pullAssignments(tableId: string, onProgress?: (phase: string, progress?: number) => void) {
    const db = await databaseService.getDB();
    const syncKey = `sync_assignments_${tableId}`;
    const lastSync = localStorage.getItem(syncKey);
    const isInitialSync = !lastSync;

    logger.info('[Sync] pullAssignments START:', {
        tableId, mode: isInitialSync ? 'INITIAL' : 'DELTA', lastSync: lastSync || 'never'
    });

    // Simple UPSERT: server is the authoritative source for assignment status.
    // Draft protection is handled at the BACKEND level (ResponseController.php),
    // where the server respects the client's explicit status field in the push payload.
    // This means: if server sends back "in_progress", that's correct and we store it.
    // If server sends back "approved"/"rejected", that's a supervisor action we WANT to apply.
    const stmtAssign = `INSERT OR REPLACE INTO assignments (id, table_id, organization_id, supervisor_id, enumerator_id, prelist_data, status, synced_at, external_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const baseParams = `table_id=${tableId}&per_page=2000&use_cursor=true`;
    const deltaParams = lastSync
        ? `&updated_since=${encodeURIComponent(lastSync)}&include_deleted=1`
        : '';
    const baseUrl = `/assignments?${baseParams}${deltaParams}`;

    const { totalItems, serverTime, fetchedIds } = await fetchAssignmentPages(
        db, baseUrl, stmtAssign, isInitialSync, onProgress
    );

    if (isInitialSync) {
        await cleanupOrphanAssignments(db, tableId, fetchedIds);
    }

    if (serverTime) {
        localStorage.setItem(syncKey, serverTime);
        logger.info(`[Sync] Checkpoint saved: ${syncKey} = ${serverTime}`);
    }

    logger.info('[Sync] pullAssignments END:', { tableId, totalItems, mode: isInitialSync ? 'INITIAL' : 'DELTA' });
}

// --- Responses Pull ---

export async function pullResponses(tableId?: string) {
    try {
        const db = await databaseService.getDB();

        let url = tableId ? `/responses?table_id=${tableId}` : '/responses';
        const syncKey = tableId ? `sync_responses_${tableId}` : 'sync_responses_all';
        const lastSync = localStorage.getItem(syncKey);

        if (lastSync) {
            const separator = url.includes('?') ? '&' : '?';
            url += `${separator}updated_since=${encodeURIComponent(lastSync)}`;
        }

        logger.info(`[Sync] Pulling responses from: ${url}`);
        const responsesRes = await apiClient.get(url);

        if (responsesRes.success && Array.isArray(responsesRes.data)) {
            logger.info(`[Sync] Found ${responsesRes.data.length} responses from server.`);
            const stmtResponse = `INSERT OR REPLACE INTO responses (local_id, server_id, assignment_id, data, synced_at, created_at, updated_at, is_synced) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

            const batchResponses = responsesRes.data.map((res: any) => ({
                statement: stmtResponse,
                values: [
                    res.local_id || generateUUID(),
                    res.id,
                    res.assignment_id,
                    typeof res.data === 'string' ? res.data : JSON.stringify(res.data),
                    new Date().toISOString(),
                    res.created_at,
                    res.updated_at,
                    1
                ]
            }));

            if (batchResponses.length > 0) {
                try {
                    const fixedBatch = batchResponses.map((b: any) => ({
                        statement: b.statement,
                        values: [
                            b.values[0], b.values[1],
                            String(b.values[2]),
                            b.values[3], b.values[4],
                            b.values[5], b.values[6], b.values[7]
                        ]
                    }));
                    await db.executeSet(fixedBatch);
                    logger.info(`[Sync] Imported ${fixedBatch.length} responses.`);
                } catch (e) {
                    logger.error('[Sync] Failed to execute response batch', e);
                }
            }

            if (responsesRes.server_time) {
                localStorage.setItem(syncKey, responsesRes.server_time);
                logger.debug(`[Sync] Responses checkpoint saved: ${syncKey} = ${responsesRes.server_time}`);
            }
        }
    } catch (e) {
        logger.warn('Failed to pull responses', e);
    }
    return null;
}
