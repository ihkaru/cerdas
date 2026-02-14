<template>
    <f7-list inset class="config-section">
        <f7-list-item group-title>Display</f7-list-item>

        <f7-list-input label="Hint Text" type="text" :value="field.hint" placeholder="Help text shown below field"
            @input="emit('update', { hint: ($event.target as HTMLInputElement).value })" />

        <f7-list-item>
            <span>Searchable</span>
            <f7-toggle slot="after" :checked="field.searchable"
                @toggle:change="emit('update', { searchable: $event })" />
        </f7-list-item>

        <f7-list-item>
            <span>Show in Preview</span>
            <f7-toggle slot="after" :checked="field.preview" @toggle:change="emit('update', { preview: $event })" />
        </f7-list-item>
    </f7-list>
</template>

<script setup lang="ts">
import type { EditableFieldDefinition } from '../../../types/editor.types';

defineProps<{
    field: EditableFieldDefinition;
}>();

const emit = defineEmits<{
    (e: 'update', updates: Partial<EditableFieldDefinition>): void;
}>();
</script>

<style scoped>
.config-section {
    margin: 8px 12px;
    --f7-list-margin-vertical: 0;
    --f7-list-inset-border-radius: 10px;
}
</style>
