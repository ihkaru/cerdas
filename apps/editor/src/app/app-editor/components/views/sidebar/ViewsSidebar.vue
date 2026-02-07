<template>
    <div class="views-sidebar">
        <!-- Section: Views -->
        <f7-block-title class="!mt-4 !mb-2 flex justify-between items-center pr-4">
            <span>App Views</span>
            <f7-link icon-f7="plus" icon-size="18" @click="$emit('create-view')" />
        </f7-block-title>
        <f7-list class="flex-shrink-0 !my-0 border-b border-gray-200">
            <f7-list-item v-for="(view, key) in views" :key="key" :title="view.title || key" :subtitle="view.type"
                link="#" :class="{ 'bg-blue-50': selectedKey === key && configMode === 'view' }"
                @click="$emit('select-view', key as string)">
                <template #media>
                    <f7-icon :f7="getViewIcon(view ? view.type : '')" size="20" />
                </template>
            </f7-list-item>
        </f7-list>

        <!-- Section: Navigation -->
        <f7-block-title class="!mt-4 !mb-2 flex justify-between items-center pr-4">
            <span>Bottom Navigation</span>
            <f7-link icon-f7="plus" icon-size="18" @click="$emit('create-nav')" />
        </f7-block-title>
        <f7-list sortable @sortable:sort="onSort" class="flex-1 overflow-y-auto !my-0">
            <f7-list-item v-for="(item, index) in navigation" :key="item.id || index" :title="item.label"
                :subtitle="item.type" link="#"
                :class="{ 'bg-blue-50': selectedKey === item.id && configMode === 'nav' }"
                @click="$emit('select-nav', item.id)">
                <template #media>
                    <f7-icon :f7="item.icon" size="20" />
                </template>
            </f7-list-item>
        </f7-list>
    </div>
</template>

<script setup lang="ts">

import type { ViewDefinition } from '../../../types/editor.types';
import type { NavigationItem } from '../../../types/view-config.types';
import { getViewIcon } from '../utils/viewHelpers';

defineProps<{
    views: Record<string, ViewDefinition>;
    navigation: NavigationItem[];
    selectedKey: string;
    configMode: 'view' | 'nav';
}>();

const emit = defineEmits<{
    (e: 'select-view', key: string): void;
    (e: 'create-view'): void;
    (e: 'select-nav', id: string): void;
    (e: 'create-nav'): void;
    (e: 'nav-sorted', event: { from: number; to: number }): void;
}>();

function onSort(event: any) {
    emit('nav-sorted', { from: event.from, to: event.to });
}
</script>

<style scoped>
.views-sidebar {
    min-width: 200px;
    max-width: 450px;
    border-right: 1px solid #e5e7eb;
    display: flex;
    flex-direction: column;
    background-color: #f9fafb;
    height: 100%;
    flex-shrink: 0;
}

/* Utility classes for template */
.h-full {
    height: 100%;
}

.flex {
    display: flex;
}

.flex-col {
    flex-direction: column;
}

.flex-1 {
    flex: 1;
}

.flex-shrink-0 {
    flex-shrink: 0;
}

.overflow-y-auto {
    overflow-y: auto;
}

.justify-between {
    justify-content: space-between;
}

.items-center {
    align-items: center;
}

.pr-4 {
    padding-right: 1rem;
}

.border-r {
    border-right-width: 1px;
    border-right-style: solid;
}

.border-b {
    border-bottom-width: 1px;
    border-bottom-style: solid;
}

.border-gray-200 {
    border-color: #e5e7eb;
}

.bg-gray-50 {
    background-color: #f9fafb;
}

.bg-blue-50 {
    background-color: #eff6ff;
}
</style>
