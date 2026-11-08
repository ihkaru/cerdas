<template>
    <div class="app-view-container">
        <!-- Offline Banner -->
        <AppShellOfflineBanner :connected="isOnlineConnected" />

        <!-- Sync Pending Warning -->
        <AppShellSyncBanner :count="pendingUploadCount" @sync="$emit('banner-sync')" />

        <!-- Search Bar & Filters -->
        <div v-if="!isSchemaEmpty" class="search-filter-container sticky-top"
            data-inspect-target="views"
            :data-view-id="inspectViewId || 'default'">
            <AppShellStatusFilter :search-query="searchQuery" :status-filter="statusFilter"
                :counts="statusCounts" :active-filter-count="activeFilterCount"
                :has-grouping="hasGroupingConfig" :force-show-items="forceShowItems"
                @update:search-query="$emit('update:searchQuery', $event)"
                @update:status-filter="$emit('update:statusFilter', $event)"
                @toggle-grouping="$emit('update:forceShowItems', !forceShowItems)"
                @open-sort="$emit('open-sort')"
                @open-filter="$emit('open-filter')" />
        </div>

        <!-- Flat Mode Active Banner -->
        <AppShellFlatAlertBar v-if="hasGroupingConfig && forceShowItems"
            :total-assignments="totalAssignments"
            @return-to-folder="$emit('update:forceShowItems', false)" />

        <!-- Animated Transition between Grouping and Leaf Views -->
        <transition name="view-fade" mode="out-in">
            <!-- Unconfigured Empty State -->
            <AppShellEmptySchema v-if="isSchemaEmpty && !loading && !isLoadingData" key="empty-schema" />

            <!-- Grouping UI (Folders) -->
            <div v-else-if="isGroupingActive" :key="`grouping-${currentGroupLevel}`">
                <AppShellGroupList :key="currentGroupLevel" :groups="filteredGroups"
                    :config="groupByConfig" :current-level="currentGroupLevel"
                    :group-path="groupPath" :current-field="currentGroupField"
                    :total-count="totalAssignments"
                    @enter-group="$emit('enter-group', $event)"
                    @show-all="$emit('update:forceShowItems', true)"
                    @navigate-up="$emit('navigate-up')"
                    @navigate-level="$emit('navigate-level', $event)" />
            </div>

            <!-- Skeleton while data loads -->
            <div v-else-if="isLoadingData" key="skeleton" class="padding">
                <f7-skeleton-block v-for="i in 5" :key="i" style="height: 80px; border-radius: 12px;"
                    class="margin-bottom skeleton-effect-wave" />
            </div>

            <!-- Leaf Views (Assignments/Map/etc) -->
            <div v-else key="leaf">
                <ViewRenderer v-if="viewConfig"
                    :config="viewConfig.config || viewConfig"
                    :data="viewData"
                    :context-id="contextId"
                    :actions="rowActions"
                    :swipe-config="swipeConfig"
                    @action="$emit('row-action', $event)" />

                <!-- Fallback to AssignmentList if no layout view defined -->
                <AssignmentList v-else-if="fallbackList"
                    :assignments="viewData"
                    :total-count="totalAssignments"
                    :loading="isLoadingData"
                    :row-actions="rowActions"
                    :swipe-config="swipeConfig"
                    @open-assignment="$emit('open-assignment', $event)"
                    @row-action="$emit('row-action', $event)" />

                <!-- Infinite Loader -->
                <div v-if="hasMore" :ref="setSentinelRef" class="padding text-align-center">
                    <f7-preloader />
                </div>

                <!-- Error: View not configured -->
                <div v-else-if="!loading && !isLoadingData && !viewConfig && !fallbackList"
                    class="padding text-align-center text-color-gray">
                    <f7-icon f7="exclamationmark_circle" size="48" class="opacity-30 margin-bottom" />
                    <p>View not configured.</p>
                    <pre v-if="currentUserRole === 'app_admin'" class="size-10">Target: {{ inspectViewId }}</pre>
                </div>

                <!-- Skeleton fallback during loading phase -->
                <div v-else-if="loading || isLoadingData" class="padding">
                    <f7-skeleton-block v-for="i in 5" :key="i"
                        style="height: 80px; border-radius: 12px;"
                        class="margin-bottom skeleton-effect-wave" />
                </div>
            </div>
        </transition>
    </div>
</template>

<script setup lang="ts">
import { onUnmounted } from 'vue';
import AppShellEmptySchema from './AppShellEmptySchema.vue';
import AppShellFlatAlertBar from './AppShellFlatAlertBar.vue';
import AppShellGroupList from './AppShellGroupList.vue';
import AppShellOfflineBanner from './AppShellOfflineBanner.vue';
import AppShellStatusFilter from './AppShellStatusFilter.vue';
import AppShellSyncBanner from './AppShellSyncBanner.vue';
import AssignmentList from './AssignmentList.vue';
import ViewRenderer from '@/components/views/ViewRenderer.vue';

const props = withDefaults(defineProps<{
    isOnlineConnected: boolean;
    pendingUploadCount: number;
    isSchemaEmpty: boolean;
    inspectViewId?: string;
    searchQuery: string;
    statusFilter: string;
    statusCounts: Record<string, number>;
    activeFilterCount: number;
    hasGroupingConfig: boolean;
    forceShowItems: boolean;
    totalAssignments: number;
    isGroupingActive: boolean;
    currentGroupLevel: number;
    filteredGroups: any[];
    groupByConfig: any;
    groupPath: string[];
    currentGroupField: string;
    isLoadingData: boolean;
    loading: boolean;
    viewConfig?: any;
    fallbackList?: boolean;
    viewData: any[];
    contextId: string;
    rowActions: any[];
    swipeConfig?: any;
    hasMore: boolean;
    currentUserRole?: string;
}>(), {
    inspectViewId: 'default',
    viewConfig: null,
    fallbackList: false,
    swipeConfig: () => ({}),
    currentUserRole: ''
});

const emit = defineEmits<{
    (e: 'banner-sync'): void;
    (e: 'update:searchQuery', val: string): void;
    (e: 'update:statusFilter', val: string): void;
    (e: 'update:forceShowItems', val: boolean): void;
    (e: 'open-sort'): void;
    (e: 'open-filter'): void;
    (e: 'enter-group', item: any): void;
    (e: 'navigate-up'): void;
    (e: 'navigate-level', index: number): void;
    (e: 'row-action', action: any): void;
    (e: 'open-assignment', id: string): void;
    (e: 'load-more'): void;
}>();

// Sentinel for infinite scrolling
let observer: IntersectionObserver | null = null;
const setupObserver = (el: HTMLElement | null) => {
    if (observer) {
        observer.disconnect();
        observer = null;
    }
    if (!el) return;

    observer = new IntersectionObserver((entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting && props.hasMore) {
            emit('load-more');
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
</script>

<style scoped>
.app-view-container {
    width: 100%;
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
