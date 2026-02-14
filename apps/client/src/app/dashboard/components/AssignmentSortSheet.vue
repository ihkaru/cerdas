<template>
    <f7-sheet class="sort-sheet" :opened="opened" @sheet:closed="$emit('update:opened', false)" swipe-to-close backdrop
        style="height: auto; border-top-left-radius: 16px; border-top-right-radius: 16px;">
        <f7-toolbar>
            <div class="left"></div>
            <div class="right">
                <f7-link sheet-close>Done</f7-link>
            </div>
        </f7-toolbar>

        <f7-page-content class="sort-sheet-content">
            <f7-block-title>Sort Assignments</f7-block-title>

            <f7-list no-hairlines-md>
                <f7-list-item title="Sort By" smart-select :smart-select-params="{
                    openIn: 'popup',
                    searchbar: true,
                    searchbarPlaceholder: 'Search fields',
                    closeOnSelect: true,
                    cssClass: 'field-select-popup',
                }">
                    <select :value="modelValue.field" @change="updateField($event)">
                        <option v-for="field in fields" :key="field.value" :value="field.value">
                            {{ field.label }}
                        </option>
                    </select>
                </f7-list-item>
            </f7-list>

            <div class="sort-order-wrapper">
                <f7-segmented strong>
                    <f7-button :active="modelValue.order === 'asc'" @click="updateOrder('asc')">
                        Ascending
                    </f7-button>
                    <f7-button :active="modelValue.order === 'desc'" @click="updateOrder('desc')">
                        Descending
                    </f7-button>
                </f7-segmented>
            </div>

            <div class="sort-sheet-bottom-safe"></div>
        </f7-page-content>
    </f7-sheet>
</template>

<script setup lang="ts">
import type { SortConfig } from '../types';

const props = defineProps<{
    opened: boolean;
    modelValue: SortConfig;
    fields: { label: string; value: string }[];
}>();

const emit = defineEmits<{
    (e: 'update:opened', value: boolean): void;
    (e: 'update:modelValue', value: SortConfig): void;
}>();

const updateField = (event: Event) => {
    const val = (event.target as HTMLSelectElement).value;
    emit('update:modelValue', { ...props.modelValue, field: val });
};

const updateOrder = (order: 'asc' | 'desc') => {
    emit('update:modelValue', { ...props.modelValue, order });
};
</script>

/* Global: popup renders outside component, must not be scoped */
<style>
.field-select-popup.popup {
    z-index: 15000 !important;
}

.field-select-popup.popup~.popup-backdrop {
    z-index: 14999 !important;
}
</style>

<style scoped>
.sort-sheet-content {
    padding-bottom: 0;
}

.sort-order-wrapper {
    padding: 0 16px 16px;
}

.sort-sheet-bottom-safe {
    height: env(safe-area-inset-bottom, 16px);
}
</style>