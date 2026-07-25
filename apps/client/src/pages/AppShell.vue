<template>
    <f7-page name="app-shell" :page-content="false" @page:afterin="onPageAfterIn">


        <!-- navbar -->
        <AppShellNavbar :title="pageTitle" :actions="navbarActions" :is-syncing="isSyncing" :show-back="true" @back="handleBackNav" @action="handleHeaderAction"
            @menu="openMenuPanel" data-inspect-target="settings" />

        <!-- CASE 1: App Level Tabs (Primary Navigation) -->
        <template v-if="appNavigation && appNavigation.length > 0">
            <!-- TAB BAR (App Navigation) - BEFORE tabs per F7 docs -->
            <f7-toolbar position="bottom" :tabbar="true" icons labels>
                <f7-link v-for="item in appNavigation" :key="`link-${item.id || item.label}`"
                    :tab-link="item.type === 'view' ? `#view-${item.view_id || item.view}` : 'true'"
                    :tab-link-active="activeView === (item.view_id || item.view)" @click="handleAppNavClick(item)"
                    :text="item.label" :icon-f7="item.icon || 'square'"
                    data-inspect-target="navigation"
                    :data-inspect-id="item.id"></f7-link>
            </f7-toolbar>

            <!-- VIEW CONTENT - AFTER toolbar per F7 docs -->
            <f7-tabs animated>
                <!-- Dynamic Tabs from App Navigation -->
                <f7-tab v-for="item in appNavigation" :key="item.id" :id="`view-${item.view_id || item.view}`" class="page-content"
                    :tab-active="activeView === (item.view_id || item.view)"
                    @tab:show="activeView = ((item.view_id || item.view) as string)"
                    infinite @infinite="loadMore">

                    <!-- Only render content if active to save resources & prevent background map loads -->
                    <template v-if="activeView === (item.view_id || item.view)">
                        <!-- Offline Banner -->
                        <div v-if="!isOnline.connected" class="offline-banner">
                            <f7-icon f7="wifi_slash" size="14"></f7-icon>
                            OFFLINE MODE
                        </div>
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

                            <!-- Skeleton while data loads -->
                            <div v-else-if="isLoadingData" key="skeleton" class="padding">
                                <f7-skeleton-block v-for="i in 5" :key="i" style="height: 80px; border-radius: 12px;"
                                    class="margin-bottom skeleton-effect-wave" />
                            </div>

                            <!-- Leaf Views (Assignments/Map/etc) -->
                            <div v-else key="leaf">
                                <ViewRenderer v-if="getAppViewConfig(String(item.view_id || item.view))"
                                    :config="getAppViewConfig(String(item.view_id || item.view))"
                                    :data="getViewData(
                                        (getAppViewConfig(String(item.view_id || item.view))!.config as any).source,
                                        getAppViewConfig(String(item.view_id || item.view))?.type !== 'map'
                                    )"
                                    :contextId="contextId" :actions="rowActions" :swipe-config="swipeConfig"
                                    @action="handleRowAction" />
                                
                                <!-- Infinite Loader -->
                                <div v-if="hasMore" :ref="setSentinelRef" class="padding text-align-center">
                                    <f7-preloader />
                                </div>

                                <!-- Only show error AFTER all loading is done — prevents flash during metadata init -->
                                <div v-else-if="!loading && !isLoadingData && !getAppViewConfig(String(item.view_id || item.view))"
                                    class="padding text-align-center text-color-gray">
                                    <f7-icon f7="exclamationmark_circle" size="48" class="opacity-30 margin-bottom" />
                                    <p>View not configured.</p>
                                    <pre v-if="currentUserRole === 'app_admin'" class="size-10">Target: {{ item.view_id || item.view }}</pre>
                                </div>
                                <!-- Skeleton fallback during any loading phase -->
                                <div v-else-if="loading || isLoadingData" class="padding">
                                    <f7-skeleton-block v-for="i in 5" :key="i"
                                        style="height: 80px; border-radius: 12px;"
                                        class="margin-bottom skeleton-effect-wave" />
                                </div>
                            </div>
                        </transition>
                    </template>
                </f7-tab>
            </f7-tabs>
        </template>

        <!-- CASE 0: Dynamic View Logic (from Navigation) -->
        <template v-else-if="currentViewConfig">
            <div class="page-content case-0-content-v3 safe-area-bottom" style="padding-top: 0px !important;" :infinite="hasMore" @infinite="loadMore">
                <!-- Offline Banner -->
                <div v-if="!isOnline.connected" class="offline-banner">
                    <f7-icon f7="wifi_slash" size="14"></f7-icon>
                    OFFLINE MODE
                </div>
                <AppShellSyncBanner :count="pendingUploadCount" @sync="syncApp()" />
                <AppShellStatusFilter v-if="!isSchemaEmpty" v-model:searchQuery="searchQuery" v-model:statusFilter="statusFilter"
                    :counts="statusCounts" :active-filter-count="activeFilters.length" @open-sort="sortSheetOpen = true"
                    @open-filter="filterSheetOpen = true"
                    data-inspect-target="views"
                    :data-view-id="currentViewConfig?.id || 'default'" />

                <!-- Animated Transition between Grouping and Leaf Views -->
                <transition name="view-fade" mode="out-in">
                    <!-- Unconfigured Empty State -->
                    <div v-if="isSchemaEmpty && !loading && !isLoadingData" key="empty-schema" class="empty-schema-container">
                        <div class="empty-schema-icon">
                            <SvgIcon name="square" :size="48" class="icon-pulse" />
                        </div>
                        <h3 class="empty-schema-title">Formulir Belum Dibuat</h3>
                        <p class="empty-schema-desc">
                            Silakan tambahkan kolom (fields) baru di editor sebelah kiri untuk mulai merancang pratinjau formulir Anda di sini.
                        </p>
                    </div>

                    <!-- Grouping UI (Folders) -->
                    <div v-else-if="isGroupingActive" :key="`grouping-${currentGroupLevel}`">
                        <AppShellGroupList :key="currentGroupLevel" :groups="filteredGroups" :config="groupByConfig"
                            :current-level="currentGroupLevel" @enter-group="enterGroup"
                            @show-all="forceShowItems = true" />
                    </div>

                    <!-- Skeleton while data loads -->
                    <div v-else-if="isLoadingData" key="skeleton" class="padding">
                        <f7-skeleton-block v-for="i in 5" :key="i" style="height: 80px; border-radius: 12px;"
                            class="margin-bottom skeleton-effect-wave" />
                    </div>

                    <!-- Leaf Views (Assignments/Map/etc) -->
                    <div v-else-if="currentViewConfig && currentViewConfig.config" key="leaf">
                                    <ViewRenderer :config="currentViewConfig.config"
                                        :data="getViewData(
                                            (currentViewConfig.config as any).source,
                                            currentViewConfig.type !== 'map'
                                        )" :contextId="contextId"
                                        :actions="rowActions" :swipe-config="swipeConfig" @action="handleRowAction" />
                        
                        <!-- Infinite Loader -->
                        <div v-if="hasMore" :ref="setSentinelRef" class="padding text-align-center">
                            <f7-preloader />
                        </div>
                    </div>

                    <!-- Not Found / Fallback if no view found -->
                    <div v-else key="empty" class="padding text-align-center">
                        <f7-icon f7="search" size="48" color="gray" />
                        <p class="text-color-gray">Konfigurasi view tidak ditemukan</p>
                    </div>
                </transition>
            </div>
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
            <f7-page-content v-else :ptr="!isGroupingActive && !isSchemaEmpty" @ptr:refresh="refresh"
                :infinite="hasMore" @infinite="loadMore"
                class="app-content-area safe-area-bottom">

                <!-- Offline Banner -->
                <div v-if="!isOnline.connected" class="offline-banner">
                    <f7-icon f7="wifi_slash" size="14"></f7-icon>
                    OFFLINE MODE
                </div>

                <!-- Sync Pending Warning -->
                <AppShellSyncBanner :count="pendingUploadCount" @sync="syncApp()" />

                <!-- Search Bar & Filters -->
                <div v-if="!isSchemaEmpty" class="search-filter-container sticky-top"
                    data-inspect-target="views"
                    :data-view-id="activeView || 'default'">
                    <AppShellStatusFilter v-model:searchQuery="searchQuery" v-model:statusFilter="statusFilter"
                        :counts="statusCounts" :active-filter-count="activeFilters.length"
                        @open-sort="sortSheetOpen = true" @open-filter="filterSheetOpen = true" />
                </div>

                <!-- Animated Transition between Grouping and Flat List -->
                <transition name="view-fade" mode="out-in">
                    <!-- Unconfigured Empty State -->
                    <div v-if="isSchemaEmpty && !loading && !isLoadingData" key="empty-schema" class="empty-schema-container">
                        <div class="empty-schema-icon">
                            <SvgIcon name="square" :size="48" class="icon-pulse" />
                        </div>
                        <h3 class="empty-schema-title">Formulir Belum Dibuat</h3>
                        <p class="empty-schema-desc">
                            Silakan tambahkan kolom (fields) baru di editor sebelah kiri untuk mulai merancang pratinjau formulir Anda di sini.
                        </p>
                    </div>

                    <!-- CASE 1: GROUPING LIST (FOLDERS) -->
                    <div v-else-if="isGroupingActive" :key="`grouping-${currentGroupLevel}`">
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
                            :loading="isLoadingData" :row-actions="rowActions" :swipe-config="swipeConfig"
                            @open-assignment="handleShowPreview" @row-action="handleRowAction" />

                        <!-- Infinite Loader -->
                        <div v-if="hasMore" :ref="setSentinelRef" class="padding text-align-center">
                            <f7-preloader />
                        </div>
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

        <!-- Floating Action Button (FAB) for Create/Add Assignment -->
        <f7-fab v-if="hasCreateAction && !isSchemaEmpty" position="right-bottom" slot="fixed" 
            :class="['app-fab', 'premium-fab', { 'fab-with-toolbar': appNavigation && appNavigation.length > 0 }]" 
            @click="triggerCreateAction">
            <SvgIcon name="plus" :size="24" />
        </f7-fab>
    </f7-page>
</template>

<script setup lang="ts">
import { f7 } from 'framework7-vue';
import { computed, nextTick, onBeforeUnmount, onMounted, onUnmounted, ref, watch } from 'vue';

// Version
const appClientVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0';
// @ts-ignore
const buildTimestamp = typeof __BUILD_TIMESTAMP__ !== 'undefined' ? __BUILD_TIMESTAMP__ : 'Dev';
console.warn(`[AppShell] v${appClientVersion} Build: ${buildTimestamp}`);

// Components
import { getIcon } from '@/app/dashboard/utils/iconHelpers';
import AppShellGroupList from '../app/dashboard/components/AppShellGroupList.vue';
import { openMenu, globalPanelOpened } from '../common/services/menuService';
import SvgIcon from '@/components/common/SvgIcon.vue';
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
import { networkService } from '../common/services/NetworkService';

const isOnline = networkService.status;

// Props

const props = defineProps<{
    contextId: string;
    f7router?: any; // F7 router has no official TS type
    f7route?: any;  // F7 route has no official TS type
}>();

// --- 1. Core Logic & State ---
const {
    loading, layout, assignments, totalAssignments, activeView,
    searchQuery, statusFilter, isGroupingActive, groupByConfig, currentGroupLevel, appTables, appViews, appViewConfigs, appNavigation,
    filteredAssignments, filteredGroups, statusCounts, headerActions, rowActions, swipeConfig, appName, previewFields,
    loadApp, refreshData, deleteAssignment, completeAssignment, syncApp, createAssignment,
    enterGroup, navigateUp, forceShowItems,
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



// ============================================================================
// Computed
// ============================================================================
const routeViewId = computed(() => props.f7route?.query?.view);
const currentViewConfig = computed(() => {
    // If no view is selected in the URL, default to 'default'
    const viewId = routeViewId.value || 'default';

    // 1. Check App-level View Configs (co-located with navigation)
    if (appViewConfigs.value && appViewConfigs.value[viewId]) {
        return {
            id: viewId,
            label: (appViewConfigs.value[viewId] as any).title || (appViewConfigs.value[viewId] as any).name || (appViewConfigs.value[viewId] as any).label || viewId,
            type: (appViewConfigs.value[viewId] as any).type,
            config: appViewConfigs.value[viewId]
        };
    }

    // 2. Try finding in AppViews DB array (fallback)
    const dbView = appViews.value.find((v: any) => v.id === viewId || v.view_id === viewId);
    if (dbView) {
        return {
            id: viewId,
            label: dbView.title || dbView.label || dbView.name || viewId,
            type: dbView.type,
            config: dbView.config || dbView // Support both wrapped and direct
        };
    }

    // 3. Fallback to Legacy Layout Views
    if (layout.value?.views?.[viewId]) {
        return {
            id: viewId,
            label: layout.value.views[viewId].title || viewId,
            type: layout.value.views[viewId].type,
            config: layout.value.views[viewId]
        };
    }

    // 4. If viewId is 'default' and there are no views configured at all, generate a dynamic fallback view config
    const hasAnyViews = (appViewConfigs.value && Object.keys(appViewConfigs.value).length > 0) || 
                         (appViews.value && appViews.value.length > 0) ||
                         (layout.value?.views && Object.keys(layout.value.views).length > 0);
                         
    if (viewId === 'default' && !hasAnyViews) {
        return {
            id: 'default',
            label: appName.value || 'Assignments',
            type: 'deck',
            config: {
                type: 'deck',
                title: appName.value || 'Assignments',
                groupBy: [],
                deck: {
                    primaryHeaderField: 'name',
                    secondaryHeaderField: 'description',
                    imageField: null,
                    imageShape: 'square'
                },
                actions: ['open', 'delete']
            }
        };
    }

    return null;
});

// Watch routeViewId to sync with activeView provided by useAppShellLogic
watch(routeViewId, (newId) => {
    activeView.value = newId || 'default';
}, { immediate: true });

const pageTitle = computed(() => {
    // 1. If we have an active view, use its title
    if (currentViewConfig.value) {
        // @ts-ignore
        return currentViewConfig.value.label || currentViewConfig.value.title || appName.value;
    }

    // 2. If we are in the legacy layout fallback
    if (layout.value && layout.value.views && activeView.value) {
        const legacyView = layout.value.views[activeView.value];
        if (legacyView) return legacyView.title || appName.value;
    }

    // 3. Fallback to App Name
    return appName.value;
});
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

        // If we are at the root level of grouping/folders, go back to the Apps Catalog (/)
        if (currentGroupLevel.value === 0) {
            router.navigate('/', {
                clearPreviousHistory: true,
                force: true,
                transition: 'f7-push-back'
            });
            return;
        }

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

// IntersectionObserver Sentinel for Infinite Scroll
let observer: IntersectionObserver | null = null;
const setupObserver = (el: HTMLElement | null) => {
    if (observer) {
        observer.disconnect();
        observer = null;
    }
    if (!el) return;

    observer = new IntersectionObserver((entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
            loadMore();
        }
    }, {
        rootMargin: '150px',
    });

    observer.observe(el);
};

const setSentinelRef = (el: any) => {
    const domEl = el?.$el || el;
    if (domEl instanceof HTMLElement) {
        setupObserver(domEl);
    } else if (!domEl) {
        setupObserver(null);
    }
};

onUnmounted(() => {
    if (observer) {
        observer.disconnect();
        observer = null;
    }
});

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
                    } catch (e: unknown) {
                        f7.dialog.close();
                        f7.dialog.alert('Reset failed: ' + (e instanceof Error ? e.message : String(e)), 'Error');
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
const getViewData = (_source?: string, isPaginated = true) => {
    // Both 'assignments' and custom source names (like 'export-survey-final-summary')
    // should return the data managed by AppShellLogic, because AppShellLogic 
    // already switched the context to the correct table.
    return isPaginated ? displayedAssignments.value : filteredAssignments.value;
};

// Watchers
// NOTE: forceShowItems only changes UI state (grouping → flat list), so only refreshData() is needed.
// Using loadApp() here was causing a full metadata+schema reload, resulting in 0 assignments on second open.
watch(() => forceShowItems.value, () => refreshData());

// Init
let justMounted = false;
const handleSchemaOverrideUpdate = () => {
    console.log('[AppShell] Schema override updated from Editor, reloading app configs');
    loadApp(true);
};

onMounted(() => {
    justMounted = true;
    window.addEventListener('schema-override-updated', handleSchemaOverrideUpdate);
});

// Critical: close any open F7 overlays BEFORE the component is destroyed.
// F7 Panel/Actions call onClosed via a CSS transition callback that fires AFTER the DOM is gone,
// causing `this.app.panel` to be undefined and breaking navigation.
onBeforeUnmount(() => {
    window.removeEventListener('schema-override-updated', handleSchemaOverrideUpdate);
    try {
        if (globalPanelOpened.value) {
            f7.panel.close('left', false); // false = no animation, immediate close
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
    refreshData(); // Only refresh local data, do not sync metadata
};

const getAppViewConfig = (viewId: string) => {
    // 1. Check App-level View Configs (co-located with navigation, no timing issues)
    if (appViewConfigs.value?.[viewId]) {
        return {
            id: viewId,
            type: (appViewConfigs.value[viewId] as Record<string, unknown>).type,
            config: appViewConfigs.value[viewId]
        };
    }

    // 2. Try finding in AppViews DB (future: first-class view entities)
    const dbView = appViews.value.find((v: Record<string, unknown>) => v.id === viewId);
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

const handleAppNavClick = (item: Record<string, unknown>) => {
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

<style scoped>
/* Offline Banner Styling */
.offline-banner {
    background: var(--f7-color-orange);
    color: white;
    text-align: center;
    font-size: 11px;
    font-weight: bold;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    letter-spacing: 0.5px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
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

/* Empty Schema Placeholder */
.empty-schema-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 24px;
    height: 60vh;
    text-align: center;
    box-sizing: border-box;
}

.empty-schema-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: rgba(33, 150, 243, 0.05);
    color: var(--f7-theme-color, #2196f3);
    margin-bottom: 20px;
}

.empty-schema-title {
    font-size: 17px;
    font-weight: 600;
    color: #111827;
    margin: 0 0 6px 0;
}

.empty-schema-desc {
    font-size: 13px;
    color: #6b7280;
    line-height: 1.5;
    max-width: 260px;
    margin: 0;
}

.icon-pulse {
    animation: icon-pulse-anim 2s infinite ease-in-out;
}

@keyframes icon-pulse-anim {
    0% { transform: scale(1); opacity: 0.8; }
    50% { transform: scale(1.08); opacity: 1; }
    100% { transform: scale(1); opacity: 0.8; }
}

/* Base FAB token — shared with AssignmentDetail.vue */
.app-fab {
    transition: transform 0.18s ease, box-shadow 0.18s ease !important;
}

.app-fab:active {
    transform: scale(0.9) !important;
}

/* Create FAB: primary action, strong blue shadow */
/* Use --f7-fab-box-shadow so shadow applies to .fab > a (circular), not outer div */
/* Positioning: same formula as .global-validation-fab in AssignmentDetail — 16px + safe area */
.premium-fab {
    --f7-fab-bg-color: var(--f7-theme-color, #2196f3);
    --f7-fab-pressed-bg-color: #1976d2;
    --f7-fab-box-shadow: 0 4px 14px rgba(33, 150, 243, 0.4);
    bottom: calc(var(--f7-safe-area-bottom, env(safe-area-inset-bottom, 0px)) + 16px) !important;
    right: calc(var(--f7-safe-area-right, env(safe-area-inset-right, 0px)) + 16px) !important;
}

.premium-fab.fab-with-toolbar {
    bottom: calc(var(--f7-safe-area-bottom, env(safe-area-inset-bottom, 0px)) + 56px + 16px) !important;
}

.premium-fab:active {
    --f7-fab-box-shadow: 0 2px 6px rgba(33, 150, 243, 0.2);
}
</style>

<style>
.case-0-content-v3 {
    padding-top: calc(var(--f7-navbar-height) + var(--f7-safe-area-top, 0px)) !important;
}

/* Fix double navbar offset spacing in Case 1 and Case 2 tabs */
.tab.page-content {
    padding-top: 0 !important;
}
</style>
