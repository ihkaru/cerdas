import { useAuthStore } from '@/common/stores/authStore';
import { useLogger } from '@/common/utils/logger';
import { computed, onMounted, onUnmounted, watch } from 'vue';

// Composables
import { useAppContext } from './app-shell/useAppContext';
import { useAppMetadata } from './app-shell/useAppMetadata';
import { useAppShellState } from './app-shell/useAppShellState';
import { useAssignmentQueries } from './app-shell/useAssignmentQueries';
import { useGroupingLogic } from './app-shell/useGroupingLogic';
import { useSchemaLoader } from './app-shell/useSchemaLoader';
import { useSearchAndFilter } from './app-shell/useSearchAndFilter';
import { useAppShellActions } from './useAppShellActions';
import { useAppShellSync } from './useAppShellSync';

export function useAppShellLogic(formId: string) {
    const authStore = useAuthStore();
    const log = useLogger('UseAppShellLogic');

    // 1. Core State
    const state = useAppShellState();

    // 2. Fetch App Context Helper
    const context = useAppContext(authStore, state.currentUserRole);

    // Forward Declaration for Dependencies
    let refreshDataFn = async () => {};

    // 3. Metadata (Depends on refreshDataFn logic)
    // We pass a wrapper that calls the real function later
    const metadata = useAppMetadata(
        formId,
        () => refreshDataFn(),
        context.fetchAppContext,
        state.currentUserRole,
        authStore
    );

    // 4. Schema Loader
    const schemaLoader = useSchemaLoader(formId, state.schemaData, state.layout);

    // 5. Grouping Logic
    const grouping = useGroupingLogic(
        metadata.activeView,
        metadata.appViews,
        state.layout,
        state.schemaData,
        state.searchQuery,
        formId,
        () => refreshDataFn()
    );

    // 6. Assignment Queries (The source of truth for refreshData)
    const queries = useAssignmentQueries(
        formId,
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
            await schemaLoader.loadFormSchema();
            await metadata.loadAppMetadata(state.schemaData.value, isRefresh, state.loading);
        } catch (e) {
            log.error('Failed to load app', e);
            if (!isRefresh) state.loading.value = false;
        }
    };

    const { deleteAssignment, completeAssignment, createAssignment } = useAppShellActions(formId, (full) => loadApp(full));

    const { isSyncing, syncProgress, syncMessage, syncApp } = useAppShellSync(formId, (full) => loadApp(full), () => {
        grouping.groupPath.value = []; 
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
    watch([state.searchQuery, state.statusFilter], () => {
        clearTimeout(searchDebounce);
        searchDebounce = setTimeout(() => {
            refreshDataFn();
        }, 300);
    });

    onMounted(() => {
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
        appForms: metadata.appForms,
        appNavigation: metadata.appNavigation,
        appViews: metadata.appViews,
        
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