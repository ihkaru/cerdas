<template>
    <div class="nav-config-panel">
        <!-- Header -->
        <div class="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
            <h2 class="text-xl font-semibold m-0 flex items-center gap-2">
                <f7-icon f7="list_bullet_rectangle" size="24" class="text-blue-500" />
                Configure Tab
            </h2>
            <f7-button small color="red" outline @click="$emit('delete-nav')">
                Delete Item
            </f7-button>
        </div>

        <f7-list inset strong class="!mt-0">
            <f7-list-input label="Label" type="text" :value="navItem.label" placeholder="Tab Name"
                @input="updateProp('label', ($event.target as HTMLInputElement).value)">
                <f7-icon slot="media" f7="tag" />
            </f7-list-input>

            <f7-list-item title="Icon" smart-select
                :smart-select-params="{ openIn: 'popup', searchbar: true, searchbarPlaceholder: 'Search icons' }">
                <select :value="navItem.icon" @change="updateProp('icon', $event)">
                    <option value="square">Square</option>
                    <option value="house">House</option>
                    <option value="list_bullet">List</option>
                    <option value="map">Map</option>
                    <option value="calendar">Calendar</option>
                    <option value="person">Person</option>
                    <option value="gear">Settings</option>
                    <option value="globe">Globe (Web)</option>
                    <option value="doc_text">Document</option>
                    <option value="chart_bar">Chart</option>
                </select>
                <f7-icon slot="media" :f7="navItem.icon" />
            </f7-list-item>

            <f7-list-item title="Type" smart-select :smart-select-params="{ openIn: 'popover' }">
                <select :value="navItem.type" @change="updateProp('type', $event)">
                    <option value="view">App View</option>
                    <option value="link">External Link</option>
                </select>
                <f7-icon slot="media" f7="arrow_branch" />
            </f7-list-item>

            <f7-list-item v-if="navItem.type === 'view'" title="Target View" smart-select
                :smart-select-params="{ openIn: 'popup' }">
                <select :value="navItem.view_id" @change="updateProp('view_id', $event)">
                    <option value="" disabled>Select a view...</option>
                    <option v-for="(view, k) in availableViews" :key="k" :value="k">
                        {{ view.title || k }} ({{ view.type }})
                    </option>
                </select>
                <f7-icon slot="media" f7="rectangle_stack" />
            </f7-list-item>

            <f7-list-input v-if="navItem.type === 'link'" label="URL" type="url" placeholder="https://..."
                :value="navItem.url" @input="updateProp('url', ($event.target as HTMLInputElement).value)">
                <f7-icon slot="media" f7="link" />
            </f7-list-input>
        </f7-list>

        <f7-block-footer class="p-4">
            Changes to navigation affect the main tab bar of the application.
        </f7-block-footer>
    </div>
</template>

<script setup lang="ts">

import type { NavConfigPanelProps } from '../../../types/view-config.types';

defineProps<NavConfigPanelProps>();

const emit = defineEmits<{
    (e: 'update:nav', updates: any): void;
    (e: 'delete-nav'): void;
}>();

function updateProp(key: string, value: any) {
    const finalValue = (value instanceof Event) ? (value.target as HTMLSelectElement).value : value;
    emit('update:nav', { [key]: finalValue });
}
</script>

<style scoped>
.nav-config-panel {
    padding: 0;
}

/* Utility classes */
.flex {
    display: flex;
}

.justify-between {
    justify-content: space-between;
}

.items-center {
    align-items: center;
}

.gap-2 {
    gap: 0.5rem;
}

.m-0 {
    margin: 0;
}

.mb-6 {
    margin-bottom: 1.5rem;
}

.pb-4 {
    padding-bottom: 1rem;
}

.p-4 {
    padding: 1rem;
}

.border-b {
    border-bottom: 1px solid;
}

.border-gray-100 {
    border-color: #f3f4f6;
}

.text-xl {
    font-size: 1.25rem;
    line-height: 1.75rem;
}

.font-semibold {
    font-weight: 600;
}

.text-blue-500 {
    color: #3b82f6;
}
</style>
