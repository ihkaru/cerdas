import { type AppSchema } from '@cerdas/form-engine';
import { type Ref } from 'vue';
import type { Assignment } from '../../../app/dashboard/types';
import { useLogger } from '../../../common/utils/logger';

export function useLivePreview(
    schema: Ref<AppSchema | null>,
    assignment: Ref<Assignment | null>
) {
    const log = useLogger('AssignmentDetail:LivePreview');

    // Live Preview: Listen for schema updates from Editor
    const handleSchemaOverrideUpdate = (event: CustomEvent) => {
        const { tableId, formId, fields } = event.detail;
        const targetId = tableId || formId;

        // Check if we're in preview mode (iframe)
        const isInPreviewMode = window.self !== window.top;

        log.debug('[LivePreview] Received schema update event', {
            receivedId: targetId,
            currentTableId: assignment.value?.table_id,
            isInPreviewMode,
            hasFields: !!fields,
            fieldsCount: Array.isArray(fields) ? fields.length : 0
        });

        // In preview mode (iframe), accept schema updates for live preview
        if (isInPreviewMode && fields && assignment.value) {
            // Construct schema from fields array
            const newSchema = {
                ...schema.value,
                fields: Array.isArray(fields) ? fields : []
            };

            log.info('[LivePreview] Schema updated in preview mode, re-rendering form');
            schema.value = newSchema as unknown as AppSchema;
        }
    };

    return {
        handleSchemaOverrideUpdate
    };
}
