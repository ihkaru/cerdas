
import { useAuthStore } from '@/common/stores/authStore';
import { useLogger } from '@/common/utils/logger';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

// Composables
import { useAppContext } from './app-shell/useAppContext';
import { useAppMetadata } from './app-shell/useAppMetadata';
import { useAppShellState } from './app-shell/useAppShellState';
import { useAssignmentQueries } from './app-shell/useAssignmentQueries';
import { useGroupingLogic } from './app-shell/useGroupingLogic';
import { useSearchAndFilter } from './app-shell/useSearchAndFilter';
import { useTableLoader } from './app-shell/useTableLoader'; // Renamed import
import { useAppShellActions } from './useAppShellActions';
import { useAppShellSync } from './useAppShellSync';

export function useAppShellLogic(contextId: string) { // Renamed formId to contextId
    const authStore = useAuthStore();
    const log = useLogger('UseAppShellLogic');

    // 1. Core State
    const state = useAppShellState();

    // 2. Fetch App Context Helper
    const context = useAppContext(authStore, state.currentUserRole);

    // Forward Declaration for Dependencies
    let refreshDataFn = async () => {};

    // 4. Schema Loader
    // We need a reactive Table ID because contextId might be an AppID
    const resolvedTableId = ref(contextId);
    
    // 3. Metadata
    // refreshData is now called AFTER loadTable in loadApp() for correct groupByConfig timing
    const metadata = useAppMetadata(
        contextId,
        context.fetchAppContext,
        state.currentUserRole,
        authStore
    );

    const schemaLoader = useTableLoader(contextId, state.schemaData, state.layout);

    // DEBUG: Monitor Schema Version
    watch(() => state.schemaData.value, (newVal) => {
        log.debug('[AppShellLogic] Schema Loaded:', { 
            id: newVal?.id,
            version: newVal?.version, 
            versionType: typeof newVal?.version,
            hasVersionProp: newVal && 'version' in newVal,
            keys: newVal ? Object.keys(newVal) : [],
            appVersion: metadata.appVersion.value,
            computed: computed(() => state.schemaData.value?.version || metadata.appVersion.value).value
        });
    }, { immediate: true });

    // 5. Grouping Logic
    const grouping = useGroupingLogic(
        metadata.activeView,
        metadata.appViews,
        state.layout,
        state.schemaData,
        state.searchQuery,
        resolvedTableId,
        () => refreshDataFn()
    );

    // 6. Assignment Queries (The source of truth for refreshData)
    const queries = useAssignmentQueries(
        resolvedTableId,
        {
            pendingUploadCount: state.pendingUploadCount,
            searchQuery: state.searchQuery,
            statusFilter: state.statusFilter,
            assignments: state.assignments,
            groups: state.groups,
            totalAssignments: state.totalAssignments
        },
        grouping
    );
    
    // Assign real refreshData implementation
    refreshDataFn = queries.refreshData;

    // 7. Search & Filter
    const filter = useSearchAndFilter(
        state.searchQuery,
        state.statusFilter,
        state.assignments,
        state.groups
    );

    // --- Actions & Helpers ---

    const appName = computed(() => state.schemaData.value?.name || 'Loading...');

    const headerActions = computed(() => {
        const customActions = state.layout.value?.headerActions || [];
        const defaultActions = [
             { id: 'sync', label: 'Sync Data', icon: 'arrow_2_circlepath', type: 'sync' },
             { id: 'reset', label: 'Reset Data', icon: 'trash', type: 'reset', color: 'red' }
        ];
        // Check if sync already exists in custom actions
        const hasSync = customActions.some((a: any) => a.type === 'sync');
        
        if (hasSync) {
            return [...customActions, { id: 'reset', label: 'Reset Data', icon: 'trash', type: 'reset', color: 'red' }];
        }
        return [...customActions, ...defaultActions];
    });

    const rowActions = computed(() => state.layout.value?.rowActions || []);
    const swipeConfig = computed(() => state.layout.value?.swipeConfig || {});
    const previewFields = computed(() => state.layout.value?.previewFields || []);

    const loadApp = async (isRefresh = false) => {
        if (!isRefresh) state.loading.value = true;
        try {
            // STEP 1: Load App Metadata FIRST (Resolves App Context)
            // Passing null to schemaData forces resolution by ID (App vs Table check)
            await metadata.loadAppMetadata(null, isRefresh, state.loading);

            // STEP 2: Determine Target Table ID from App Context
            let targetTableId = contextId; // Fallback: Assume contextId is TableID
            
            // If we found an App context with tables, use the first table (or default view logic later)
            if (metadata.appTables.value && metadata.appTables.value.length > 0) {
                 // Logic: If contextId was an AppID, we must pick a Table ID to load.
                 // Ideally this comes from the active View, but for now specific Table ID from list.
                 // Check if contextId matches any table ID?
                 const exactTable = metadata.appTables.value.find((t: any) => t.id === contextId);
                 if (!exactTable) {
                     // contextId is likely AppID, so pick first table as default
                     targetTableId = metadata.appTables.value[0].id;
                     log.debug(`Context ${contextId} resolved to Default Table ${targetTableId}`);
                 }
            }

            // Update the reactive ID so queries and grouping use the correct Table ID
            resolvedTableId.value = targetTableId;

            // STEP 3: Load Table Schema (Layout with groupByConfig)
            await schemaLoader.loadTable(targetTableId); 
            
            // STEP 4: Now load data - groupByConfig is available from layout
            // This ensures first render has grouping applied, preventing flashing
            await refreshDataFn();
            
            if (!isRefresh) state.loading.value = false;
            
        } catch (e) {
            log.error('Failed to load app', e);
            if (!isRefresh) state.loading.value = false;
        }
    };

    const { deleteAssignment, completeAssignment, createAssignment } = useAppShellActions(resolvedTableId, (full) => loadApp(full));

    const { isSyncing, syncProgress, syncMessage, syncApp } = useAppShellSync(contextId, (full) => loadApp(full), () => {
        grouping.groupPath.value = []; 
    });

    // Listener for real-time updates from Editor
    const onOverrideUpdate = async (e: Event) => {
        const detail = (e as CustomEvent).detail;
        // Check both tableId (new format) and formId (legacy) for compatibility
        const targetId = detail?.tableId || detail?.formId;
        
        // LOG BEFORE CONDITION - always log to trace if event is received
        log.debug('[OVERRIDE] Event received:', { 
            targetId, 
            contextId, 
            resolvedTableIdValue: resolvedTableId.value,
            willMatch: targetId === contextId || targetId === resolvedTableId.value
        });
        
        if (targetId === contextId || targetId === resolvedTableId.value) {
            log.info('[AppShell] Override updated, reloading app...', { targetId, contextId, resolvedTableId: resolvedTableId.value });
            
            // CRITICAL FIX: Load SQLite data FIRST for instant preview update
            log.debug('[OVERRIDE] Step 1: Calling loadTable...');
            await schemaLoader.loadTable(resolvedTableId.value);
            
            // Log the layout AFTER loadTable
            log.debug('[OVERRIDE] Step 2: Layout AFTER loadTable:', JSON.stringify({
                hasLayout: !!state.layout.value,
                viewsDefaultGroupBy: state.layout.value?.views?.default?.groupBy || 'NONE',
                viewsDefaultDeck: !!state.layout.value?.views?.default?.deck
            }));
            
            // Log grouping state
            log.debug('[OVERRIDE] Step 3: Grouping state:', JSON.stringify({
                groupByConfig: grouping.groupByConfig.value,
                isGroupingActive: grouping.isGroupingActive.value,
                currentGroupField: grouping.currentGroupField.value
            }));
            
            // Then refresh data to apply the new layout
            log.debug('[OVERRIDE] Step 4: Calling refreshData...');
            refreshDataFn();
            
            // Full app reload in background (for metadata sync)
            loadApp(true); // isRefresh=true to skip loading spinner
        }
    };

    let searchDebounce: any;
    watch([state.searchQuery, state.statusFilter], () => {
        clearTimeout(searchDebounce);
        searchDebounce = setTimeout(() => {
            refreshDataFn();
        }, 300);
    });

    onMounted(() => {
         log.debug('[AppShell] Mounted - Registering override listener', { contextId, resolvedTableIdValue: resolvedTableId.value });
         window.addEventListener('schema-override-updated', onOverrideUpdate);
    });

    onUnmounted(() => {
        window.removeEventListener('schema-override-updated', onOverrideUpdate);
    });

    return {
        // State (Destructured from useAppShellState)
        ...state,
        
        // Grouping
        groupPath: grouping.groupPath,
        isGroupingActive: grouping.isGroupingActive,
        currentGroupLevel: grouping.currentGroupLevel,
        groupByConfig: grouping.groupByConfig,
        forceShowItems: grouping.forceShowItems,
        enterGroup: grouping.enterGroup,
        navigateUp: grouping.navigateUp,
        
        // Metadata
        activeView: metadata.activeView,
        appTables: metadata.appTables, // Renamed
        appNavigation: metadata.appNavigation,
        appViews: metadata.appViews,
        // Prefer Table Schema Version (e.g. v8) -> App Version -> Draft
        appVersion: computed(() => state.schemaData.value?.version || metadata.appVersion.value),
        
        // Sync
        isSyncing, syncProgress, syncMessage, syncApp,
        
        // Computed
        filteredAssignments: filter.filteredAssignments,
        filteredGroups: filter.filteredGroups,
        
        statusCounts: queries.statusCounts,
        headerActions,
        rowActions,
        swipeConfig,
        appName,
        previewFields,
        
        // Methods
        loadApp,
        refreshData: refreshDataFn,
        deleteAssignment,
        completeAssignment,
        createAssignment
    };
}