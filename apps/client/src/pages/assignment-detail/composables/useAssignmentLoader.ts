import { type AppSchema } from '@cerdas/form-engine';
import { ref } from 'vue';
import { DashboardRepository } from '../../../app/dashboard/repositories/DashboardRepository';
import type { Assignment } from '../../../app/dashboard/types';
import { useDatabase } from '../../../common/composables/useDatabase';
import { useLogger } from '../../../common/utils/logger';

export function useAssignmentLoader(assignmentId: string) {
    const log = useLogger('AssignmentDetail:Loader');
    const db = useDatabase();

    const loading = ref(true);
    const error = ref<string | null>(null);
    const assignment = ref<Assignment | null>(null);
    const schema = ref<AppSchema | null>(null);
    const formData = ref<Record<string, unknown>>({});
    
    // Version Pinning State
    const pinnedSchemaVersion = ref<number | null>(null);
    const currentTableVersion = ref<number | null>(null);

    /**
     * Normalize raw fields into an AppSchema object.
     */
    const normalizeSchema = (fieldsObj: unknown): AppSchema | null => {
        if (!fieldsObj) return null;
        if (Array.isArray(fieldsObj)) {
            return fieldsObj.length > 0 ? { fields: fieldsObj } as unknown as AppSchema : null;
        }
        return fieldsObj as unknown as AppSchema;
    };

    /**
     * Load schema from preview override (editor live preview).
     */
    const loadSchemaFromOverride = (tableId: string): AppSchema | null => {
        const override = (window as unknown as Record<string, unknown>).__SCHEMA_OVERRIDE as Record<string, Record<string, unknown>> | undefined;
        const tableOverride = override?.[tableId];
        const schemaObj = tableOverride?.schema as Record<string, unknown> | undefined;
        if (!schemaObj) return null;

        log.info('[PreviewMode] Using Schema Override for Form Detail');
        let overrideFields = schemaObj.fields;
        if (overrideFields && !Array.isArray(overrideFields)) {
            log.warn('[PreviewMode] Fields is not array, converting');
            overrideFields = Object.values(overrideFields as Record<string, unknown>);
        }
        return { ...schemaObj, fields: overrideFields || [] } as unknown as AppSchema;
    };

    /**
     * Load schema from local DB, with version pinning support.
     */
    const loadSchemaFromDB = async (
        conn: Awaited<ReturnType<typeof db.getDB>>,
        tableId: string,
        assignmentId: string
    ): Promise<{
        schema: AppSchema;
        pinnedVersion: number | null;
        currentVersion: number | null;
    }> => {
        const fetchedTable = await DashboardRepository.getTable(conn, tableId);
        if (!fetchedTable) throw new Error('Table Schema not found locally. Please Sync.');

        // Try to resolve schema from fields
        let resolved = normalizeSchema(fetchedTable.fields);
        if (!resolved) {
            // Fallback for legacy nested 'schema' key
            const legacy = (fetchedTable as unknown as Record<string, unknown>).schema as Record<string, unknown> | undefined;
            if (legacy?.fields) {
                resolved = legacy as unknown as AppSchema;
            } else {
                throw new Error('Table Schema is empty. Please re-sync.');
            }
        }

        // Version Pinning: check if draft uses an older schema
        const existingResponse = await DashboardRepository.getResponse(conn, assignmentId);
        const responseSchemaVer = existingResponse?.schemaVersion || null;
        const tableVersion = fetchedTable.version || 0;

        // If response exists and its version is strictly less than current table version, try to load cached schema
        if (responseSchemaVer && responseSchemaVer < tableVersion) {
            const cachedSchema = await DashboardRepository.getSchemaForVersion(conn, tableId, responseSchemaVer);
            if (cachedSchema) {
                log.info('[VersionPinning] Using cached schema', { version: responseSchemaVer });
                resolved = normalizeSchema(cachedSchema.fields) || resolved;
            } else {
                log.warn('[VersionPinning] No cached schema found, using current schema');
            }
            return { schema: resolved, pinnedVersion: responseSchemaVer, currentVersion: tableVersion };
        }

        return { schema: resolved, pinnedVersion: null, currentVersion: tableVersion };
    };

    const loadData = async () => {
        try {
            loading.value = true;
            error.value = null;
            const conn = await db.getDB();

            // 1. Get Assignment
            const fetchedAssign = await DashboardRepository.getAssignmentById(conn, assignmentId);
            if (!fetchedAssign) throw new Error('Assignment not found');
            assignment.value = fetchedAssign;

            // 2. Load Schema (Preview Override or DB)
            if (!assignment.value.table_id) throw new Error('Assignment has no table ID');

            let schemaToUse: AppSchema | null = null;
            let pinnedVer: number | null = null;
            let currentVer: number | null = null;

            const overrideSchema = loadSchemaFromOverride(assignment.value.table_id);
            if (overrideSchema) {
                schemaToUse = overrideSchema;
            } else {
                const result = await loadSchemaFromDB(conn, assignment.value.table_id, assignmentId);
                schemaToUse = result.schema;
                pinnedVer = result.pinnedVersion;
                currentVer = result.currentVersion;
            }

            // 3. Merge prelist_data with existing response
            const prelistData = assignment.value?.prelist_data || {};
            const existingResponse = await DashboardRepository.getResponse(conn, assignmentId);
            const existingData = existingResponse?.data || null;

            formData.value = {
                ...prelistData,
                ...(existingData || {})
            };

            // 4. Set Schema and Version Info (Trigger Render)
            schema.value = schemaToUse;
            pinnedSchemaVersion.value = pinnedVer;
            currentTableVersion.value = currentVer;

            log.info('[AssignmentDetail] Form data initialized', { 
                formKeys: Object.keys(formData.value),
                schemaFields: schema.value?.fields?.length 
            });

        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Unknown error';
            error.value = msg;
            log.error('Failed to load data', e);
        } finally {
            loading.value = false;
        }
    };

    return {
        loading,
        error,
        assignment,
        schema,
        formData,
        pinnedSchemaVersion,
        currentTableVersion,
        loadData
    };
}
