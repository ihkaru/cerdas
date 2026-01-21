import { useDatabase } from '@/common/composables/useDatabase';
import { useLogger } from '@/common/utils/logger';
import type { Ref } from 'vue';

export function useSchemaLoader(
    formId: string,
    schemaData: Ref<any>,
    layout: Ref<any>
) {
    const log = useLogger('UseSchemaLoader');
    const db = useDatabase();

    const loadFormSchema = async () => {
        try {
            const conn = await db.getDB();
            // 1. Get Schema
            const forms = await conn.query('SELECT * FROM forms WHERE id = ?', [formId]);
            log.debug(`Loaded form row for ${formId}:`, forms.values?.[0] ? 'found' : 'missing');
            
            if (forms.values && forms.values.length > 0) {
                const f = forms.values[0];
                schemaData.value = {
                    ...f,
                    schema: typeof f.schema === 'string' ? JSON.parse(f.schema) : f.schema,
                    layout: typeof f.layout === 'string' ? JSON.parse(f.layout) : f.layout,
                    settings: typeof f.settings === 'string' ? JSON.parse(f.settings) : f.settings
                };
                layout.value = schemaData.value.layout || {};
                
                log.debug(`Loaded Form Data. Layout: ${!!schemaData.value.layout}, Settings: ${!!schemaData.value.settings}`);
                
                return schemaData.value;
            }
        } catch(e) {
            log.warn('Failed to load form schema', e);
        }
        return null;
    };

    return { loadFormSchema };
}
