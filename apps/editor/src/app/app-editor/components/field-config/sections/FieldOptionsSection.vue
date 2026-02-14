<template>
    <f7-list inset class="config-section">
        <f7-list-item group-title>
            Options
            <f7-link slot="after" icon-f7="plus_circle" @click="emit('add-option')" />
        </f7-list-item>

        <f7-list-item v-for="(option, index) in (field.options || [])" :key="index" class="option-item">
            <div class="option-inputs">
                <input type="text" :value="option.value" placeholder="value" class="option-input value"
                    @input="emit('update-option', index, 'value', ($event.target as HTMLInputElement).value)" />
                <input type="text" :value="option.label" placeholder="Label" class="option-input label"
                    @input="emit('update-option', index, 'label', ($event.target as HTMLInputElement).value)" />
            </div>
            <f7-link slot="after" icon-f7="trash" color="red" @click="emit('remove-option', index)" />
        </f7-list-item>
    </f7-list>
</template>

<script setup lang="ts">
import type { EditableFieldDefinition } from '../../../types/editor.types';

defineProps<{
    field: EditableFieldDefinition;
}>();

const emit = defineEmits<{
    (e: 'add-option'): void;
    (e: 'update-option', index: number, key: 'value' | 'label', value: string): void;
    (e: 'remove-option', index: number): void;
}>();
</script>

<style scoped>
.config-section {
    margin: 8px 12px;
    --f7-list-margin-vertical: 0;
    --f7-list-inset-border-radius: 10px;
}

.option-item :deep(.item-inner) {
    padding: 8px 14px;
}

.option-inputs {
    display: flex;
    gap: 8px;
    flex: 1;
}

.option-input {
    flex: 1;
    padding: 8px 10px;
    border: 1px solid var(--editor-border, #e2e8f0);
    border-radius: 6px;
    font-size: 13px;
    background: var(--editor-surface, #ffffff);
    color: var(--editor-text-primary, #1e293b);
    transition: all 0.15s ease;
}

.option-input:focus {
    outline: none;
    border-color: var(--editor-primary, #3b82f6);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.option-input.value {
    flex: 0.35;
    font-family: 'SF Mono', Monaco, 'Courier New', monospace;
    font-size: 12px;
    color: var(--editor-purple, #7c3aed);
    background: var(--editor-purple-light, #faf5ff);
    border-color: var(--editor-purple-border, #e9d5ff);
}

.option-input.value:focus {
    border-color: #a78bfa;
    box-shadow: 0 0 0 3px rgba(167, 139, 250, 0.1);
}

.option-input.label {
    flex: 0.65;
}
</style>
