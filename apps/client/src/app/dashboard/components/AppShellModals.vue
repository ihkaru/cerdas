<template>
    <!-- Sync Overlay -->
    <AppShellSyncOverlay :visible="isSyncing" :progress="syncProgress" :message="syncMessage" />

    <!-- Preview Sheet -->
    <AppShellPreviewSheet :opened="previewSheetOpen" :assignment="previewAssignment"
        :response="previewResponseData" :preview-fields="previewFields"
        @update:opened="$emit('update:previewSheetOpen', $event)"
        @open-form="$emit('open-assignment', $event)" />

    <!-- Sort Sheet -->
    <AppShellSortSheet :opened="sortSheetOpen" :model-value="activeSort" :fields="availableFields"
        @update:opened="$emit('update:sortSheetOpen', $event)"
        @update:model-value="$emit('update:activeSort', $event)" />

    <!-- Filter Sheet -->
    <AppShellFilterSheet :opened="filterSheetOpen" :model-value="activeFilters" :fields="availableFields"
        @update:opened="$emit('update:filterSheetOpen', $event)"
        @update:model-value="$emit('update:activeFilters', $event)" />
</template>

<script setup lang="ts">
import AppShellFilterSheet from './AssignmentFilterSheet.vue';
import AppShellPreviewSheet from './AppShellPreviewSheet.vue';
import AppShellSortSheet from './AssignmentSortSheet.vue';
import AppShellSyncOverlay from './AppShellSyncOverlay.vue';

defineProps<{
    isSyncing: boolean;
    syncProgress: number;
    syncMessage: string;
    previewSheetOpen: boolean;
    previewAssignment: any;
    previewResponseData: any;
    previewFields: any[];
    sortSheetOpen: boolean;
    activeSort: any;
    filterSheetOpen: boolean;
    activeFilters: any[];
    availableFields: any[];
}>();

defineEmits<{
    (e: 'update:previewSheetOpen', val: boolean): void;
    (e: 'open-assignment', id: string): void;
    (e: 'update:sortSheetOpen', val: boolean): void;
    (e: 'update:activeSort', val: any): void;
    (e: 'update:filterSheetOpen', val: boolean): void;
    (e: 'update:activeFilters', val: any[]): void;
}>();
</script>
