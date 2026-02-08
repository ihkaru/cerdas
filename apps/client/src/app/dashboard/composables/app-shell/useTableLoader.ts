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
                log.debug('Raw SQLite Row:', { 
                    layoutType: typeof t.layout, 
                    fieldsType: typeof t.fields,
                    version: t.version,
                    keys: Object.keys(t),
                    layoutSample: typeof t.layout === 'string' ? t.layout.substring(0, 50) : 'OBJ',
                    fieldsSample: typeof t.fields === 'string' ? t.fields.substring(0, 50) : 'OBJ'
                });

                let parsedLayout = t.layout;
                try {
                    if (typeof t.layout === 'string') parsedLayout = JSON.parse(t.layout);
                } catch (e) {
                    log.error('Failed to parse layout JSON:', t.layout);
                }

                let parsedFields = t.fields;
                try {
                    if (typeof t.fields === 'string') parsedFields = JSON.parse(t.fields);
                } catch (e) {
                    log.error('Failed to parse fields JSON:', t.fields);
                }

                schemaData.value = {
                    ...t,
                    version: t.version, // Explicitly assign version
                    fields: parsedFields,
                    layout: parsedLayout,
                    settings: typeof t.settings === 'string' ? JSON.parse(t.settings) : t.settings
                };
                layout.value = schemaData.value.layout || {};
                
                log.debug(`Loaded Table Data. Layout: ${!!schemaData.value.layout}`);
                log.debug(`[UseTableLoader] Layout views.default loaded:`, JSON.stringify({
                    groupBy: layout.value?.views?.default?.groupBy || 'NONE',
                    deck: layout.value?.views?.default?.deck || 'NO DECK'
                }));
                
                return schemaData.value;
            }
        } catch(e) {
            log.warn('Failed to load table schema', e);
        }
        return null;
    };

    return { loadTable };
}
