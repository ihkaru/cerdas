<template>
    <div class="groupby-config">
        <f7-block-title>Group By</f7-block-title>
        <f7-list class="!my-0">
            <!-- Current GroupBy Fields -->
            <f7-list-item v-for="(field, index) in groupBy" :key="field" :title="`Level ${index + 1}: ${getFieldLabel(field)}`">
                <template #media>
                    <f7-icon f7="folder" />
                </template>
                <template #after>
                    <div class="groupby-actions">
                        <f7-button v-if="index > 0" small icon-only @click="moveUp(index)">
                            <f7-icon f7="arrow_up" size="16" />
                        </f7-button>
                        <f7-button v-if="index < groupBy.length - 1" small icon-only @click="moveDown(index)">
                            <f7-icon f7="arrow_down" size="16" />
                        </f7-button>
                        <f7-button small icon-only color="red" @click="removeField(index)">
                            <f7-icon f7="xmark" size="16" />
                        </f7-button>
                    </div>
                </template>
            </f7-list-item>

            <!-- Add New GroupBy Field -->
            <f7-list-item title="Add Group Level">
                <template #media>
                    <f7-icon f7="plus_circle" color="blue" />
                </template>
                <template #after>
                    <FieldPicker :model-value="null" :fields="availableFields" :allow-none="true"
                        placeholder="Select field..." @update:model-value="addField" />
                </template>
            </f7-list-item>

            <!-- Empty State -->
            <f7-list-item v-if="groupBy.length === 0" class="text-color-gray">
                <template #title>
                    <span class="text-color-gray" style="font-size: 13px;">No grouping configured. Items will be shown as a flat list.</span>
                </template>
            </f7-list-item>
        </f7-list>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { EditableFieldDefinition } from '../../../types/editor.types';
import FieldPicker from '../../shared/FieldPicker.vue';

const props = defineProps<{
    groupBy: string[];
    fields: EditableFieldDefinition[];
}>();

const emit = defineEmits<{
    (e: 'update', value: string[]): void;
}>();

// Fields not already in groupBy
const availableFields = computed(() => {
    const usedFields = new Set(props.groupBy);
    return props.fields.filter(f => !usedFields.has(f.name));
});

function getFieldLabel(fieldKey: string): string {
    const field = props.fields.find(f => f.name === fieldKey);
    return field?.label || field?.name || fieldKey;
}

function addField(fieldKey: string | null) {
    if (!fieldKey) return;
    emit('update', [...props.groupBy, fieldKey]);
}

function removeField(index: number) {
    const newGroupBy = [...props.groupBy];
    newGroupBy.splice(index, 1);
    emit('update', newGroupBy);
}

function moveUp(index: number) {
    if (index <= 0) return;
    const newGroupBy = [...props.groupBy];
    const prev = newGroupBy[index - 1];
    const curr = newGroupBy[index];
    
    if (prev === undefined || curr === undefined) return;

    newGroupBy[index - 1] = curr;
    newGroupBy[index] = prev;
    emit('update', newGroupBy);
}

function moveDown(index: number) {
    if (index >= props.groupBy.length - 1) return;
    const newGroupBy = [...props.groupBy];
    const curr = newGroupBy[index];
    const next = newGroupBy[index + 1];

    if (curr === undefined || next === undefined) return;

    newGroupBy[index] = next;
    newGroupBy[index + 1] = curr;
    emit('update', newGroupBy);
}
</script>

<style scoped>
.groupby-config {
    margin-bottom: 16px;
}

.groupby-actions {
    display: flex;
    gap: 4px;
    align-items: center;
}

.groupby-actions :deep(.button) {
    min-width: 28px;
    height: 28px;
    padding: 0;
}
</style>
