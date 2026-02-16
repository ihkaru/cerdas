<template>
    <f7-page name="app-shell" :page-content="false" @page:afterin="onPageAfterIn">
        <!-- Main Sidebar Panel (App Menu) -->
        <f7-panel left cover resizable v-model:opened="panelOpened">
            <AppShellMenu :tables="appTables" :navigation="appNavigation" :views="appViews"
                :current-table-id="contextId" :role="currentUserRole" :user="authStore.user" :app-version="appVersion"
                :build-timestamp="buildTimestamp" />
        </f7-panel>

        <!-- navbar -->
        <AppShellNavbar :title="appName" :actions="headerActions" @back="handleBackNav" @action="handleHeaderAction"
            @menu="openMenuPanel" />

        <!-- CASE 0: Dynamic View Logic (from Navigation) -->
        <template v-if="currentViewConfig">
            <div class="page-content">
                <AppShellSyncBanner :count="pendingUploadCount" @sync="syncApp()" />
                <AppShellStatusFilter v-model:searchQuery="searchQuery" v-model:statusFilter="statusFilter"
                    :counts="statusCounts" :active-filter-count="activeFilters.length" @open-sort="sortSheetOpen = true"
                    @open-filter="filterSheetOpen = true" />

                <!-- Animated Transition between Grouping and Leaf Views -->
                <transition name="view-fade" mode="out-in">
                    <!-- Grouping UI (Folders) -->
                    <div v-if="isGroupingActive" :key="`grouping-${currentGroupLevel}`">
                        <AppShellGroupList :key="currentGroupLevel" :groups="filteredGroups" :config="groupByConfig"
                            :current-level="currentGroupLevel" @enter-group="enterGroup"
                            @show-all="forceShowItems = true" />
                    </div>

                    <!-- Leaf Views (Assignments/Map/etc) -->
                    <div v-else key="leaf">
                        <ViewRenderer :config="currentViewConfig.config"
                            :data="getViewData((currentViewConfig!.config as any).source)" :contextId="contextId"
                            :actions="rowActions" :swipe-config="swipeConfig" @action="handleRowAction" />
                    </div>
                </transition>
            </div>
        </template>

        <!-- CASE 1: App Level Tabs (Primary Navigation) -->
        <template v-else-if="appNavigation && appNavigation.length > 0">
            <!-- TAB BAR (App Navigation) - BEFORE tabs per F7 docs -->
            <f7-toolbar position="bottom" :tabbar="true" icons labels>
                <f7-toolbar-pane>
                    <f7-link v-for="item in appNavigation" :key="`link-${item.id || item.label}`"
                        :tab-link="item.type === 'view' ? `#view-${item.view_id}` : 'true'"
                        :tab-link-active="activeView === item.view_id" @click="handleAppNavClick(item)"
                        :text="item.label" :icon-f7="item.icon || 'square'"></f7-link>
                </f7-toolbar-pane>
            </f7-toolbar>

            <!-- VIEW CONTENT - AFTER toolbar per F7 docs -->
            <f7-tabs animated>
                <!-- Dynamic Tabs from App Navigation -->
                <f7-tab v-for="item in appNavigation" :key="item.id" :id="`view-${item.view_id}`" class="page-content"
                    :tab-active="activeView === (item.view_id as string)"
                    @tab:show="activeView = (item.view_id as string)">

                    <!-- Only render content if active to save resources & prevent background map loads -->
                    <template v-if="activeView === item.view_id">
                        <AppShellSyncBanner :count="pendingUploadCount" @sync="syncApp()" />
                        <AppShellStatusFilter v-model:searchQuery="searchQuery" v-model:statusFilter="statusFilter"
                            :counts="statusCounts" :active-filter-count="activeFilters.length"
                            @open-sort="sortSheetOpen = true" @open-filter="filterSheetOpen = true" />

                        <!-- Animated Transition between Grouping and Leaf Views -->
                        <transition name="view-fade" mode="out-in">
                            <!-- Grouping UI (Folders) -->
                            <div v-if="isGroupingActive" :key="`grouping-${currentGroupLevel}`">
                                <AppShellGroupList :key="currentGroupLevel" :groups="filteredGroups"
                                    :config="groupByConfig" :current-level="currentGroupLevel" @enter-group="enterGroup"
                                    @show-all="forceShowItems = true" />
                            </div>

                            <!-- Leaf Views (Assignments/Map/etc) -->
                            <div v-else key="leaf">
                                <ViewRenderer v-if="getAppViewConfig(item.view_id)"
                                    :config="getAppViewConfig(item.view_id)"
                                    :data="getViewData((getAppViewConfig(item.view_id)!.config as any).source)"
                                    :contextId="contextId" :actions="rowActions" :swipe-config="swipeConfig"
                                    @action="handleRowAction" />
                                <div v-else class="padding text-align-center">
                                    <p>View configuration not found: {{ item.view_id }}</p>
                                </div>
                            </div>
                        </transition>
                    </template>
                </f7-tab>
            </f7-tabs>
        </template>

        <!-- CASE 2: Legacy Layout Navigation (Fallback) -->
        <template v-else-if="layout && layout.navigation">
            <!-- TAB BAR (Primary Navigation) - BEFORE tabs per F7 docs -->
            <f7-toolbar position="bottom" :tabbar="true" :scrollable="true" icons labels>
                <f7-link v-for="viewKey in layout.navigation.primary" :key="viewKey" :tab-link="`#${viewKey}`"
                    :tab-link-active="activeView === viewKey" @click="activeView = viewKey"
                    :text="layout.views[viewKey]?.title + 'ha' || viewKey"
                    :icon-f7="getIcon(layout.views[viewKey]?.type)"></f7-link>
            </f7-toolbar>

            <!-- VIEW CONTENT - AFTER toolbar per F7 docs -->
            <f7-tabs animated>
                <f7-tab v-for="viewKey in (layout?.navigation?.primary || [])" :key="viewKey" :id="viewKey"
                    :tab-active="activeView === viewKey" class="page-content">
                    <AppShellSyncBanner :count="pendingUploadCount" @sync="syncApp()" />
                    <AppShellStatusFilter v-model:searchQuery="searchQuery" v-model:statusFilter="statusFilter"
                        :counts="statusCounts" :active-filter-count="activeFilters.length"
                        @open-sort="sortSheetOpen = true" @open-filter="filterSheetOpen = true" />
                    <ViewRenderer v-if="layout.views[viewKey]" :config="layout.views[viewKey]"
                        :data="getViewData(layout.views[viewKey]?.source)" :contextId="contextId" :actions="rowActions"
                        :swipe-config="swipeConfig" />
                </f7-tab>
            </f7-tabs>
        </template>



        <!-- Standard Assignment List View (No App Navigation) -->
        <template v-else>
            <!-- Loading State -->
            <div v-if="loading" class="page-content">
                <SkeletonLoader :loading="loading" />
            </div>

            <!-- Main Content -->
            <f7-page-content v-else :ptr="!isGroupingActive" @ptr:refresh="refresh"
                class="app-content-area safe-area-bottom">

                <!-- Sync Pending Warning -->
                <AppShellSyncBanner :count="pendingUploadCount" @sync="syncApp()" />

                <!-- Search Bar & Filters -->
                <div class="search-filter-container sticky-top">
                    <AppShellStatusFilter v-model:searchQuery="searchQuery" v-model:statusFilter="statusFilter"
                        :counts="statusCounts" :active-filter-count="activeFilters.length"
                        @open-sort="sortSheetOpen = true" @open-filter="filterSheetOpen = true" />
                </div>

                <!-- Animated Transition between Grouping and Flat List -->
                <transition name="view-fade" mode="out-in">
                    <!-- CASE 1: GROUPING LIST (FOLDERS) -->
                    <div v-if="isGroupingActive" :key="`grouping-${currentGroupLevel}`">
                        <AppShellGroupList :groups="filteredGroups" @enter-group="enterGroup"
                            @show-all="forceShowItems = true" />
                    </div>

                    <!-- CASE 2: ITEM LIST (FINAL LEVEL) -->
                    <div v-else key="leaf-standard">
                        <!-- Use ViewRenderer if layout has a default view -->
                        <ViewRenderer v-if="layout?.views?.default" :config="layout.views.default"
                            :data="displayedAssignments" :contextId="contextId" :actions="rowActions"
                            :swipe-config="swipeConfig" @action="handleRowAction" />
                        <!-- Fallback to AssignmentList if no layout view defined -->
                        <AssignmentList v-else :assignments="displayedAssignments" :total-count="totalAssignments"
                            :loading="false" :row-actions="rowActions" :swipe-config="swipeConfig"
                            @open-assignment="handleShowPreview" @row-action="handleRowAction" />
                    </div>
                </transition>
            </f7-page-content>
        </template>

        <!-- Modals & Overlays -->
        <AppShellSyncOverlay :visible="isSyncing" :progress="syncProgress" :message="syncMessage" />

        <AppShellPreviewSheet v-model:opened="previewSheetOpen" :assignment="previewAssignment"
            :response="previewResponseData" :preview-fields="previewFields" @open-form="openAssignment" />

        <AppShellSortSheet v-model:opened="sortSheetOpen" v-model:modelValue="activeSort" :fields="availableFields" />

        <AppShellFilterSheet v-model:opened="filterSheetOpen" v-model:modelValue="activeFilters"
            :fields="availableFields" />



        <!-- Actions Sheet -->
        <f7-actions :opened="actionsSheetOpen" @actions:closed="actionsSheetOpen = false">
            <f7-actions-group>
                <f7-actions-label>App Actions</f7-actions-label>
                <f7-actions-button v-for="action in headerActions" :key="action.id" @click="executeAction(action)">
                    <f7-icon v-if="action.icon" :f7="action.icon" size="20" class="margin-right-half"></f7-icon>
                    {{ action.label }}
                </f7-actions-button>
            </f7-actions-group>
            <f7-actions-group>
                <f7-actions-button color="red">Cancel</f7-actions-button>
            </f7-actions-group>
            <!-- Version Indicator -->
            <f7-actions-group>
                <f7-actions-label>v{{ appVersion }} (Build {{ buildTimestamp }})</f7-actions-label>
            </f7-actions-group>
        </f7-actions>

    </f7-page>
</template>

<script setup lang="ts">
import { f7 } from 'framework7-vue';
import { computed, onMounted, ref, watch } from 'vue';

// Version
const appClientVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0';
// @ts-ignore
const buildTimestamp = typeof __BUILD_TIMESTAMP__ !== 'undefined' ? __BUILD_TIMESTAMP__ : 'Dev';
console.log(`[AppShell] v${appClientVersion} Build: ${buildTimestamp}`);

// Components
import { getIcon } from '@/app/dashboard/utils/iconHelpers';
import AppShellGroupList from '../app/dashboard/components/AppShellGroupList.vue';
import AppShellMenu from '../app/dashboard/components/AppShellMenu.vue'; // Imported
import AppShellNavbar from '../app/dashboard/components/AppShellNavbar.vue';
import AppShellPreviewSheet from '../app/dashboard/components/AppShellPreviewSheet.vue';
import AppShellStatusFilter from '../app/dashboard/components/AppShellStatusFilter.vue';
import AppShellSyncBanner from '../app/dashboard/components/AppShellSyncBanner.vue';
import AppShellSyncOverlay from '../app/dashboard/components/AppShellSyncOverlay.vue';
import AppShellFilterSheet from '../app/dashboard/components/AssignmentFilterSheet.vue';
import AssignmentList from '../app/dashboard/components/AssignmentList.vue';
import AppShellSortSheet from '../app/dashboard/components/AssignmentSortSheet.vue';
import SkeletonLoader from '../app/dashboard/components/SkeletonLoader.vue';
import { useAppShellLogic } from '../app/dashboard/composables/useAppShellLogic';
import { useAppShellPreview } from '../app/dashboard/composables/useAppShellPreview';
import { useDatabase } from '../common/composables/useDatabase';
import { useAuthStore } from '../common/stores/authStore';
import ViewRenderer from '../components/views/ViewRenderer.vue';

// Props
const props = defineProps<{
    contextId: string;
    f7router?: any;
    f7route?: any; // Ensure f7route is available
}>();

// --- 1. Core Logic & State ---
const {
    loading, layout, assignments, totalAssignments, activeView,
    searchQuery, statusFilter, isGroupingActive, groupByConfig, currentGroupLevel, appTables, appViews, appViewConfigs, appNavigation,
    filteredAssignments, filteredGroups, statusCounts, headerActions, rowActions, swipeConfig, appName, previewFields,
    loadApp, refreshData, deleteAssignment, completeAssignment, syncApp, createAssignment,
    enterGroup, navigateUp, forceShowItems,
    isSyncing, syncProgress, syncMessage, pendingUploadCount, currentUserRole, appVersion,
    activeSort, activeFilters, availableFields
} = useAppShellLogic(props.contextId);

const sortSheetOpen = ref(false);
const filterSheetOpen = ref(false);



// ============================================================================
// Computed
// ============================================================================
const routeViewId = computed(() => props.f7route?.query?.view);
const currentViewConfig = computed(() => {
    if (routeViewId.value && appViews.value.length) {
        return appViews.value.find((v: any) => v.id === routeViewId.value);
    }
    return null;
});

// Watch routeViewId to sync with activeView provided by useAppShellLogic
watch(routeViewId, (newId) => {
    if (newId) {
        activeView.value = newId;
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

// --- 3. Navigation & Router ---
const handleBackNav = () => {
    const handled = navigateUp();
    if (!handled) {
        const router = props.f7router || f7.views.main.router;

        // Check if we are in a view, go back to default form view?
        if (routeViewId.value) {
            // Go to root form without view param
            router.navigate(router.currentRoute.path.split('?')[0], { reloadCurrent: true });
            return;
        }

        router.navigate('/', {
            clearPreviousHistory: true,
            force: true,
            transition: 'f7-push-back'
        });
    }
};

const openAssignment = (id: string) => {
    const router = f7.views.main?.router || props.f7router;
    if (router) {
        router.navigate(`/assignments/${id}`);
    } else {
        f7.dialog.alert('Navigation Error: Router not found.', 'Error');
    }
};

const panelOpened = ref(false);

const openMenuPanel = () => {
    panelOpened.value = true;
};

const refresh = async (done: () => void) => {
    // Sync Pending Data First
    try {
        await syncApp();
    } catch (e) {
        console.warn('Sync on refresh failed', e);
    }
    // Then Metadata & UI
    await loadApp(true);
    done();
};



// --- 4. Pagination / Infinite Scroll (Local) ---
// Kept local as it's UI view logic
const renderLimit = ref(50);
watch(() => filteredAssignments.value.length, () => { renderLimit.value = 50; });
const displayedAssignments = computed(() => filteredAssignments.value.slice(0, renderLimit.value));

// --- 5. Action Handlers ---
const actionsSheetOpen = ref(false);

const handleHeaderAction = (action: any) => {
    executeAction(action);
};

const executeAction = (action: any) => {
    actionsSheetOpen.value = false;
    switch (action.type) {
        case 'create':
            f7.dialog.confirm('Create new assignment?', 'New', async () => {
                f7.dialog.preloader('Creating...');
                try {
                    const newId = await createAssignment();
                    f7.dialog.close();
                    openAssignment(newId);
                } catch (e: any) {
                    f7.dialog.close();
                    f7.dialog.alert(e.message, 'Error');
                }
            });
            break;
        case 'sync': syncApp(); break;
        case 'reset':
            f7.dialog.confirm(
                'Are you sure you want to delete all local data and reset the database? This cannot be undone.',
                'Reset Data',
                async () => {
                    f7.dialog.preloader('Resetting...');
                    try {
                        await db.reset?.();
                        f7.dialog.close();
                        window.location.reload();
                    } catch (e: any) {
                        f7.dialog.close();
                        f7.dialog.alert('Reset failed: ' + e.message, 'Error');
                    }
                }
            );
            break;
        default: f7.toast.show({ text: 'Not implemented', closeTimeout: 1000 });
    }
};

const handleRowAction = async ({ actionId, assignmentId }: { actionId: string, assignmentId: string }) => {
    switch (actionId) {
        case 'open': openAssignment(assignmentId); break;
        case 'edit': openAssignment(assignmentId); break;
        case 'delete':
            f7.dialog.confirm('Hapus?', 'Konfirmasi', () => deleteAssignment(assignmentId));
            break;
        case 'complete': completeAssignment(assignmentId); break;
        default: f7.toast.show({ text: 'Not implemented', closeTimeout: 1000 });
    }
};

// --- 6. Lifecycle & Helpers ---
const getViewData = (source?: string) => {
    // Default source to 'assignments' if not specified
    const targetSource = source || 'assignments';
    console.log(`[DEBUG-VIEW] getViewData called. Source: ${source} -> Used: ${targetSource}`);

    if (targetSource === 'assignments') {
        console.log(`[DEBUG-VIEW] Returning assignments. Raw: ${assignments.value?.length}, Filtered: ${filteredAssignments.value?.length}`);
        return filteredAssignments.value;
    }
    return [];
};

// Watchers
watch(() => forceShowItems.value, () => loadApp());

// Init
let justMounted = false;
onMounted(() => {
    justMounted = true;
    loadApp();
});
const onPageAfterIn = () => {
    if (justMounted) { justMounted = false; return; }
    refreshData(); // Only refresh local data, do not sync metadata
};

const getAppViewConfig = (viewId: string) => {
    // 1. Check App-level View Configs (co-located with navigation, no timing issues)
    if (appViewConfigs.value?.[viewId]) {
        return {
            id: viewId,
            type: (appViewConfigs.value[viewId] as any).type,
            config: appViewConfigs.value[viewId]
        };
    }

    // 2. Try finding in AppViews DB (future: first-class view entities)
    const dbView = appViews.value.find((v: any) => v.id === viewId);
    if (dbView) return dbView;

    // 3. Fallback to Legacy Layout Views (JSON in table version schema)
    if (layout.value?.views?.[viewId]) {
        return {
            id: viewId,
            type: layout.value.views[viewId].type,
            config: layout.value.views[viewId]
        };
    }

    return null;
};

const handleAppNavClick = (item: any) => {
    if (item.type === 'view' && item.view_id) {
        // Find if this view belongs to current form?
        // Actually, if it is in appNavigation, it is a global view.
        // We just switch activeView.
        activeView.value = item.view_id;
    } else if (item.type === 'link' && item.url) {
        window.open(item.url, '_blank');
    } else {
        f7.toast.show({ text: 'Unknown navigation item', closeTimeout: 1000 });
    }
};


</script>

<style scoped>
/* Page Content Spacing - Framework7 usually handles this with toolbar-bottom, 
   but we add overrides just to be safe if dynamic content pushes boundaries */
.page-content {
    /* Ensure bottom toolbar doesn't overlap content */
    padding-bottom: calc(var(--f7-toolbar-height) + var(--f7-safe-area-bottom) + 20px) !important;
}

/* Transitions - Fade for basic view switch */
.view-fade-enter-active,
.view-fade-leave-active {
    transition: all 0.3s ease;
}

.view-fade-enter-from,
.view-fade-leave-to {
    opacity: 0;
}

/* Drill-down slide transitions - slide from right when going deeper */
.view-fade-enter-from {
    transform: translateX(30px);
}

.view-fade-leave-to {
    transform: translateX(-30px);
}

/* Smooth transition for group items when level changes */
:deep(.group-item) {
    transition: transform 0.2s ease, opacity 0.2s ease;
}

:deep(.group-item:active) {
    transform: scale(0.98);
    opacity: 0.8;
}
</style>
```
