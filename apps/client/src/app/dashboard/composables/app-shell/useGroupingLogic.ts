
import { useLogger } from '@/common/utils/logger';
import type { Ref } from 'vue';
import { computed, ref } from 'vue';

export function useGroupingLogic(
    activeView: Ref<string>,
    appViews: Ref<any[]>,
    layout: Ref<any>,
    schemaData: Ref<any>,
    searchQuery: Ref<string>,
    contextId: Ref<string> | string, // Renamed from formId
    onGroupingChanged: () => void 
) {
    const log = useLogger('UseGroupingLogic');
    
    // Resolve contextId to string value helper
    const getContextId = () => typeof contextId === 'string' ? contextId : contextId.value;

    // Grouping State
    const groupPath = ref<string[]>([]);
    const forceShowItems = ref(false);

    // Grouping Computed
    const groupByConfig = computed(() => {
        const viewId = activeView.value;
        

        
        log.debug('[groupByConfig] Evaluating...', { viewId, hasLayout: !!layout.value });
        
        // 1. Check if there's a selected active view that has grouping
        if (viewId) {
            const view = appViews.value.find(v => v.id === viewId || v.view_id === viewId);
            
            if (view?.config?.groupBy) {
                const gb = view.config.groupBy;
                log.debug('[groupByConfig] Found in appViews:', { viewId, groupBy: gb });
                if (Array.isArray(gb)) {
                    return { levels: gb.map(f => ({ field: f as string })) };
                }
                return gb;
            }
            log.debug('[groupByConfig] viewId set but NOT found in appViews, checking fallback...', { viewId, appViewsCount: appViews.value.length });
        }

        // 2. Fallback to schema-level grouping (Layout or Settings or 'default' view in layout)
        // IMPORTANT: Check for non-empty arrays, not just existence!
        // Empty arrays [] are truthy in JS, so we need explicit length checks
        const hasNonEmptyArray = (val: any) => Array.isArray(val) && val.length > 0;
        const hasNonEmptyObject = (val: any) => val && typeof val === 'object' && !Array.isArray(val) && (val.levels?.length > 0 || val.groupBy?.length > 0);
        
        let config = null;
        
        // Priority order: layout.grouping > layout.groupBy > settings.grouping > settings.groupBy > views.default.groupBy
        if (hasNonEmptyArray(layout.value?.grouping) || hasNonEmptyObject(layout.value?.grouping)) {
            config = layout.value.grouping;
        } else if (hasNonEmptyArray(layout.value?.groupBy)) {
            config = layout.value.groupBy;
        } else if (hasNonEmptyArray(schemaData.value?.settings?.grouping) || hasNonEmptyObject(schemaData.value?.settings?.grouping)) {
            config = schemaData.value.settings.grouping;
        } else if (hasNonEmptyArray(schemaData.value?.settings?.groupBy)) {
            config = schemaData.value.settings.groupBy;
        } else if (hasNonEmptyArray(layout.value?.views?.default?.groupBy)) {
            config = layout.value.views.default.groupBy;
        }
        

        
        log.debug('[groupByConfig] Fallback check:', {
            'layout.grouping': layout.value?.grouping || 'undefined',
            'layout.groupBy': layout.value?.groupBy || 'undefined',
            'schemaData.settings.grouping': schemaData.value?.settings?.grouping || 'undefined',
            'schemaData.settings.groupBy': schemaData.value?.settings?.groupBy || 'undefined',
            'layout.views.default.groupBy': layout.value?.views?.default?.groupBy || 'undefined',
            'finalConfig': config || 'null'
        });

        // Support simple array format ['field1', 'field2']
        if (Array.isArray(config)) {
            config = { levels: config.map((f: string) => ({ field: f })) };
        }

        log.debug('[groupByConfig] Final config:', JSON.stringify(config));
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

        
        const conditions: string[] = [`table_id = ?`];
        const params: any[] = [getContextId()];

        // Add group path filters
        // IMPORTANT: Must match AssignmentQueryService.getGroupedAssignments COALESCE logic
        // The GROUP BY uses COALESCE(responses.data, assignments.prelist_data)
        // So drill-down WHERE must also check BOTH sources
        if (groupByConfig.value?.levels) {
            groupPath.value.forEach((val, idx) => {
                const field = groupByConfig.value.levels[idx]?.field;
                if (field) {
                    // Build COALESCE expression matching AssignmentQueryService (uses latest_response subquery alias)
                    const coalescedExpr = `COALESCE(json_extract(latest_response.data, '$.${field}'), json_extract(assignments.prelist_data, '$.${field}'))`;
                    
                    if (val === '' || val === null || val === 'null') {
                        // Handle Empty/Null Group - check the coalesced value
                        conditions.push(`(${coalescedExpr} IS NULL OR ${coalescedExpr} = '' OR ${coalescedExpr} = 'null')`);
                    } else {
                        conditions.push(`${coalescedExpr} = ?`);
                        params.push(val);
                    }
                }
            });
        }

        // Add Status filters (if passed to DB)
        if (statusFilterValue && statusFilterValue !== 'all') {
            conditions.push(`status = ?`);
            params.push(statusFilterValue);
        }

        const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        
        log.debug('[buildGroupWhere] Query:', { 
            tableId: getContextId(), 
            statusFilter: statusFilterValue,
            groupPath: groupPath.value,
            where, 
            params 
        });
        
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
