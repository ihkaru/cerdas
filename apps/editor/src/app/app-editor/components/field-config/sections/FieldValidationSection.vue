<template>
    <f7-list inset class="config-section">
        <f7-list-item group-title>Validation</f7-list-item>

        <f7-list-item>
            <span>Required</span>
            <f7-toggle slot="after" :checked="field.required" @toggle:change="emit('update', { required: $event })" />
        </f7-list-item>

        <template v-if="field.type === 'number'">
            <f7-list-input label="Min Value" type="number" :value="field.min"
                @input="emit('update', { min: parseFloat(($event.target as HTMLInputElement).value) })" />
            <f7-list-input label="Max Value" type="number" :value="field.max"
                @input="emit('update', { max: parseFloat(($event.target as HTMLInputElement).value) })" />
        </template>

        <template v-if="field.type === 'nested_form'">
            <f7-list-input label="Min Items" type="number" :value="field.min" placeholder="0"
                @input="emit('update', { min: parseFloat(($event.target as HTMLInputElement).value) })" />
            <f7-list-input label="Max Items" type="number" :value="field.max" placeholder="Unlimited"
                @input="emit('update', { max: parseFloat(($event.target as HTMLInputElement).value) })" />
        </template>

        <template v-if="field.type === 'text'">
            <f7-list-input label="Placeholder" type="text" :value="field.placeholder"
                @input="emit('update', { placeholder: ($event.target as HTMLInputElement).value })" />
        </template>

        <template v-if="field.type === 'html_block'">
            <div class="code-editor-field">
                <div class="field-label">HTML Content</div>
                <CodeEditor :model-value="field.content || ''" language="html" height="200px"
                    @update:model-value="emit('update', { content: $event })" />
                <div class="field-hint">&lt;p&gt;content&lt;/p&gt;</div>
            </div>
        </template>
    </f7-list>
</template>

<script setup lang="ts">
import CodeEditor from '@/components/CodeEditor.vue';
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

.code-editor-field {
    padding: 12px 14px 16px 14px;
}

.field-label {
    font-size: 12px;
    font-weight: 500;
    color: var(--editor-text-secondary, #64748b);
    margin-bottom: 8px;
}

.field-hint {
    font-size: 11px;
    color: var(--editor-text-muted, #94a3b8);
    margin-top: 6px;
    font-family: 'SF Mono', Monaco, 'Courier New', monospace;
    background: #f1f5f9;
    padding: 4px 8px;
    border-radius: 4px;
    display: inline-block;
}
</style>
