import { useLogger } from '@/common/utils/logger';
import type { Ref } from 'vue';
import { computed, ref } from 'vue';

export function useGroupingLogic(
    activeView: Ref<string>,
    appViews: Ref<any[]>,
    layout: Ref<any>,
    schemaData: Ref<any>,
    searchQuery: Ref<string>,
    formId: string,
    onGroupingChanged: () => void 
) {
    const log = useLogger('UseGroupingLogic');

    // Grouping State
    const groupPath = ref<string[]>([]);
    const forceShowItems = ref(false);

    // Grouping Computed
    const groupByConfig = computed(() => {
        const viewId = activeView.value;
        
        // 1. Check if there's a selected active view that has grouping
        if (viewId) {
            const view = appViews.value.find(v => v.id === viewId || v.view_id === viewId);
            
            if (view?.config?.groupBy) {
                const gb = view.config.groupBy;
                log.debug('Grouping found in view:', { viewId, groupBy: gb });
                if (Array.isArray(gb)) {
                    return { levels: gb.map(f => ({ field: f as string })) };
                }
                return gb;
            }
        }

        // 2. Fallback to schema-level grouping (Layout or Settings or 'default' view in layout)
        let config = layout.value?.grouping || 
                     layout.value?.groupBy || 
                     schemaData.value?.settings?.grouping || 
                     schemaData.value?.settings?.groupBy ||
                     layout.value?.views?.default?.groupBy; 
        
        if (config) {
            log.debug('Grouping found in schema fallback');
        }

        // Support simple array format ['field1', 'field2']
        if (Array.isArray(config)) {
            config = { levels: config.map((f: string) => ({ field: f })) };
        }

        return config || null;
    });

    const currentGroupLevel = computed(() => groupPath.value.length);

    const isGroupingActive = computed(() => {
        if (searchQuery.value) return false; // Global Search overrides grouping
        if (forceShowItems.value) return false;
        const config = groupByConfig.value;
        if (!config?.levels || !config.levels.length) return false;
        
        // Ensure we haven't drilled down past all levels
        return currentGroupLevel.value < config.levels.length;
    });

    const currentGroupField = computed(() => {
        if (!isGroupingActive.value) return null;
        return groupByConfig.value?.levels?.[currentGroupLevel.value]?.field || null;
    });

    // Helper for Query Construction (Drill-down)
    const buildGroupWhere = (statusFilterValue: string) => {
        let conditions: string[] = [`form_id = ?`];
        let params: any[] = [formId];

        // Add group path filters
        if (groupByConfig.value?.levels) {
            groupPath.value.forEach((val, idx) => {
                const field = groupByConfig.value.levels[idx]?.field;
                if (field) {
                    conditions.push(`json_extract(prelist_data, '$.${field}') = ?`);
                    params.push(val);
                }
            });
        }

        // Add Status filters (if passed to DB)
        if (statusFilterValue && statusFilterValue !== 'all') {
            conditions.push(`status = ?`);
            params.push(statusFilterValue);
        }

        const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        return { where, params };
    };

    const enterGroup = (groupValue: string) => {
        log.debug('[DEBUG-NAV] Entering group value:', { value: groupValue, type: typeof groupValue });
        groupPath.value.push(groupValue);
        forceShowItems.value = false;
        onGroupingChanged();
    };

    const navigateUp = () => {
        if (forceShowItems.value) {
            forceShowItems.value = false;
            onGroupingChanged();
            return true;
        }

        if (groupPath.value.length > 0) {
            groupPath.value.pop();
            forceShowItems.value = false;
            onGroupingChanged();
            return true;
        }
        return false;
    };

    return {
        groupPath,
        forceShowItems,
        groupByConfig,
        currentGroupLevel,
        isGroupingActive,
        currentGroupField,
        buildGroupWhere,
        enterGroup,
        navigateUp
    };
}
