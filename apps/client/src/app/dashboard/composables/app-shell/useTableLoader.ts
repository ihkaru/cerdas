import { useDatabase } from '@/common/composables/useDatabase';
import { useLogger } from '@/common/utils/logger';
import type { Ref } from 'vue';

interface TableRow {
    layout: string | Record<string, unknown>;
    fields: string | unknown[];
    settings: string | Record<string, unknown>;
    version: number;
    [key: string]: unknown;
}

function safeJsonParse<T>(value: string | T, fallback: T, errorLogger?: (msg: string, val: unknown) => void, label?: string): T {
    if (typeof value !== 'string') return value as T;
    try {
        return JSON.parse(value);
    } catch {
        errorLogger?.(`Failed to parse ${label} JSON:`, value);
        return fallback;
    }
}

export function useTableLoader(
    tableId: string,
    schemaData: Ref<Record<string, unknown> | null>,
    layout: Ref<Record<string, unknown>>
) {
    const log = useLogger('UseTableLoader');
    const db = useDatabase();

    const loadTable = async (overrideId?: string) => {
        const targetId = overrideId || tableId;
        try {
            const conn = await db.getDB();
            const tables = await conn.query('SELECT * FROM tables WHERE id = ?', [targetId]);
            log.debug(`Loaded table row for ${targetId}:`, tables.values?.[0] ? 'found' : 'missing');
            
            if (!tables.values || tables.values.length === 0) return null;

            const t = tables.values[0] as TableRow;
            log.debug('Raw SQLite Row:', { 
                layoutType: typeof t.layout, 
                fieldsType: typeof t.fields,
                version: t.version,
                keys: Object.keys(t),
                layoutSample: typeof t.layout === 'string' ? t.layout.substring(0, 50) : 'OBJ',
                fieldsSample: typeof t.fields === 'string' ? (t.fields as string).substring(0, 50) : 'OBJ'
            });

            const parsedLayout = safeJsonParse(t.layout as string, {}, log.error.bind(log), 'layout');
            const parsedFields = safeJsonParse(t.fields as string, [], log.error.bind(log), 'fields');
            const parsedSettings = safeJsonParse(t.settings as string, {});

            schemaData.value = {
                ...t,
                version: t.version,
                fields: parsedFields,
                layout: parsedLayout,
                settings: parsedSettings
            };
            layout.value = (schemaData.value.layout as Record<string, unknown>) || {};
            
            log.debug(`Loaded Table Data. Layout: ${!!schemaData.value.layout}`);
            log.debug(`[UseTableLoader] Layout views.default loaded:`, JSON.stringify({
                groupBy: (layout.value?.views as Record<string, Record<string, unknown>>)?.default?.groupBy || 'NONE',
                deck: (layout.value?.views as Record<string, Record<string, unknown>>)?.default?.deck || 'NO DECK'
            }));
            
            return schemaData.value;
        } catch(e) {
            log.warn('Failed to load table schema', e);
        }
        return null;
    };

    return { loadTable };
}
