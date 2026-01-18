<template>
    <div class="field-config-panel">
        <!-- Header -->
        <div class="config-header">
            <h4 class="config-title">
                <f7-icon :f7="fieldMeta.icon" class="title-icon" />
                {{ field?.label || 'Field Settings' }}
            </h4>
            <f7-link icon-f7="xmark_circle" class="close-btn" @click="emit('close')" />
        </div>

        <!-- No Selection State -->
        <div v-if="!field" class="no-selection">
            <f7-icon f7="hand_tap" class="empty-icon" />
            <p>Select a field to edit its properties</p>
        </div>

        <!-- Config Form -->
        <div v-else class="config-content">
            <!-- Basic Section -->
            <f7-list inset class="config-section">
                <f7-list-item group-title>Basic</f7-list-item>

                <f7-list-input label="Field Name" type="text" :value="field.name" placeholder="field_name"
                    info="Unique identifier (no spaces)"
                    @input="updateField('name', ($event.target as HTMLInputElement).value)" />

                <f7-list-input label="Label" type="text" :value="field.label" placeholder="Display Label"
                    @input="updateField('label', ($event.target as HTMLInputElement).value)" />

                <f7-list-item>
                    <span>Field Type</span>
                    <f7-icon slot="media" :f7="fieldMeta.icon" />
                    <span class="field-type-badge">{{ fieldMeta.label }}</span>
                </f7-list-item>
            </f7-list>

            <!-- Validation Section -->
            <f7-list inset class="config-section">
                <f7-list-item group-title>Validation</f7-list-item>

                <f7-list-item>
                    <span>Required</span>
                    <f7-toggle slot="after" :checked="field.required"
                        @toggle:change="updateField('required', $event)" />
                </f7-list-item>

                <template v-if="field.type === 'number'">
                    <f7-list-input label="Min Value" type="number" :value="field.min"
                        @input="updateField('min', parseFloat(($event.target as HTMLInputElement).value))" />
                    <f7-list-input label="Max Value" type="number" :value="field.max"
                        @input="updateField('max', parseFloat(($event.target as HTMLInputElement).value))" />
                </template>

                <template v-if="field.type === 'nested_form'">
                    <f7-list-input label="Min Items" type="number" :value="field.min" placeholder="0"
                        @input="updateField('min', parseFloat(($event.target as HTMLInputElement).value))" />
                    <f7-list-input label="Max Items" type="number" :value="field.max" placeholder="Unlimited"
                        @input="updateField('max', parseFloat(($event.target as HTMLInputElement).value))" />
                </template>

                <template v-if="field.type === 'text'">
                    <f7-list-input label="Placeholder" type="text" :value="field.placeholder"
                        @input="updateField('placeholder', ($event.target as HTMLInputElement).value)" />
                </template>

                <template v-if="field.type === 'html_block'">
                    <div class="code-editor-field">
                        <div class="field-label">HTML Content</div>
                        <CodeEditor :model-value="field.content || ''" language="html" height="200px"
                            @update:model-value="updateField('content', $event)" />
                        <div class="field-hint">&lt;p&gt;content&lt;/p&gt;</div>
                    </div>
                </template>
            </f7-list>

            <!-- Options Section (for select/radio/checkbox) -->
            <template v-if="hasOptions">
                <f7-list inset class="config-section">
                    <f7-list-item group-title>
                        Options
                        <f7-link slot="after" icon-f7="plus_circle" @click="addOption" />
                    </f7-list-item>

                    <f7-list-item v-for="(option, index) in (field.options || [])" :key="index" class="option-item">
                        <div class="option-inputs">
                            <input type="text" :value="option.value" placeholder="value" class="option-input value"
                                @input="updateOption(index, 'value', ($event.target as HTMLInputElement).value)" />
                            <input type="text" :value="option.label" placeholder="Label" class="option-input label"
                                @input="updateOption(index, 'label', ($event.target as HTMLInputElement).value)" />
                        </div>
                        <f7-link slot="after" icon-f7="trash" color="red" @click="removeOption(index)" />
                    </f7-list-item>
                </f7-list>
            </template>

            <!-- Display Section -->
            <f7-list inset class="config-section">
                <f7-list-item group-title>Display</f7-list-item>

                <f7-list-input label="Hint Text" type="text" :value="field.hint"
                    placeholder="Help text shown below field"
                    @input="updateField('hint', ($event.target as HTMLInputElement).value)" />

                <f7-list-item>
                    <span>Searchable</span>
                    <f7-toggle slot="after" :checked="field.searchable"
                        @toggle:change="updateField('searchable', $event)" />
                </f7-list-item>

                <f7-list-item>
                    <span>Show in Preview</span>
                    <f7-toggle slot="after" :checked="field.preview" @toggle:change="updateField('preview', $event)" />
                </f7-list-item>
            </f7-list>

            <!-- Logic Section (Collapsible) -->
            <f7-list inset class="config-section">
                <f7-list-item accordion-item title="Advanced Logic">
                    <f7-icon slot="media" f7="bolt" />
                    <f7-accordion-content>
                        <f7-list>
                            <!-- Note: F7 List Input structures are good for simple inputs. 
                                 For CodeEditor, we might want to wrap it in a custom list item or just a div padding.
                            -->
                            <div class="logic-editor-group">
                                <div class="logic-label">Show If (JS)</div>
                                <CodeEditor :model-value="field.show_if_fn || ''" language="javascript" height="100px"
                                    placeholder="return ctx.row.other_field === 'value';"
                                    @update:model-value="updateField('show_if_fn', $event)" />
                            </div>

                            <div class="logic-editor-group">
                                <div class="logic-label">Required If (JS)</div>
                                <CodeEditor :model-value="field.required_if_fn || ''" language="javascript"
                                    height="100px" placeholder="return ctx.row.other_field !== '';"
                                    @update:model-value="updateField('required_if_fn', $event)" />
                            </div>

                            <div class="logic-editor-group">
                                <div class="logic-label">Editable If (JS)</div>
                                <CodeEditor :model-value="field.editable_if_fn || ''" language="javascript"
                                    height="100px" placeholder="return ctx.user.role === 'admin';"
                                    @update:model-value="updateField('editable_if_fn', $event)" />
                            </div>

                            <div class="logic-editor-group">
                                <div class="logic-label">Formula (JS)</div>
                                <CodeEditor :model-value="field.formula_fn || ''" language="javascript" height="100px"
                                    placeholder="return ctx.row.a + ctx.row.b;"
                                    @update:model-value="updateField('formula_fn', $event)" />
                            </div>

                            <div class="logic-editor-group">
                                <div class="logic-label">Warning (JS)</div>
                                <CodeEditor :model-value="field.warning_fn || ''" language="javascript" height="100px"
                                    placeholder="if (value < 0) return 'Value should be positive';"
                                    @update:model-value="updateField('warning_fn', $event)" />
                            </div>

                            <div v-if="hasOptions" class="logic-editor-group">
                                <div class="logic-label">Dynamic Options (JS)</div>
                                <CodeEditor :model-value="field.options_fn || ''" language="javascript" height="100px"
                                    placeholder="return ctx.maps.cities[ctx.row.province] || [];"
                                    @update:model-value="updateField('options_fn', $event)" />
                            </div>

                            <div class="logic-editor-group">
                                <div class="logic-label">Initial Value (JS)</div>
                                <CodeEditor :model-value="field.initial_value_fn || ''" language="javascript"
                                    height="100px" placeholder="return new Date().toISOString();"
                                    @update:model-value="updateField('initial_value_fn', $event)" />
                            </div>
                        </f7-list>
                    </f7-accordion-content>
                </f7-list-item>
            </f7-list>
        </div>
    </div>
</template>

<script setup lang="ts">
import CodeEditor from '@/components/CodeEditor.vue';
import { computed } from 'vue';
import {
    FIELD_TYPE_META,
    type EditableFieldDefinition,
    type FieldType
} from '../../types/editor.types';

// ============================================================================
// Props & Emits
// ============================================================================

interface Props {
    field: EditableFieldDefinition | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
    close: [];
    update: [updates: Partial<EditableFieldDefinition>];
}>();

// ============================================================================
// Computed
// ============================================================================

const fieldMeta = computed(() => {
    if (!props.field) return FIELD_TYPE_META.text;
    const type = props.field.type as FieldType;
    return FIELD_TYPE_META[type] || FIELD_TYPE_META.text;
});

const hasOptions = computed(() => {
    return ['select', 'radio', 'checkbox'].includes(props.field?.type || '');
});

// ============================================================================
// Handlers
// ============================================================================

function updateField<K extends keyof EditableFieldDefinition>(
    key: K,
    value: EditableFieldDefinition[K]
) {
    emit('update', { [key]: value });
}

function addOption() {
    if (!props.field) return;

    const options = [...(props.field.options || [])];
    const newIndex = options.length + 1;
    options.push({ value: `option${newIndex}`, label: `Option ${newIndex}` });

    emit('update', { options });
}

function updateOption(index: number, key: 'value' | 'label', newValue: string) {
    if (!props.field) return;

    const options = [...(props.field.options || [])];
    if (options[index]) {
        options[index] = { ...options[index], [key]: newValue };
        emit('update', { options });
    }
}

function removeOption(index: number) {
    if (!props.field) return;

    const options = [...(props.field.options || [])];
    options.splice(index, 1);
    emit('update', { options });
}
</script>

<style scoped>
.field-config-panel {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: var(--f7-page-bg-color);
}

/* Header - More compact */
.config-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border-bottom: 1px solid var(--f7-list-border-color);
    background: var(--f7-bars-bg-color);
    flex-shrink: 0;
}

.config-title {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 6px;
}

.title-icon {
    color: var(--f7-theme-color);
    font-size: 16px;
}

.close-btn {
    color: var(--f7-list-item-subtitle-text-color);
    font-size: 18px;
}

/* No Selection */
.no-selection {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px;
    text-align: center;
    color: var(--f7-list-item-subtitle-text-color);
}

.empty-icon {
    font-size: 32px;
    opacity: 0.3;
    margin-bottom: 8px;
}

/* Content - Scrollable */
.config-content {
    flex: 1;
    overflow-y: auto;
    padding: 4px 0;
    min-height: 0;
    /* Important for flexbox scroll */
}

/* Override F7 list styling for compact look */
.config-section {
    margin: 4px 8px;
    --f7-list-margin-vertical: 0;
    --f7-list-inset-border-radius: 8px;
}

.config-section :deep(.list) {
    font-size: 13px;
}

.config-section :deep(.item-content) {
    padding-left: 12px;
    min-height: 36px;
}

.config-section :deep(.item-inner) {
    padding-right: 12px;
    padding-top: 6px;
    padding-bottom: 6px;
}

.config-section :deep(.item-title) {
    font-size: 13px;
}

.config-section :deep(.item-input-wrap input),
.config-section :deep(.item-input-wrap textarea) {
    font-size: 13px;
}

.config-section :deep([slot="group-title"]),
.config-section :deep(.list-group-title) {
    font-size: 11px;
    padding: 4px 12px;
    min-height: 24px;
}

/* Field Type Badge */
.field-type-badge {
    background: rgba(var(--f7-theme-color-rgb), 0.1);
    color: var(--f7-theme-color);
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 500;
}

/* Option Item */
.option-item :deep(.item-inner) {
    padding: 4px 8px;
}

.option-inputs {
    display: flex;
    gap: 6px;
    flex: 1;
}

.option-input {
    flex: 1;
    padding: 4px 8px;
    border: 1px solid var(--f7-list-border-color);
    border-radius: 4px;
    font-size: 12px;
    background: var(--f7-list-item-bg-color);
}

.option-input.value {
    flex: 0.4;
    font-family: monospace;
    font-size: 11px;
}

.option-input.label {
    flex: 0.6;
}

.option-input:focus {
    outline: none;
    border-color: var(--f7-theme-color);
}



.logic-editor-group {
    padding: 8px 16px 12px 16px;
    border-bottom: 1px solid var(--f7-list-border-color);
}

.logic-editor-group:last-child {
    border-bottom: none;
}

.logic-label {
    font-size: 11px;
    font-weight: 500;
    color: var(--f7-list-item-title-text-color);
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.code-editor-field {
    padding: 12px 16px;
}

.field-label {
    font-size: 13px;
    font-weight: 400;
    color: var(--f7-list-item-title-text-color);
    margin-bottom: 6px;
}

.field-hint {
    font-size: 11px;
    color: #8e8e93;
    margin-top: 4px;
}
</style>
