<template>
    <div class="app-shell-content-wrapper">
        <!-- CASE 1: App Level Tabs (Primary Navigation) -->
        <template v-if="appNavigation && appNavigation.length > 0">
            <f7-tabs animated>
                <f7-tab v-for="item in appNavigation" :key="item.id" :id="`view-${item.view_id || item.view}`"
                    class="page-content" :tab-active="activeView === (item.view_id || item.view)"
                    @tab:show="$emit('update:activeView', String(item.view_id || item.view))"
                    infinite @infinite="$emit('load-more')">
                    <AppShellViewContainer v-if="activeView === (item.view_id || item.view)"
                        :is-online-connected="isOnlineConnected"
                        :pending-upload-count="pendingUploadCount"
                        :is-schema-empty="isSchemaEmpty"
                        :inspect-view-id="String(item.view_id || item.view)"
                        :search-query="searchQuery"
                        :status-filter="statusFilter"
                        :status-counts="statusCounts"
                        :active-filter-count="activeFilterCount"
                        :has-grouping-config="hasGroupingConfig"
                        :force-show-items="forceShowItems"
                        :total-assignments="totalAssignments"
                        :is-grouping-active="isGroupingActive"
                        :current-group-level="currentGroupLevel"
                        :filtered-groups="filteredGroups"
                        :group-by-config="groupByConfig"
                        :group-path="groupPath"
                        :current-group-field="currentGroupField"
                        :is-loading-data="isLoadingData"
                        :loading="loading"
                        :view-config="getAppViewConfig(String(item.view_id || item.view))"
                        :view-data="getViewData(
                            (getAppViewConfig(String(item.view_id || item.view))?.config as any)?.source,
                            getAppViewConfig(String(item.view_id || item.view))?.type !== 'map'
                        )"
                        :context-id="contextId"
                        :row-actions="rowActions"
                        :swipe-config="swipeConfig"
                        :has-more="hasMore"
                        :current-user-role="currentUserRole"
                        @update:search-query="$emit('update:searchQuery', $event)"
                        @update:status-filter="$emit('update:statusFilter', $event)"
                        @update:force-show-items="$emit('update:forceShowItems', $event)"
                        @banner-sync="$emit('banner-sync')"
                        @open-sort="$emit('open-sort')"
                        @open-filter="$emit('open-filter')"
                        @enter-group="$emit('enter-group', $event)"
                        @navigate-up="$emit('navigate-up')"
                        @navigate-level="$emit('navigate-level', $event)"
                        @row-action="$emit('row-action', $event)"
                        @open-assignment="$emit('open-assignment', $event)"
                        @load-more="$emit('load-more')" />
                </f7-tab>
            </f7-tabs>
        </template>

        <!-- CASE 0: Dynamic View Logic (from Navigation or Query Param) -->
        <template v-else-if="currentViewConfig">
            <div class="page-content case-0-content-v3 safe-area-bottom" style="padding-top: 0px !important;" :infinite="hasMore" @infinite="$emit('load-more')">
                <AppShellViewContainer
                    :is-online-connected="isOnlineConnected"
                    :pending-upload-count="pendingUploadCount"
                    :is-schema-empty="isSchemaEmpty"
                    :inspect-view-id="currentViewConfig?.id || 'default'"
                    :search-query="searchQuery"
                    :status-filter="statusFilter"
                    :status-counts="statusCounts"
                    :active-filter-count="activeFilterCount"
                    :has-grouping-config="hasGroupingConfig"
                    :force-show-items="forceShowItems"
                    :total-assignments="totalAssignments"
                    :is-grouping-active="isGroupingActive"
                    :current-group-level="currentGroupLevel"
                    :filtered-groups="filteredGroups"
                    :group-by-config="groupByConfig"
                    :group-path="groupPath"
                    :current-group-field="currentGroupField"
                    :is-loading-data="isLoadingData"
                    :loading="loading"
                    :view-config="currentViewConfig"
                    :view-data="getViewData(
                        (currentViewConfig.config as any)?.source,
                        currentViewConfig.type !== 'map'
                    )"
                    :context-id="contextId"
                    :row-actions="rowActions"
                    :swipe-config="swipeConfig"
                    :has-more="hasMore"
                    :current-user-role="currentUserRole"
                    @update:search-query="$emit('update:searchQuery', $event)"
                    @update:status-filter="$emit('update:statusFilter', $event)"
                    @update:force-show-items="$emit('update:forceShowItems', $event)"
                    @banner-sync="$emit('banner-sync')"
                    @open-sort="$emit('open-sort')"
                    @open-filter="$emit('open-filter')"
                    @enter-group="$emit('enter-group', $event)"
                    @navigate-up="$emit('navigate-up')"
                    @navigate-level="$emit('navigate-level', $event)"
                    @row-action="$emit('row-action', $event)"
                    @open-assignment="$emit('open-assignment', $event)"
                    @load-more="$emit('load-more')" />
            </div>
        </template>

        <!-- CASE 2: Legacy Layout Navigation (Fallback) -->
        <template v-else-if="layout && layout.navigation">
            <f7-tabs animated>
                <f7-tab v-for="viewKey in (layout?.navigation?.primary || [])" :key="viewKey" :id="viewKey"
                    :tab-active="activeView === viewKey" class="page-content">
                    <AppShellViewContainer
                        :is-online-connected="isOnlineConnected"
                        :pending-upload-count="pendingUploadCount"
                        :is-schema-empty="isSchemaEmpty"
                        :inspect-view-id="viewKey"
                        :search-query="searchQuery"
                        :status-filter="statusFilter"
                        :status-counts="statusCounts"
                        :active-filter-count="activeFilterCount"
                        :has-grouping-config="hasGroupingConfig"
                        :force-show-items="forceShowItems"
                        :total-assignments="totalAssignments"
                        :is-grouping-active="isGroupingActive"
                        :current-group-level="currentGroupLevel"
                        :filtered-groups="filteredGroups"
                        :group-by-config="groupByConfig"
                        :group-path="groupPath"
                        :current-group-field="currentGroupField"
                        :is-loading-data="isLoadingData"
                        :loading="loading"
                        :view-config="layout.views?.[viewKey]"
                        :view-data="getViewData(layout.views?.[viewKey]?.source)"
                        :context-id="contextId"
                        :row-actions="rowActions"
                        :swipe-config="swipeConfig"
                        :has-more="hasMore"
                        :current-user-role="currentUserRole"
                        @update:search-query="$emit('update:searchQuery', $event)"
                        @update:status-filter="$emit('update:statusFilter', $event)"
                        @update:force-show-items="$emit('update:forceShowItems', $event)"
                        @banner-sync="$emit('banner-sync')"
                        @open-sort="$emit('open-sort')"
                        @open-filter="$emit('open-filter')"
                        @enter-group="$emit('enter-group', $event)"
                        @navigate-up="$emit('navigate-up')"
                        @navigate-level="$emit('navigate-level', $event)"
                        @row-action="$emit('row-action', $event)"
                        @open-assignment="$emit('open-assignment', $event)"
                        @load-more="$emit('load-more')" />
                </f7-tab>
            </f7-tabs>
        </template>

        <!-- Standard Assignment List View (No App Navigation) -->
        <template v-else>
            <div v-if="loading" class="page-content">
                <SkeletonLoader :loading="loading" />
            </div>
            <f7-page-content v-else :ptr="!isGroupingActive && !isSchemaEmpty" @ptr:refresh="$emit('refresh', $event)"
                :infinite="hasMore" @infinite="$emit('load-more')" class="app-content-area safe-area-bottom">
                <AppShellViewContainer
                    :is-online-connected="isOnlineConnected"
                    :pending-upload-count="pendingUploadCount"
                    :is-schema-empty="isSchemaEmpty"
                    :inspect-view-id="activeView || 'default'"
                    :search-query="searchQuery"
                    :status-filter="statusFilter"
                    :status-counts="statusCounts"
                    :active-filter-count="activeFilterCount"
                    :has-grouping-config="hasGroupingConfig"
                    :force-show-items="forceShowItems"
                    :total-assignments="totalAssignments"
                    :is-grouping-active="isGroupingActive"
                    :current-group-level="currentGroupLevel"
                    :filtered-groups="filteredGroups"
                    :group-by-config="groupByConfig"
                    :group-path="groupPath"
                    :current-group-field="currentGroupField"
                    :is-loading-data="isLoadingData"
                    :loading="loading"
                    :view-config="layout?.views?.default"
                    :fallback-list="!layout?.views?.default"
                    :view-data="displayedAssignments"
                    :context-id="contextId"
                    :row-actions="rowActions"
                    :swipe-config="swipeConfig"
                    :has-more="hasMore"
                    :current-user-role="currentUserRole"
                    @update:search-query="$emit('update:searchQuery', $event)"
                    @update:status-filter="$emit('update:statusFilter', $event)"
                    @update:force-show-items="$emit('update:forceShowItems', $event)"
                    @banner-sync="$emit('banner-sync')"
                    @open-sort="$emit('open-sort')"
                    @open-filter="$emit('open-filter')"
                    @enter-group="$emit('enter-group', $event)"
                    @navigate-up="$emit('navigate-up')"
                    @navigate-level="$emit('navigate-level', $event)"
                    @row-action="$emit('row-action', $event)"
                    @open-assignment="$emit('open-preview', $event)"
                    @load-more="$emit('load-more')" />
            </f7-page-content>
        </template>
    </div>
</template>

<script setup lang="ts">
import AppShellViewContainer from './AppShellViewContainer.vue';
import SkeletonLoader from './SkeletonLoader.vue';

defineProps<{
    appNavigation?: any[];
    currentViewConfig?: any;
    layout?: any;
    activeView: string;
    loading: boolean;
    isLoadingData: boolean;
    isOnlineConnected: boolean;
    pendingUploadCount: number;
    isSchemaEmpty: boolean;
    searchQuery: string;
    statusFilter: string;
    statusCounts: { all: number; assigned: number; in_progress: number; synced: number; } & Record<string, number>;
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
    contextId: string;
    rowActions: any[];
    swipeConfig?: any;
    hasMore: boolean;
    currentUserRole?: string;
    displayedAssignments: any[];
    getAppViewConfig: (viewId: string) => any;
    getViewData: (source?: string, isPaginated?: boolean) => any[];
}>();

defineEmits<{
    (e: 'update:activeView', val: string): void;
    (e: 'update:searchQuery', val: string): void;
    (e: 'update:statusFilter', val: string): void;
    (e: 'update:forceShowItems', val: boolean): void;
    (e: 'banner-sync'): void;
    (e: 'open-sort'): void;
    (e: 'open-filter'): void;
    (e: 'enter-group', group: any): void;
    (e: 'navigate-up'): void;
    (e: 'navigate-level', idx: number): void;
    (e: 'row-action', action: any): void;
    (e: 'open-assignment', id: string): void;
    (e: 'open-preview', id: string): void;
    (e: 'load-more'): void;
    (e: 'refresh', done: () => void): void;
}>();
</script>

<style scoped>
.app-shell-content-wrapper {
    width: 100%;
    height: 100%;
}
</style>
