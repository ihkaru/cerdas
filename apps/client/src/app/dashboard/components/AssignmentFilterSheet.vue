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
        <f7-page-content>
            <f7-block-title>Active Filters</f7-block-title>

            <f7-list v-if="localFilters.length > 0">
                <f7-list-item v-for="(filter, idx) in localFilters" :key="idx" swipeout>
                    <div slot="title" class="display-flex flex-direction-column">
                        <div class="size-12 text-color-gray">{{ getLabel(filter.field) }}</div>
                        <div>{{ getOperatorLabel(filter.operator) }} "{{ filter.value }}"</div>
                    </div>
                    <f7-swipeout-actions right>
                        <f7-swipeout-button color="red" @click="removeFilter(idx)">Delete</f7-swipeout-button>
                    </f7-swipeout-actions>
                    <div slot="after">
                        <f7-link icon-f7="trash" color="red" @click="removeFilter(idx)"></f7-link>
                    </div>
                </f7-list-item>
            </f7-list>
            <f7-block v-else class="text-align-center text-color-gray">
                No active filters
            </f7-block>

            <f7-block-title>Add New Filter</f7-block-title>
            <f7-list no-hairlines-md>
                <!-- Field Selector -->
                <f7-list-item title="Field" smart-select
                    :smart-select-params="{ openIn: 'popup', searchbar: true, searchbarPlaceholder: 'Search fields', cssClass: 'field-select-popup' }">
                    <select v-model="newFilter.field">
                        <option value="" disabled>Select Field</option>
                        <option v-for="f in fields" :key="f.value" :value="f.value">{{ f.label }}</option>
                    </select>
                </f7-list-item>

                <!-- Operator Selector -->
                <f7-list-item title="Operator" smart-select :smart-select-params="{ openIn: 'sheet' }">
                    <select v-model="newFilter.operator">
                        <option value="equals">Equals (=)</option>
                        <option value="contains">Contains</option>
                        <option value="starts_with">Starts With</option>
                        <option value="ends_with">Ends With</option>
                        <option value="greater_than">Greater Than (>)</option>
                        <option value="less_than">Less Than (<) </option>
                    </select>
                </f7-list-item>

                <!-- Value Input -->
                <f7-list-input label="Value" type="text" placeholder="Enter value..." :value="newFilter.value"
                    @input="newFilter.value = $event.target.value" clear-button></f7-list-input>

                <f7-block>
                    <f7-button fill @click="addNewFilter" :disabled="!isValidNewFilter">Add Filter</f7-button>
                </f7-block>
            </f7-list>

            <div style="height: 100px;"></div>
        </f7-page-content>
    </f7-sheet>
</template>

<style>
.field-select-popup {
    z-index: 13500 !important;
}
</style>

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

// Local copy for editing
const localFilters = ref<FilterConfig[]>([]);

watch(() => props.modelValue, (val) => {
    localFilters.value = [...val];
}, { immediate: true });

const sync = () => {
    emit('update:modelValue', localFilters.value);
};

const newFilter = ref<FilterConfig>({
    field: '',
    operator: 'contains',
    value: ''
});

const isValidNewFilter = computed(() => {
    return newFilter.value.field && newFilter.value.value !== '';
});

const addNewFilter = () => {
    if (!isValidNewFilter.value) return;
    localFilters.value.push({ ...newFilter.value });
    // Reset new filter, but keep operator potentially?
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
    const f = props.fields.find(x => x.value === fieldValue);
    return f ? f.label : fieldValue;
};

const getOperatorLabel = (op: string) => {
    switch (op) {
        case 'equals': return '=';
        case 'contains': return 'contains';
        case 'greater_than': return '>';
        case 'less_than': return '<';
        case 'starts_with': return 'starts with';
        case 'ends_with': return 'ends with';
        default: return op;
    }
};
</script>
