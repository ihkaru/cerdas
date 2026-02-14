<template>
    <f7-sheet class="filter-sheet" :opened="opened" @sheet:closed="$emit('update:opened', false)" swipe-to-close
        backdrop style="height: 80vh; border-top-left-radius: 16px; border-top-right-radius: 16px;">
        <f7-toolbar>
            <div class="left">
                <f7-link @click="clearAll" color="red">Clear All</f7-link>
            </div>
            <div class="right">
                <f7-link sheet-close>Done</f7-link>
            </div>
        </f7-toolbar>

        <f7-page-content class="filter-sheet-content">

            <!-- Active Filters -->
            <f7-block-title>Active Filters</f7-block-title>

            <f7-list v-if="localFilters.length > 0" media-list>
                <f7-list-item v-for="(filter, idx) in localFilters" :key="idx" swipeout>
                    <template #title>
                        <span class="filter-item-field">{{ getLabel(filter.field) }}</span>
                    </template>
                    <template #subtitle>
                        {{ getOperatorLabel(filter.operator) }} "{{ filter.value }}"
                    </template>
                    <template #after>
                        <f7-link icon-f7="trash" color="red" @click="removeFilter(idx)"></f7-link>
                    </template>
                    <f7-swipeout-actions right>
                        <f7-swipeout-button color="red" @click="removeFilter(idx)">Delete</f7-swipeout-button>
                    </f7-swipeout-actions>
                </f7-list-item>
            </f7-list>

            <f7-block v-else class="filter-empty-state">
                <f7-icon f7="line_3_horizontal_decrease_circle" size="32" class="filter-empty-icon"></f7-icon>
                <p>No active filters</p>
            </f7-block>

            <!-- Add New Filter -->
            <f7-block-title class="margin-top-lg">Add New Filter</f7-block-title>

            <f7-list no-hairlines-md>
                <f7-list-item title="Field" smart-select :smart-select-params="{
                    openIn: 'popup',
                    searchbar: true,
                    searchbarPlaceholder: 'Search fields',
                    closeOnSelect: true,
                    cssClass: 'field-select-popup',
                }">
                    <select v-model="newFilter.field">
                        <option value="" disabled>Select Field</option>
                        <option v-for="f in fields" :key="f.value" :value="f.value">{{ f.label }}</option>
                    </select>
                </f7-list-item>

                <f7-list-item title="Operator" smart-select :smart-select-params="{ openIn: 'sheet' }">
                    <select v-model="newFilter.operator">
                        <option value="equals">Equals (=)</option>
                        <option value="contains">Contains</option>
                        <option value="starts_with">Starts With</option>
                        <option value="ends_with">Ends With</option>
                        <option value="greater_than">Greater Than (&gt;)</option>
                        <option value="less_than">Less Than (&lt;)</option>
                    </select>
                </f7-list-item>

                <f7-list-input label="Value" type="text" placeholder="Enter value..." :value="newFilter.value"
                    @input="newFilter.value = ($event.target as HTMLInputElement).value" clear-button></f7-list-input>
            </f7-list>

            <div class="filter-add-btn-wrapper">
                <f7-button fill :disabled="!isValidNewFilter" @click="addNewFilter">
                    Add Filter
                </f7-button>
            </div>

        </f7-page-content>
    </f7-sheet>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { FilterConfig } from '../types';

const props = defineProps<{
    opened: boolean;
    modelValue: FilterConfig[];
    fields: { label: string; value: string; type: string }[];
}>();

const emit = defineEmits<{
    (e: 'update:opened', value: boolean): void;
    (e: 'update:modelValue', value: FilterConfig[]): void;
}>();

const localFilters = ref<FilterConfig[]>([]);

watch(() => props.modelValue, (val) => {
    localFilters.value = [...val];
}, { immediate: true });

const sync = () => emit('update:modelValue', localFilters.value);

const newFilter = ref<FilterConfig>({
    field: '',
    operator: 'contains',
    value: ''
});

const isValidNewFilter = computed(() =>
    newFilter.value.field !== '' && newFilter.value.value !== ''
);

const addNewFilter = () => {
    if (!isValidNewFilter.value) return;
    localFilters.value.push({ ...newFilter.value });
    newFilter.value = { field: '', operator: 'contains', value: '' };
    sync();
};

const removeFilter = (idx: number) => {
    localFilters.value.splice(idx, 1);
    sync();
};

const clearAll = () => {
    localFilters.value = [];
    sync();
};

const getLabel = (fieldValue: string) => {
    return props.fields.find(x => x.value === fieldValue)?.label ?? fieldValue;
};

const OPERATOR_LABELS: Record<string, string> = {
    equals: '=',
    contains: 'contains',
    greater_than: '>',
    less_than: '<',
    starts_with: 'starts with',
    ends_with: 'ends with',
};

const getOperatorLabel = (op: string) => OPERATOR_LABELS[op] ?? op;
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
.filter-sheet-content {
    padding-bottom: 32px;
}

/* Empty state */
.filter-empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 24px 16px;
    color: var(--f7-label-color);
    opacity: 0.6;
}

.filter-empty-state p {
    margin: 0;
    font-size: 14px;
}

.filter-empty-icon {
    opacity: 0.5;
}

/* Active filter item */
.filter-item-field {
    font-size: 12px;
    color: var(--f7-label-color);
}

/* Add button */
.filter-add-btn-wrapper {
    padding: 8px 16px 0;
}
</style>