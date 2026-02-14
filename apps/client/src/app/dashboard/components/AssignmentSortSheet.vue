<template>
    <f7-sheet class="sort-sheet" :opened="opened" @sheet:closed="$emit('update:opened', false)" swipe-to-close backdrop
        style="height: auto; border-top-left-radius: 16px; border-top-right-radius: 16px;">
        <f7-toolbar>
            <div class="left"></div>
            <div class="right">
                <f7-link sheet-close>Done</f7-link>
            </div>
        </f7-toolbar>
        <f7-page-content>
            <f7-block-title>Sort Assignments</f7-block-title>
            <f7-list>
                <f7-list-item title="Sort By" smart-select
                    :smart-select-params="{ openIn: 'sheet', closeOnSelect: true }">
                    <select :value="modelValue.field" @change="updateField($event)">
                        <option v-for="field in fields" :key="field.value" :value="field.value">
                            {{ field.label }}
                        </option>
                    </select>
                </f7-list-item>
                <f7-list-item>
                    <div class="display-flex justify-content-center width-100 padding-vertical">
                        <f7-segmented strong style="width: 100%">
                            <f7-button :active="modelValue.order === 'asc'" @click="updateOrder('asc')">
                                Ascending
                            </f7-button>
                            <f7-button :active="modelValue.order === 'desc'" @click="updateOrder('desc')">
                                Descending
                            </f7-button>
                        </f7-segmented>
                    </div>
                </f7-list-item>
            </f7-list>
        </f7-page-content>
    </f7-sheet>
</template>

<script setup lang="ts">
import type { SortConfig } from '../types';

const props = defineProps<{
    opened: boolean;
    modelValue: SortConfig;
    fields: { label: string; value: string; }[];
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
