import { useDatabase } from '@/common/composables/useDatabase';
import { useLogger } from '@/common/utils/logger';
import type { Ref } from 'vue';

export function useTableLoader(
    tableId: string,
    schemaData: Ref<any>,
    layout: Ref<any>
) {
    const log = useLogger('UseTableLoader');
    const db = useDatabase();

    const loadTable = async (overrideId?: string) => {
        const targetId = overrideId || tableId;
        try {
            const conn = await db.getDB();
            // 1. Get Table Schema
            const tables = await conn.query('SELECT * FROM tables WHERE id = ?', [targetId]);
            log.debug(`Loaded table row for ${targetId}:`, tables.values?.[0] ? 'found' : 'missing');
            
            if (tables.values && tables.values.length > 0) {
                const t = tables.values[0];
                schemaData.value = {
                    ...t,
                    // Parse JSON fields
                    fields: typeof t.fields === 'string' ? JSON.parse(t.fields) : t.fields,
                    layout: typeof t.layout === 'string' ? JSON.parse(t.layout) : t.layout,
                    settings: typeof t.settings === 'string' ? JSON.parse(t.settings) : t.settings
                };
                layout.value = schemaData.value.layout || {};
                
                log.debug(`Loaded Table Data. Layout: ${!!schemaData.value.layout}`);
                
                return schemaData.value;
            }
        } catch(e) {
            log.warn('Failed to load table schema', e);
        }
        return null;
    };

    return { loadTable };
}
