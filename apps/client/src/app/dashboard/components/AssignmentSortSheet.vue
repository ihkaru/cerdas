<template>
    <f7-sheet class="sort-sheet app-sheet" :opened="opened" @sheet:closed="$emit('update:opened', false)"
        swipe-to-close backdrop style="height: auto;">

        <!-- Drag Handle -->
        <div class="sheet-drag-handle"></div>

        <!-- Toolbar with centered title -->
        <f7-toolbar class="sheet-toolbar" no-shadow>
            <div class="left"></div>
            <div class="center">
                <span class="sheet-title">Sort</span>
            </div>
            <div class="right">
                <f7-link sheet-close class="sheet-done-btn">Done</f7-link>
            </div>
        </f7-toolbar>

        <f7-page-content class="sort-sheet-content">
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

            <!-- Sort order: native segmented control -->
            <div class="sort-order-wrapper">
                <div class="sort-segmented">
                    <button class="sort-seg-btn" :class="{ active: modelValue.order === 'asc' }"
                        @click="updateOrder('asc')">
                        ↑ Ascending
                    </button>
                    <button class="sort-seg-btn" :class="{ active: modelValue.order === 'desc' }"
                        @click="updateOrder('desc')">
                        ↓ Descending
                    </button>
                </div>
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

/*
 * Native segmented control: replaces f7-segmented/f7-button.
 * Two pill buttons side-by-side; active state uses theme color fill.
 */
.sort-order-wrapper {
    padding: 8px 16px 16px;
}

.sort-segmented {
    display: flex;
    gap: 8px;
    background: #f1f5f9;
    border-radius: 10px;
    padding: 4px;
}

.sort-seg-btn {
    all: unset;
    flex: 1;
    text-align: center;
    padding: 8px 0;
    border-radius: 7px;
    font-size: 14px;
    font-weight: 500;
    color: #64748b;
    cursor: pointer;
    transition: background 0.15s, color 0.15s, box-shadow 0.15s;
}

.sort-seg-btn.active {
    background: #fff;
    color: var(--f7-theme-color, #2196f3);
    font-weight: 600;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.sort-sheet-bottom-safe {
    height: env(safe-area-inset-bottom, 16px);
}
</style>