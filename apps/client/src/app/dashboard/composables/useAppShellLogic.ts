import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { DashboardRepository } from '../repositories/DashboardRepository';
import { AppMetadataService } from '../services/AppMetadataService';
import { AssignmentQueryService } from '../services/AssignmentQueryService';
import { useAppShellActions } from './useAppShellActions';
import { useAppShellSync } from './useAppShellSync';

import { useDatabase } from '@/common/composables/useDatabase';

import { useLogger } from '@/common/utils/logger';

export function useAppShellLogic(formId: string) {
    const db = useDatabase();
    const log = useLogger('UseAppShellLogic');

    // --- State ---
    const loading = ref(true);
    const schemaData = ref<any>(null);
    const layout = ref<any>(null);
    const assignments = ref<any[]>([]);
    const groups = ref<any[]>([]);
    const totalAssignments = ref(0);
    const pendingUploadCount = ref(0);
    const searchQuery = ref('');
    const statusFilter = ref('all');

    // Grouping State
    const groupPath = ref<string[]>([]);
    const forceShowItems = ref(false);

    // App Navigation & Views
    const appNavigation = ref<any[]>([]);
    const appViews = ref<any[]>([]);
    const appForms = ref<any[]>([]);
    const activeView = ref<string>('');

    // --- Computed ---
    const appName = computed(() => schemaData.value?.name || 'Loading...');

    // Grouping Computed
    const groupByConfig = computed(() => {
        const viewId = activeView.value;
        if (!viewId) return null;

        // 1. Check if there's a selected active view that has grouping
        const view = appViews.value.find(v => v.id === viewId || v.view_id === viewId);
        
        if (view?.config?.groupBy) {
            const gb = view.config.groupBy;
            log.debug('Grouping found in view:', { viewId, groupBy: gb });
            if (Array.isArray(gb)) {
                return { levels: gb.map(f => ({ field: f })) };
            }
            return gb;
        }

        // 2. Fallback to schema-level grouping (Layout or Settings)
        let config = layout.value?.grouping || 
                     layout.value?.groupBy || 
                     schemaData.value?.settings?.grouping || 
                     schemaData.value?.settings?.groupBy;
        
        if (config) {
            log.debug('Grouping found in schema fallback');
        }

        // Support simple array format ['field1', 'field2']
        if (Array.isArray(config)) {
            config = { levels: config.map(f => ({ field: f })) };
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
    const buildGroupWhere = () => {
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
        if (statusFilter.value && statusFilter.value !== 'all') {
            conditions.push(`status = ?`);
            params.push(statusFilter.value);
        }

        const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        return { where, params };
    };

    // Filtered Assignments (Client-side filtering for display)
    const filteredAssignments = computed(() => {
        let res = assignments.value || [];
        
        // Search is now handled SERVER-SIDE (DB) in refreshData
        // But we keep client-side Status filter just in case
        if (statusFilter.value && statusFilter.value !== 'all') {
            res = res.filter(a => a.status === statusFilter.value);
        }
        
        return res;
    });

    // Computed Groups Filtering
    const filteredGroups = computed(() => {
        // Search effectively disables groups, so this is moot, but safe to keep
        if (!searchQuery.value) return groups.value;
        const q = searchQuery.value.toLowerCase();
        return groups.value.filter(g => 
            String(g.value).toLowerCase().includes(q)
        );
    });

    const statusCounts = ref({ assigned: 0, in_progress: 0, completed: 0, all: 0 });

    const headerActions = computed(() => {
        const customActions = layout.value?.headerActions || [];
        const defaultActions = [
             { id: 'sync', label: 'Sync Data', icon: 'arrow_2_circlepath', type: 'sync' },
             { id: 'reset', label: 'Reset Data', icon: 'trash', type: 'reset', color: 'red' }
        ];
        
        // Check if sync already exists in custom actions
        const hasSync = customActions.some((a: any) => a.type === 'sync');
        
        if (hasSync) {
            // Even if custom, we append Reset for Debug
            return [...customActions, { id: 'reset', label: 'Reset Data', icon: 'trash', type: 'reset', color: 'red' }];
        }
        
        // Append default sync action and reset
        return [...customActions, ...defaultActions];
    });
    const rowActions = computed(() => layout.value?.rowActions || []);
    const swipeConfig = computed(() => layout.value?.swipeConfig || {});
    const previewFields = computed(() => layout.value?.previewFields || []);

    // --- Fetch Data Helper (Lightweight) ---
    const refreshData = async () => {
        try {
            const conn = await db.getDB();
            
            // Fetch Pending Uploads
            try {
                pendingUploadCount.value = await DashboardRepository.getPendingUploadCount(conn);
            } catch (e) {
                // Ignore if table not ready or logic error
                console.warn('Could not fetch pending uploads', e);
            }

            let { where, params } = buildGroupWhere();

            // 1. Separate WHERE for counts (Must exclude status filter to show other category counts)
            let countsWhere = where;
            let countsParams = params;

            // Override WHERE if searching (Global Search)
            if (searchQuery.value) {
                const q = `%${searchQuery.value}%`;
                // Global Search Mode within the form
                const baseConditions = [`form_id = ?`];
                const baseParams = [formId];

                // Search targeting merged data
                const searchCond = `json_patch(COALESCE(assignments.prelist_data, '{}'), COALESCE(responses.data, '{}')) LIKE ?`;
                
                // For Counts: form_id + search
                countsWhere = `WHERE ${baseConditions.join(' AND ')} AND ${searchCond}`;
                countsParams = [...baseParams, q];

                // For Data: form_id + search + status
                const dataConditions = [...baseConditions, searchCond];
                const dataParams = [...baseParams, q];

                if (statusFilter.value && statusFilter.value !== 'all') {
                    dataConditions.push(`assignments.status = ?`);
                    dataParams.push(statusFilter.value);
                }

                where = `WHERE ${dataConditions.join(' AND ')}`;
                params = dataParams;
                
                log.debug('[RefreshData] Global Search Active (Prioritized):', { query: searchQuery.value });
            } else {
                // Not searching - Drill-down Mode
                // countsWhere should be buildGroupWhere WITHOUT the status filter part.
                // It's easier to just build it here since we know the components.
                const baseConditions = [`form_id = ?`];
                const baseParams = [formId];
                if (groupByConfig.value?.levels) {
                    groupPath.value.forEach((val, idx) => {
                        const field = groupByConfig.value.levels[idx]?.field;
                        if (field) {
                            baseConditions.push(`json_extract(prelist_data, '$.${field}') = ?`);
                            baseParams.push(val);
                        }
                    });
                }
                countsWhere = `WHERE ${baseConditions.join(' AND ')}`;
                countsParams = baseParams;
            }

            // Fetch Status Counts for current context (drill-down or search)
            statusCounts.value = await AssignmentQueryService.getStatusCounts(conn, countsWhere, countsParams);
            
            // If Searching, isGroupingActive is FALSE, so we hit the 'else' block below
            if (isGroupingActive.value) {
                assignments.value = [];
                const field = currentGroupField.value;
                if (field) {
                    log.debug('[RefreshData] Grouping Active', { field, path: groupPath.value });
                    groups.value = await AssignmentQueryService.getGroupedAssignments(conn, field, where, params);
                    log.debug('[RefreshData] Groups loaded:', groups.value.length);
                }
            } else {
                groups.value = [];
                assignments.value = await AssignmentQueryService.getAssignments(conn, where, params);
                log.debug('[RefreshData] Assignments loaded:', assignments.value.length);
            }
            totalAssignments.value = await AssignmentQueryService.getTotalAssignments(conn, formId);
        } catch (e) {
            console.error('Failed to refresh data', e);
        }
    };

    // --- Load App Logic ---
    const loadApp = async (isRefresh = false) => {
        if (!isRefresh) loading.value = true;
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
            }

            // 3. Load App Metadata (Navigation & Sibling Forms)
            // If appId is missing in schemaData, try to resolve from DB directly
            let appId = schemaData.value?.app_id;
            let validAppId = await AppMetadataService.resolveAppId(conn, formId, appId);
            
            log.debug('Resolved validAppId:', validAppId);

            if (validAppId) {
                // A. Try Local Database First (Offline Support)
                try {
                    const { navigation, views } = await AppMetadataService.getLocalAppMetadata(conn, validAppId);
                    log.info(`Local Metadata loaded: ${navigation?.length} nav items, ${views?.length} views`);
                    
                    if (navigation.length) {
                        appNavigation.value = navigation;
                        // Auto-select first view if none selected
                        if (!activeView.value && navigation[0]?.view_id) {
                            activeView.value = navigation[0].view_id;
                            log.debug('Auto-selected default view (Local):', activeView.value);
                        }
                    }
                    if (views.length) appViews.value = views;

                    appForms.value = await AppMetadataService.getSiblingForms(conn, validAppId);
                } catch (e) {
                    log.warn('Failed to load local app metadata', e);
                }

                // 4. Fetch Data (Assignments) via Helper (IMMEDIATELY FROM LOCAL DB)
                await refreshData();
                
                // OPTIMIZATION: Show UI immediately if we have local data, don't wait for remote sync
                if (!isRefresh) loading.value = false;

                // B. If Online, Sync & Update Local DB (Background / Late Update)
                // Only sync if explicitly requested (PTR) or if we missing local data
                const missingLocalData = !appNavigation.value.length || !appViews.value.length;
                
                if (navigator.onLine && (isRefresh || missingLocalData)) {
                    try {
                        log.info('Fetching App Metadata from API...');
                        const result = await AppMetadataService.syncAppMetadata(conn, validAppId);
                        if (result) {
                            log.info(`Remote Metadata synced. Views: ${result.appData?.views?.length}`);

                            if (result.appData) {
                                // Update Reactively
                                appNavigation.value = result.appData.navigation;
                                appViews.value = result.appData.views;

                                // Auto-select first view if none selected
                                if (!activeView.value && appNavigation.value.length > 0 && appNavigation.value[0]?.view_id) {
                                    activeView.value = appNavigation.value[0].view_id;
                                    // If view changed/added, we might need to refresh data grouping logic
                                    // But usually local data is enough for initial paint.
                                }
                            }
                            if (result.forms) {
                                appForms.value = result.forms;
                            }
                        }
                    } catch (e) {
                        log.warn('Failed to fetch remote app metadata', e);
                    }
                }
            } else {
                 // No valid app ID, just refresh data based on default view?
                 await refreshData();
            }

        } catch (e) {
            console.error('Failed to load app', e);
        } finally {
            if (!isRefresh) loading.value = false;
        }
    };

    const enterGroup = (groupValue: string) => {
        console.log('[DEBUG-NAV] Entering group value:', groupValue, 'Type:', typeof groupValue);
        groupPath.value.push(groupValue);
        forceShowItems.value = false;
        refreshData(); // Use lightweight refresh
    };

    const navigateUp = () => {
        if (forceShowItems.value) {
            forceShowItems.value = false;
            refreshData();
            return true;
        }

        if (groupPath.value.length > 0) {
            groupPath.value.pop();
            forceShowItems.value = false;
            refreshData();
            return true;
        }
        return false;
    };

    const { deleteAssignment, completeAssignment, createAssignment } = useAppShellActions(formId, (full) => loadApp(full));

    const { isSyncing, syncProgress, syncMessage, syncApp } = useAppShellSync(formId, (full) => loadApp(full), () => {
        groupPath.value = []; // Reset navigation on sync start
    });

    // Listener for real-time updates from Editor
    const onOverrideUpdate = (e: Event) => {
        const detail = (e as CustomEvent).detail;
        if (detail?.formId === formId) {
            log.info('[AppShell] Override updated, reloading app...');
            loadApp();
        }
    };

    let searchDebounce: any;
    watch([searchQuery, statusFilter], () => {
        clearTimeout(searchDebounce);
        searchDebounce = setTimeout(() => {
            refreshData();
        }, 300);
    });

    onMounted(() => {
         window.addEventListener('schema-override-updated', onOverrideUpdate);
    });

    onUnmounted(() => {
        window.removeEventListener('schema-override-updated', onOverrideUpdate);
    });

    return {
        // State
        loading, schemaData, layout, assignments, groups, totalAssignments, pendingUploadCount, activeView, appForms,
        searchQuery, statusFilter, groupPath, isGroupingActive, currentGroupLevel, groupByConfig, forceShowItems,
        isSyncing, syncProgress, syncMessage,
        // Computed
        filteredAssignments, filteredGroups, statusCounts, headerActions, rowActions, swipeConfig, appName, previewFields, appNavigation, appViews,
        // Methods
        loadApp, refreshData, deleteAssignment, completeAssignment, syncApp, createAssignment, enterGroup, navigateUp
    };
}