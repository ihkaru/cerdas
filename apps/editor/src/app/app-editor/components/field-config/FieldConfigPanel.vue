<template>
    <div class="field-config-panel">
        <!-- Header -->
        <div class="config-header">
            <h4 class="config-title">
                <f7-icon :f7="fieldMeta.icon" class="title-icon" />
                {{ field?.label || 'Field Settings' }}
            </h4>
            <div class="header-actions">
                <f7-button v-if="isModified" small round outline color="orange" class="reset-btn"
                    @click="emit('reset')">
                    Reset
                </f7-button>
                <f7-link icon-f7="xmark_circle" class="close-btn" @click="emit('close')" />
            </div>
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

                <f7-list-item title="Field Type" smart-select :smart-select-params="{ openIn: 'popover' }">
                    <select :value="field.type"
                        @change="updateField('type', ($event.target as HTMLSelectElement).value)">
                        <optgroup v-for="category in ['basic', 'choice', 'media', 'advanced']" :key="category"
                            :label="category.charAt(0).toUpperCase() + category.slice(1)">
                            <option v-for="(meta, type) in getFieldsByCategory(category)" :key="type" :value="type">
                                {{ meta.label }}
                            </option>
                        </optgroup>
                    </select>
                    <f7-icon slot="media" :f7="fieldMeta.icon" />
                    <div slot="after">{{ fieldMeta.label }}</div>
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
                            <!-- Note: F7 List Input structures are good for simple interactions. -->

                            <!-- Schema Reference -->
                            <div class="padding-horizontal padding-vertical-half bg-color-white">
                                <f7-accordion-item>
                                    <div slot="title" class="size-12 text-color-gray flex-row align-items-center">
                                        <f7-icon f7="briefcase" size="14" class="margin-right-half" />
                                        <strong>Available Data (Click to Copy)</strong>
                                    </div>
                                    <f7-accordion-content>
                                        <div class="schema-list margin-top-half">
                                            <div class="schema-hint size-10 text-color-gray margin-bottom-half">
                                                Context: <code>ctx.row</code> (Current Form), <code>ctx.user</code>
                                            </div>
                                            <!-- Field List -->
                                            <div v-for="f in (allFields || [])" :key="f.id"
                                                class="schema-item display-flex align-items-center padding-vertical-half cursor-pointer"
                                                @click="copyToClipboard(`ctx.row.${f.name}`)">
                                                <f7-icon :f7="getFieldIcon(f.type)" size="14"
                                                    class="text-color-blue margin-right-half" />
                                                <div class="flex-grow-1">
                                                    <div class="text-color-black size-12 font-weight-bold">{{ f.name }}
                                                    </div>
                                                    <div class="text-color-gray size-10">{{ f.label }}</div>
                                                </div>
                                                <f7-icon f7="doc_on_doc" size="12" class="text-color-gray opacity-50" />
                                            </div>
                                            <!-- System Contexts -->
                                            <div class="schema-item display-flex align-items-center padding-vertical-half cursor-pointer"
                                                @click="copyToClipboard('ctx.user.email')">
                                                <f7-icon f7="person_circle" size="14"
                                                    class="text-color-purple margin-right-half" />
                                                <div class="flex-grow-1">
                                                    <div class="text-color-black size-12 font-weight-bold">ctx.user
                                                    </div>
                                                    <div class="text-color-gray size-10">User Info</div>
                                                </div>
                                                <f7-icon f7="doc_on_doc" size="12" class="text-color-gray opacity-50" />
                                            </div>
                                        </div>
                                    </f7-accordion-content>
                                </f7-accordion-item>
                            </div>

                            <div class="logic-editor-group">
                                <div class="logic-label">Show If (JS)</div>
                                <CodeEditor :model-value="field.show_if_fn || ''" language="javascript" height="100px"
                                    placeholder="return ctx.row.other_field === 'value';"
                                    @update:model-value="updateField('show_if_fn', $event)" />
                                <div v-if="getSyntaxError(field.show_if_fn)"
                                    class="text-color-red size-10 margin-top-half">
                                    <f7-icon f7="exclamationmark_triangle_fill" size="10" /> {{
                                        getSyntaxError(field.show_if_fn) }}
                                </div>
                            </div>

                            <div class="logic-editor-group">
                                <div class="logic-label">Required If (JS)</div>
                                <CodeEditor :model-value="field.required_if_fn || ''" language="javascript"
                                    height="100px" placeholder="return ctx.row.other_field !== '';"
                                    @update:model-value="updateField('required_if_fn', $event)" />
                                <div v-if="getSyntaxError(field.required_if_fn)"
                                    class="text-color-red size-10 margin-top-half">
                                    <f7-icon f7="exclamationmark_triangle_fill" size="10" /> {{
                                        getSyntaxError(field.required_if_fn)
                                    }}
                                </div>
                            </div>

                            <div class="logic-editor-group">
                                <div class="logic-label">Editable If (JS)</div>
                                <CodeEditor :model-value="field.editable_if_fn || ''" language="javascript"
                                    height="100px" placeholder="return ctx.user.role === 'admin';"
                                    @update:model-value="updateField('editable_if_fn', $event)" />
                                <div v-if="getSyntaxError(field.editable_if_fn)"
                                    class="text-color-red size-10 margin-top-half">
                                    <f7-icon f7="exclamationmark_triangle_fill" size="10" /> {{
                                        getSyntaxError(field.editable_if_fn)
                                    }}
                                </div>
                            </div>

                            <div class="logic-editor-group">
                                <div class="logic-label">Formula (JS)</div>
                                <CodeEditor :model-value="field.formula_fn || ''" language="javascript" height="100px"
                                    placeholder="return ctx.row.a + ctx.row.b;"
                                    @update:model-value="updateField('formula_fn', $event)" />
                                <div v-if="getSyntaxError(field.formula_fn)"
                                    class="text-color-red size-10 margin-top-half">
                                    <f7-icon f7="exclamationmark_triangle_fill" size="10" /> {{
                                        getSyntaxError(field.formula_fn) }}
                                </div>
                            </div>

                            <div class="logic-editor-group">
                                <div class="logic-label">Warning (JS)</div>
                                <CodeEditor :model-value="field.warning_fn || ''" language="javascript" height="100px"
                                    placeholder="if (value < 0) return 'Value should be positive';"
                                    @update:model-value="updateField('warning_fn', $event)" />
                                <div v-if="getSyntaxError(field.warning_fn)"
                                    class="text-color-red size-10 margin-top-half">
                                    <f7-icon f7="exclamationmark_triangle_fill" size="10" /> {{
                                        getSyntaxError(field.warning_fn) }}
                                </div>
                            </div>

                            <div v-if="hasOptions" class="logic-editor-group">
                                <div class="logic-label">Dynamic Options (JS)</div>
                                <CodeEditor :model-value="field.options_fn || ''" language="javascript" height="100px"
                                    placeholder="return ctx.maps.cities[ctx.row.province] || [];"
                                    @update:model-value="updateField('options_fn', $event)" />
                                <div v-if="getSyntaxError(field.options_fn)"
                                    class="text-color-red size-10 margin-top-half">
                                    <f7-icon f7="exclamationmark_triangle_fill" size="10" /> {{
                                        getSyntaxError(field.options_fn) }}
                                </div>
                            </div>

                            <div class="logic-editor-group">
                                <div class="logic-label">Initial Value (JS)</div>
                                <CodeEditor :model-value="field.initial_value_fn || ''" language="javascript"
                                    height="100px" placeholder="return new Date().toISOString();"
                                    @update:model-value="updateField('initial_value_fn', $event)" />
                                <div v-if="getSyntaxError(field.initial_value_fn)"
                                    class="text-color-red size-10 margin-top-half">
                                    <f7-icon f7="exclamationmark_triangle_fill" size="10" /> {{
                                        getSyntaxError(field.initial_value_fn) }}
                                </div>
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
    originalField?: EditableFieldDefinition | null;
    allFields?: EditableFieldDefinition[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
    close: [];
    reset: [];
    update: [updates: Partial<EditableFieldDefinition>];
}>();

// ============================================================================
// Logic Helpers
// ============================================================================

function getSyntaxError(code: string | undefined): string | null {
    if (!code || !code.trim()) return null;
    try {
        new Function('ctx', 'value', 'data', code);
        return null;
    } catch (e: any) {
        return e.message;
    }
}

import { f7 } from 'framework7-vue';

function copyToClipboard(text: string) {
    // 1. Try Modern API
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            if (f7) f7.toast.show({ text: 'Copied!', position: 'center', closeTimeout: 1000 });
        }).catch(err => {
            console.error('Clipboard API failed', err);
            fallbackCopy(text);
        });
    } else {
        // 2. Fallback
        fallbackCopy(text);
    }
}

function fallbackCopy(text: string) {
    const textArea = document.createElement("textarea");
    textArea.value = text;

    // Ensure it's not visible but part of DOM
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "0";
    document.body.appendChild(textArea);

    textArea.focus();
    textArea.select();

    try {
        const successful = document.execCommand('copy');
        if (successful) {
            if (f7) f7.toast.show({ text: 'Copied!', position: 'center', closeTimeout: 1000 });
        } else {
            console.error('Fallback copy failed.');
            if (f7) f7.toast.show({ text: 'Copy failed', position: 'center', closeTimeout: 1000 });
        }
    } catch (err) {
        console.error('Fallback copy error', err);
        if (f7) f7.toast.show({ text: 'Copy error', position: 'center', closeTimeout: 1000 });
    }

    document.body.removeChild(textArea);
}

function getFieldIcon(type: string) {
    return FIELD_TYPE_META[type as FieldType]?.icon || 'question';
}

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

const isModified = computed(() => {
    if (!props.field || !props.originalField) {
        // console.log('[FieldConfigPanel] isModified false: field or originalField missing', { field: !!props.field, original: !!props.originalField });
        return false;
    }
    // Simple deep comparison
    const current = JSON.stringify(props.field);
    const original = JSON.stringify(props.originalField);
    const modified = current !== original;

    // console.log('[FieldConfigPanel] isModified:', modified);
    if (modified) {
        // console.log('Difference:', { current, original });
    }
    return modified;
});

// Helper to group fields for select menu
function getFieldsByCategory(category: string) {
    return Object.fromEntries(
        Object.entries(FIELD_TYPE_META).filter(([_, meta]) => meta.category === category)
    );
}

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
/* ============================================================================
   Field Config Panel - Component-Specific Styles Only
   (Global F7 overrides are in editor-theme.css)
   ============================================================================ */

.field-config-panel {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: var(--editor-bg, #f8fafc);
}

/* Header */
.config-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid var(--editor-border, #e2e8f0);
    background: var(--editor-surface, #ffffff);
    flex-shrink: 0;
}

.config-title {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--editor-text-primary, #1e293b);
    display: flex;
    align-items: center;
    gap: 8px;
}

.title-icon {
    color: var(--editor-primary, #3b82f6);
    font-size: 18px;
}

.close-btn {
    color: var(--editor-text-muted, #94a3b8);
    font-size: 20px;
    transition: color 0.15s;
}

.close-btn:hover {
    color: var(--editor-text-secondary, #64748b);
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.reset-btn {
    height: 24px;
    line-height: 22px;
    font-size: 11px;
    font-weight: 600;
    padding: 0 10px;
}

/* No Selection */
.no-selection {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px;
    text-align: center;
    color: var(--editor-text-muted, #94a3b8);
}

.empty-icon {
    font-size: 40px;
    opacity: 0.4;
    margin-bottom: 12px;
}

/* Content - Scrollable */
.config-content {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0;
    min-height: 0;
}

/* Section spacing */
.config-section {
    margin: 8px 12px;
    --f7-list-margin-vertical: 0;
    --f7-list-inset-border-radius: 10px;
}

/* Field Type Badge */
.field-type-badge {
    background: linear-gradient(135deg, var(--editor-primary-light, #eff6ff) 0%, #dbeafe 100%);
    color: #2563eb;
    padding: 4px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    border: 1px solid var(--editor-primary-border, #bfdbfe);
}

/* Options Section */
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

/* Logic Editor Groups */
.logic-editor-group {
    padding: 12px 14px 16px 14px;
    border-bottom: 1px solid #f1f5f9;
}

.logic-editor-group:last-child {
    border-bottom: none;
}

/* Code Editor Field */
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

.schema-item {
    border-bottom: 1px solid #f1f5f9;
    padding: 6px 8px;
    border-radius: 4px;
    transition: background 0.1s;
}

.schema-item:hover {
    background: #f8fafc;
}

.schema-item:last-child {
    border-bottom: none;
}
</style>
