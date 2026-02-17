<template>
    <div class="views-sidebar">
        <!-- Search Bar -->
        <div class="p-2 border-b border-gray-200 bg-gray-50">
            <div class="search-wrapper">
                <f7-icon f7="search" size="16" class="text-gray-400" />
                <input type="text" v-model="searchQuery" placeholder="Search views..." class="search-input" />
                <button v-if="searchQuery" @click="searchQuery = ''" class="clear-btn">
                    <f7-icon f7="xmark_circle_fill" size="14" />
                </button>
            </div>
        </div>

        <div class="sidebar-content">
            <!-- Section: Views -->
            <f7-block-title class="!mt-4 !mb-2 flex justify-between items-center pr-4">
                <span>App Views</span>
                <f7-link icon-f7="plus" icon-size="18" @click="$emit('create-view')" />
            </f7-block-title>

            <div v-if="isViewsEmpty && searchQuery" class="empty-search">
                No views match "{{ searchQuery }}"
            </div>

            <f7-list class="flex-shrink-0 !my-0 border-b border-gray-200">
                <f7-list-item v-for="(view, key) in filteredViews" :key="key" :title="view.title || key"
                    :subtitle="view.type" link="#" href="javascript:void(0)"
                    :class="{ 'bg-blue-50': selectedKey === key && configMode === 'view' }"
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

            <div v-if="filteredNavigation.length === 0 && searchQuery" class="empty-search">
                No items match "{{ searchQuery }}"
            </div>

            <f7-list sortable @sortable:sort="onSort" class="flex-1 overflow-y-auto !my-0">
                <f7-list-item v-for="(item, index) in filteredNavigation" :key="item.id || index" :title="item.label"
                    :subtitle="item.type" link="#" href="javascript:void(0)"
                    :class="{ 'bg-blue-50': selectedKey === item.id && configMode === 'nav' }"
                    @click="$emit('select-nav', item.id)">
                    <template #media>
                        <f7-icon :f7="item.icon" size="20" />
                    </template>
                </f7-list-item>
            </f7-list>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { ViewDefinition } from '../../../types/editor.types';
import type { NavigationItem } from '../../../types/view-config.types';
import { getViewIcon } from '../utils/viewHelpers';

const props = defineProps<{
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

// ============================================================================
// Search Logic
// ============================================================================

const searchQuery = ref('');

const filteredViews = computed(() => {
    if (!searchQuery.value) return props.views;
    const query = searchQuery.value.toLowerCase();
    const result: Record<string, ViewDefinition> = {};
    
    for (const [key, view] of Object.entries(props.views)) {
        if (
            key.toLowerCase().includes(query) || 
            view.title.toLowerCase().includes(query) ||
            view.type.toLowerCase().includes(query)
        ) {
            result[key] = view;
        }
    }
    return result;
});

const isViewsEmpty = computed(() => Object.keys(filteredViews.value).length === 0);

const filteredNavigation = computed(() => {
    if (!searchQuery.value) return props.navigation;
    const query = searchQuery.value.toLowerCase();
    
    return props.navigation.filter(item => 
        item.label.toLowerCase().includes(query) ||
        item.type.toLowerCase().includes(query)
    );
});

function onSort(event: any) {
    emit('nav-sorted', { from: event.from, to: event.to });
}
</script>

<style scoped>
.views-sidebar {
    min-width: 250px;
    max-width: 450px;
    border-right: 1px solid #e5e7eb;
    display: flex;
    flex-direction: column;
    background-color: #f9fafb;
    height: 100%;
    flex-shrink: 0;
}

.sidebar-content {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
}

/* Search Styles */
.search-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 6px 10px;
    margin: 4px;
}

.search-input {
    border: none;
    outline: none;
    background: transparent;
    font-size: 14px;
    width: 100%;
    color: #1f2937;
    font-family: inherit;
}

.clear-btn {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    color: #9ca3af;
    display: flex;
    align-items: center;
}

.clear-btn:hover {
    color: #6b7280;
}

.empty-search {
    padding: 12px 16px;
    font-size: 13px;
    color: #9ca3af;
    text-align: center;
    font-style: italic;
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

.p-2 {
    padding: 0.5rem;
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

.text-gray-400 {
    color: #9ca3af;
}
</style>
