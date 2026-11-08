<template>
    <f7-page name="app-shell" :page-content="false" @page:afterin="onPageAfterIn">
        <!-- Top Navbar -->
        <AppShellNavbar :title="pageTitle" :actions="navbarActions" :is-syncing="isSyncing" :show-back="true"
            @back="handleBackNav" @action="handleHeaderAction" @menu="openMenuPanel" data-inspect-target="settings" />

        <!-- Bottom Tabbar (Case 1: App Navigation) -->
        <AppShellTabbar v-if="appNavigation && appNavigation.length > 0"
            :items="appNavigation" :active-view="activeView" @select-item="handleAppNavClick" />

        <!-- Bottom Tabbar (Case 2: Legacy Layout Navigation) -->
        <AppShellTabbar v-else-if="layout && layout.navigation"
            :items="layout.navigation.primary || []" :active-view="activeView" :scrollable="true"
            :views-map="layout.views || {}" @select-item="activeView = String($event)" />

        <!-- Dynamic Content Switcher (Tabs / Single View / List) -->
        <AppShellContent
            :app-navigation="appNavigation"
            :current-view-config="currentViewConfig"
            :layout="layout"
            v-model:active-view="activeView"
            :loading="loading"
            :is-loading-data="isLoadingData"
            :is-online-connected="isOnline.connected"
            :pending-upload-count="pendingUploadCount"
            :is-schema-empty="isSchemaEmpty"
            v-model:search-query="searchQuery"
            v-model:status-filter="statusFilter"
            :status-counts="statusCounts"
            :active-filter-count="activeFilters.length"
            :has-grouping-config="hasGroupingConfig"
            v-model:force-show-items="forceShowItems"
            :total-assignments="totalAssignments"
            :is-grouping-active="isGroupingActive"
            :current-group-level="currentGroupLevel"
            :filtered-groups="filteredGroups"
            :group-by-config="groupByConfig"
            :group-path="groupPath"
            :current-group-field="currentGroupField"
            :context-id="contextId"
            :row-actions="rowActions"
            :swipe-config="swipeConfig"
            :has-more="hasMore"
            :current-user-role="currentUserRole"
            :displayed-assignments="displayedAssignments"
            :get-app-view-config="getAppViewConfig"
            :get-view-data="getViewData"
            @banner-sync="handleBannerSync"
            @open-sort="sortSheetOpen = true"
            @open-filter="filterSheetOpen = true"
            @enter-group="enterGroup"
            @navigate-up="navigateUp"
            @navigate-level="navigateToLevel"
            @row-action="handleRowAction"
            @open-assignment="openAssignment"
            @open-preview="handleShowPreview"
            @load-more="loadMore"
            @refresh="refresh" />

        <!-- Sheets & Overlays -->
        <AppShellModals
            :is-syncing="isSyncing"
            :sync-progress="syncProgress"
            :sync-message="syncMessage"
            v-model:preview-sheet-open="previewSheetOpen"
            :preview-assignment="previewAssignment"
            :preview-response-data="previewResponseData"
            :preview-fields="previewFields"
            v-model:sort-sheet-open="sortSheetOpen"
            v-model:active-sort="activeSort"
            v-model:filter-sheet-open="filterSheetOpen"
            v-model:active-filters="activeFilters"
            :available-fields="availableFields"
            @open-assignment="openAssignment" />

        <!-- Floating Action Button (FAB) for Create/Add Assignment -->
        <AppShellActionFab
            :visible="hasCreateAction && !isSchemaEmpty"
            :has-toolbar="Boolean(appNavigation && appNavigation.length > 0)"
            @click="triggerCreateAction" />
    </f7-page>
</template>

<script setup lang="ts">
import { f7 } from 'framework7-vue';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

// Components
import AppShellActionFab from '../app/dashboard/components/AppShellActionFab.vue';
import AppShellContent from '../app/dashboard/components/AppShellContent.vue';
import AppShellModals from '../app/dashboard/components/AppShellModals.vue';
import AppShellNavbar from '../app/dashboard/components/AppShellNavbar.vue';
import AppShellTabbar, { type TabItem } from '../app/dashboard/components/AppShellTabbar.vue';
import { openMenu, globalPanelOpened } from '../common/services/menuService';
import { networkService } from '../common/services/NetworkService';
import { useAppShellLogic } from '../app/dashboard/composables/useAppShellLogic';
import { useAppShellPreview } from '../app/dashboard/composables/useAppShellPreview';
import { useAppShellUiEvents } from '../app/dashboard/composables/useAppShellUiEvents';
import { useAppViewResolver } from '../app/dashboard/composables/useAppViewResolver';
import { useDatabase } from '../common/composables/useDatabase';
import { useAuthStore } from '../common/stores/authStore';

const props = defineProps<{
    contextId: string;
    f7router?: any;
    f7route?: any;
}>();

const isOnline = networkService.status;
// @ts-ignore
const buildTimestamp = typeof __BUILD_TIMESTAMP__ !== 'undefined' ? __BUILD_TIMESTAMP__ : 'Dev';

// --- 1. Core Logic & State ---
const {
    loading, layout, assignments, totalAssignments, activeView,
    searchQuery, statusFilter, isGroupingActive, groupByConfig, currentGroupLevel, appTables, appViews, appViewConfigs, appNavigation,
    filteredAssignments, filteredGroups, statusCounts, headerActions, rowActions, swipeConfig, appName, previewFields,
    loadApp, refreshData, deleteAssignment, completeAssignment, syncApp, createAssignment,
    enterGroup, navigateUp, navigateToLevel, forceShowItems, hasGroupingConfig, currentGroupField, groupPath,
    isSyncing, syncProgress, syncMessage, pendingUploadCount, currentUserRole, appVersion,
    activeSort, activeFilters, availableFields,
    isLoadingData, schemaData
} = useAppShellLogic(props.contextId);

const sortSheetOpen = ref(false);
const filterSheetOpen = ref(false);

const isSchemaEmpty = computed(() => {
    const table = schemaData.value;
    return !table || !table.fields || table.fields.length === 0;
});

const navbarActions = computed(() => {
    return headerActions.value.filter((action: any) => action.id !== 'create' && action.icon !== 'plus' && action.type !== 'create');
});

const createAction = computed(() => {
    return headerActions.value.find((action: any) => action.id === 'create' || action.icon === 'plus' || action.type === 'create');
});
const hasCreateAction = computed(() => !!createAction.value);

const triggerCreateAction = () => {
    if (createAction.value) {
        handleHeaderAction(createAction.value);
    }
};

// --- 2. Dynamic View Resolver ---
const routeViewId = computed(() => props.f7route?.query?.view);
const {
    getAppViewConfig,
    currentViewConfig,
    pageTitle
} = useAppViewResolver(appViewConfigs, appViews, layout, appName, routeViewId, activeView);

// Watch routeViewId to sync with activeView
watch(routeViewId, (newId) => {
    if (newId) {
        activeView.value = newId;
    }
}, { immediate: true });

// Auto-select first navigation tab if activeView is empty, 'default', or missing in appNavigation
watch([appNavigation, activeView], ([nav, curView]) => {
    if (nav && nav.length > 0) {
        const hasMatchingNav = nav.some((item: any) => (item.view_id || item.view) === curView);
        if (!curView || curView === 'default' || !hasMatchingNav) {
            const first = nav[0];
            const target = first?.view_id || first?.view;
            if (target) {
                activeView.value = String(target);
            }
        }
    }
}, { immediate: true });

// Synchronize activeView with Framework7 physical tab elements
watch(activeView, (newId) => {
    if (newId) {
        nextTick(() => {
            if (f7?.tab) {
                try {
                    f7.tab.show(`#view-${newId}`, false);
                } catch (err) {
                    console.warn(`[AppShell] Failed to switch tab to #view-${newId}:`, err);
                }
            }
        });
    }
}, { immediate: true });

const db = useDatabase();
const {
    previewSheetOpen,
    previewAssignment,
    previewResponseData,
    showPreview
} = useAppShellPreview(db);

const authStore = useAuthStore();

const handleShowPreview = (id: string) => {
    showPreview(id, assignments);
};

// --- 3. UI Events & Handlers ---
const {
    actionsSheetOpen,
    handleBackNav,
    openAssignment,
    executeAction,
    handleRowAction,
    handleBannerSync,
    refresh
} = useAppShellUiEvents({
    f7router: props.f7router,
    currentGroupLevel,
    routeViewId,
    pendingUploadCount,
    navigateUp,
    createAssignment,
    deleteAssignment,
    completeAssignment,
    syncApp,
    loadApp,
    db
});

const handleHeaderAction = (action: any) => {
    executeAction(action);
};

const openMenuPanel = () => {
    openMenu({
        tables: appTables.value,
        navigation: appNavigation.value,
        views: appViews.value,
        contextId: props.contextId,
        currentUserRole: currentUserRole.value,
        user: authStore.user,
        appVersion: appVersion.value,
        buildTimestamp: buildTimestamp
    });
};

// --- 4. Pagination / Local Infinite Scroll ---
const renderLimit = ref(50);
const hasMore = computed(() => filteredAssignments.value.length > renderLimit.value);

let isLoadingMore = false;
const loadMore = () => {
    if (!hasMore.value || isLoadingMore) return;
    isLoadingMore = true;
    renderLimit.value += 50;
    nextTick(() => {
        isLoadingMore = false;
    });
};

watch([statusFilter, searchQuery, activeView, () => filteredAssignments.value.length], () => {
    renderLimit.value = 50;
});
const displayedAssignments = computed(() => filteredAssignments.value.slice(0, renderLimit.value));

const getViewData = (_source?: string, isPaginated = true) => {
    return isPaginated ? displayedAssignments.value : filteredAssignments.value;
};

watch(() => forceShowItems.value, () => refreshData());

let justMounted = false;
const handleSchemaOverrideUpdate = () => {
    console.log('[AppShell] Schema override updated from Editor, reloading app configs');
    loadApp(true);
};

onMounted(() => {
    justMounted = true;
    window.addEventListener('schema-override-updated', handleSchemaOverrideUpdate);
});

onBeforeUnmount(() => {
    window.removeEventListener('schema-override-updated', handleSchemaOverrideUpdate);
    try {
        if (globalPanelOpened.value) {
            f7.panel.close('left', false);
            globalPanelOpened.value = false;
        }
        if (actionsSheetOpen.value) {
            f7.actions.close('.actions-modal.modal-in', false);
            actionsSheetOpen.value = false;
        }
    } catch {
        // Ignore errors if F7 is already torn down
    }
});

const onPageAfterIn = () => {
    if (justMounted) { 
        justMounted = false; 
        loadApp();
        return; 
    }
    refreshData();
};

const handleAppNavClick = (item: TabItem | string) => {
    if (typeof item === 'string') {
        activeView.value = item;
        return;
    }
    const targetView = item.view_id || item.view;
    if (item.type === 'view' && targetView) {
        activeView.value = String(targetView);
    } else if (item.type === 'link' && item.url) {
        window.open(String(item.url), '_blank');
    } else {
        f7.toast.show({ text: 'Unknown navigation item', closeTimeout: 1000 });
    }
};
</script>

<style>
.case-0-content-v3 {
    padding-top: calc(var(--f7-navbar-height) + var(--f7-safe-area-top, 0px)) !important;
}

/* Fix double navbar offset spacing in Case 1 and Case 2 tabs */
.tab.page-content {
    padding-top: calc(var(--f7-navbar-height) + var(--f7-safe-area-top, 0px)) !important;
}
</style>
