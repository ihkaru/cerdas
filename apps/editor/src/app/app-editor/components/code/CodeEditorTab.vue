<template>
    <div class="code-editor-tab">
        <!-- Toolbar -->
        <div class="code-toolbar">
            <div class="toolbar-left">
                <span class="code-label">
                    <f7-icon f7="chevron_left_slash_chevron_right" size="16" />
                    {{ isAppLevel ? 'App Schema' : 'Table JSON' }}
                </span>
                <span v-if="isAppLevel" class="schema-badge app">App</span>
                <span v-else class="schema-badge table">Table</span>
                <span v-if="hasChanges" class="changes-badge">Modified</span>
                <span v-if="validationResult.valid && hasChanges" class="valid-badge">✓ Valid</span>
            </div>
            <div class="toolbar-right">
                <label class="live-toggle">
                    <input type="checkbox" v-model="livePreview" />
                    <span>Live Preview</span>
                </label>
                <f7-button small @click="handleCopy" title="Copy to clipboard">
                    <f7-icon f7="doc_on_doc" size="14" />
                </f7-button>
                <f7-button small @click="handleDownload" title="Download JSON">
                    <f7-icon f7="arrow_down_doc" size="14" />
                </f7-button>
                <f7-button small @click="handleUpload" title="Import JSON">
                    <f7-icon f7="arrow_up_doc" size="14" />
                </f7-button>
                <input ref="fileInput" type="file" accept=".json" style="display: none" @change="handleFileSelected" />
                <f7-button small @click="handleReset" :disabled="!hasChanges">
                    <f7-icon f7="arrow_counterclockwise" size="14" />
                    Reset
                </f7-button>
                <f7-button small fill @click="handleApply" :disabled="!hasChanges || hasError || livePreview">
                    <f7-icon f7="checkmark" size="14" />
                    Apply Changes
                </f7-button>
            </div>
        </div>

        <!-- Error/Warning Banner -->
        <div v-if="hasError || hasWarnings" class="validation-banner" :class="{ 'has-errors': hasError }">
            <div class="validation-header">
                <f7-icon :f7="hasError ? 'exclamationmark_triangle_fill' : 'info_circle_fill'" size="16" />
                <span v-if="hasError">{{ validationResult.errors.length }} validation error(s)</span>
                <span v-else>{{ validationResult.warnings.length }} warning(s)</span>
            </div>
            <div class="validation-list">
                <div v-for="(err, idx) in validationResult.errors" :key="'e' + idx" class="validation-item error">
                    <code>{{ err.path }}</code>: {{ err.message }}
                </div>
                <div v-for="(warn, idx) in validationResult.warnings" :key="'w' + idx" class="validation-item warning">
                    <code>{{ warn.path }}</code>: {{ warn.message }}
                </div>
            </div>
        </div>

        <!-- Editor -->
        <div class="editor-container">
            <CodeEditor v-model="jsonCode" language="json" height="100%" :dark="false" label="Table JSON Editor"
                placeholder="Loading table data..." />
        </div>
    </div>
</template>

<script setup lang="ts">
import CodeEditor from '@/components/CodeEditor.vue';
import { f7 } from 'framework7-vue';
import { computed, ref, watch } from 'vue';
import type { EditableFieldDefinition, LayoutConfig, TableSettings } from '../../types/editor.types';
import { validateAppJson, validateTableJson, type ValidationResult } from '../../utils/jsonValidator';

interface Props {
    tableId: string | null;
    tableName: string;
    fields: Record<string, unknown>[];
    layout: Record<string, unknown>;
    settings: Record<string, unknown>;
}

const props = defineProps<Props>();

const emit = defineEmits<{
    (e: 'apply', payload: {
        fields: EditableFieldDefinition[];
        layout: LayoutConfig;
        settings: TableSettings;
    }): void;
}>();

// Local state for the JSON code
const jsonCode = ref('');
const originalJson = ref('');
const syntaxError = ref('');
const fileInput = ref<HTMLInputElement | null>(null);
const livePreview = ref(false);
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

// Validation result from comprehensive validator
const validationResult = ref<ValidationResult>({
    valid: true,
    errors: [],
    warnings: []
});

// Track if code has changes vs original
const hasChanges = computed(() => jsonCode.value !== originalJson.value);
const hasError = computed(() => syntaxError.value !== '' || !validationResult.value.valid);
const hasWarnings = computed(() => validationResult.value.warnings.length > 0);

// Detect if current JSON is App-level or Table-level
const isAppLevel = computed(() => {
    try {
        const parsed = JSON.parse(jsonCode.value);
        return parsed.app !== undefined && parsed.tables !== undefined;
    } catch {
        return false;
    }
});

// ============================================================================
// Import/Export Handlers
// ============================================================================

function handleCopy() {
    navigator.clipboard.writeText(jsonCode.value).then(() => {
        f7.toast.show({
            text: 'JSON copied to clipboard',
            position: 'center',
            closeTimeout: 2000
        });
    });
}

function handleDownload() {
    const fileName = isAppLevel.value
        ? `app-schema-${Date.now()}.json`
        : `${props.tableName || 'table'}-${Date.now()}.json`;

    const blob = new Blob([jsonCode.value], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);

    f7.toast.show({
        text: 'JSON downloaded',
        position: 'center',
        closeTimeout: 2000
    });
}

function handleUpload() {
    fileInput.value?.click();
}

function handleFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const content = e.target?.result as string;
        try {
            // Validate it's valid JSON
            JSON.parse(content);
            jsonCode.value = content;
            f7.toast.show({
                text: 'JSON imported successfully',
                position: 'center',
                closeTimeout: 2000
            });
        } catch (err: any) {
            f7.dialog.alert(`Invalid JSON file: ${err.message}`, 'Import Error');
        }
    };
    reader.readAsText(file);

    // Reset input for re-upload
    input.value = '';
}

// Generate JSON representation from props
function generateJson(): string {
    const tableData = {
        tableId: props.tableId,
        tableName: props.tableName,
        fields: props.fields.map(f => {
            // Remove editor-specific properties for cleaner JSON
            const { _editorId, _collapsed, ...fieldData } = f;
            return fieldData;
        }),
        layout: props.layout,
        settings: props.settings
    };
    return JSON.stringify(tableData, null, 2);
}

// Watch for external changes (from visual editor)
watch(
    () => [props.fields, props.layout, props.settings],
    () => {
        const newJson = generateJson();
        // Only update if no local changes to preserve user edits
        if (!hasChanges.value) {
            jsonCode.value = newJson;
            originalJson.value = newJson;
        }
    },
    { deep: true, immediate: true }
);

// Validate JSON as user types
watch(jsonCode, (newCode) => {
    if (!newCode.trim()) {
        syntaxError.value = '';
        validationResult.value = { valid: true, errors: [], warnings: [] };
        return;
    }

    // First check JSON syntax
    let parsed: unknown;
    try {
        parsed = JSON.parse(newCode);
        syntaxError.value = '';
    } catch (e: any) {
        syntaxError.value = `JSON Syntax Error: ${e.message}`;
        validationResult.value = {
            valid: false,
            errors: [{ path: '', message: e.message, severity: 'error' }],
            warnings: []
        };
        return;
    }

    // Auto-detect schema type and validate accordingly
    const obj = parsed as Record<string, unknown>;
    const isAppLevel = obj.app !== undefined && obj.tables !== undefined;

    if (isAppLevel) {
        // Use App-level validation
        validationResult.value = validateAppJson(parsed);
    } else {
        // Use Table-level validation (backward compatible)
        validationResult.value = validateTableJson(parsed);
    }

    // Live preview: auto-apply valid changes with debounce
    if (livePreview.value && validationResult.value.valid && hasChanges.value) {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            applyChangesInternal();
        }, 500);
    }
});

function handleReset() {
    f7.dialog.confirm(
        'Discard all changes and reset to original?',
        'Reset Changes',
        () => {
            jsonCode.value = originalJson.value;
            syntaxError.value = '';
            validationResult.value = { valid: true, errors: [], warnings: [] };
        }
    );
}

function handleApply() {
    if (hasError.value) return;

    try {
        const parsed = JSON.parse(jsonCode.value);

        // Re-add editor IDs to fields
        const fieldsWithIds = addEditorIds(parsed.fields || []);

        f7.dialog.confirm(
            'Apply these changes to the visual editor? This will update all fields, layout, and settings.',
            'Apply JSON Changes',
            () => {
                emit('apply', {
                    fields: fieldsWithIds,
                    layout: parsed.layout || props.layout,
                    settings: parsed.settings || props.settings
                });

                // Update original to reflect applied state
                originalJson.value = jsonCode.value;

                f7.toast.show({
                    text: 'Changes applied successfully',
                    position: 'center',
                    closeTimeout: 2000
                });
            }
        );
    } catch (e: any) {
        syntaxError.value = `Failed to parse: ${e.message}`;
    }
}

// Internal apply function for live preview (no confirmation)
function applyChangesInternal() {
    if (hasError.value) return;

    try {
        const parsed = JSON.parse(jsonCode.value);
        const fieldsWithIds = addEditorIds(parsed.fields || []);

        emit('apply', {
            fields: fieldsWithIds,
            layout: parsed.layout || props.layout,
            settings: parsed.settings || props.settings
        });

        // Update original to track applied state
        originalJson.value = jsonCode.value;
    } catch {
        // Silently ignore parse errors in live preview
    }
}

// Recursively add _editorId to fields
function addEditorIds(fields: any[]): EditableFieldDefinition[] {
    return fields.map(field => {
        const newField = {
            ...field,
            _editorId: field._editorId || crypto.randomUUID()
        };

        // Handle nested forms
        if (field.type === 'nested_form' && Array.isArray(field.fields)) {
            newField.fields = addEditorIds(field.fields);
        }

        return newField;
    });
}
</script>

<style scoped>
.code-editor-tab {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #f8fafc;
}

.code-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: white;
    border-bottom: 1px solid #e2e8f0;
    gap: 12px;
}

.toolbar-left {
    display: flex;
    align-items: center;
    gap: 12px;
}

.toolbar-right {
    display: flex;
    align-items: center;
    gap: 8px;
}

.code-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 600;
    color: #334155;
    font-size: 14px;
}

.changes-badge {
    background: #fef3c7;
    color: #92400e;
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 10px;
}

.valid-badge {
    background: #dcfce7;
    color: #166534;
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 10px;
}

.schema-badge {
    font-size: 10px;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 4px;
    text-transform: uppercase;
}

.schema-badge.app {
    background: #dbeafe;
    color: #1e40af;
}

.schema-badge.table {
    background: #f1f5f9;
    color: #64748b;
}

.live-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #64748b;
    cursor: pointer;
    padding: 4px 10px;
    border-radius: 6px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    transition: all 0.2s;
}

.live-toggle:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
}

.live-toggle input {
    accent-color: #3b82f6;
}

.live-toggle input:checked+span {
    color: #3b82f6;
    font-weight: 600;
}

.validation-banner {
    padding: 10px 16px;
    background: #fffbeb;
    border-bottom: 1px solid #fde68a;
    font-size: 13px;
    max-height: 150px;
    overflow-y: auto;
}

.validation-banner.has-errors {
    background: #fef2f2;
    border-bottom-color: #fecaca;
}

.validation-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    color: #b45309;
    margin-bottom: 6px;
}

.validation-banner.has-errors .validation-header {
    color: #dc2626;
}

.validation-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding-left: 24px;
}

.validation-item {
    font-size: 12px;
    line-height: 1.4;
}

.validation-item.error {
    color: #b91c1c;
}

.validation-item.warning {
    color: #a16207;
}

.validation-item code {
    background: rgba(0, 0, 0, 0.06);
    padding: 1px 4px;
    border-radius: 3px;
    font-size: 11px;
    font-family: 'Fira Code', monospace;
}

.editor-container {
    flex: 1;
    position: relative;
    padding: 16px;
    min-width: 0;
    overflow: hidden;
}

.editor-container :deep(.code-editor-wrapper) {
    position: absolute;
    top: 16px;
    left: 16px;
    right: 16px;
    bottom: 16px;
    height: auto !important;
}

.editor-container :deep(.cm-editor) {
    font-size: 13px;
    height: 100% !important;
}

.editor-container :deep(.cm-scroller) {
    overflow: auto !important;
}
</style>
