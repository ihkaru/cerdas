<template>
    <div class="code-editor-tab">
        <!-- Toolbar -->
        <div class="code-toolbar">
            <div class="toolbar-left">
                <span class="code-label">
                    <f7-icon f7="chevron_left_slash_chevron_right" size="16" />
                    Application Schema
                </span>
                <span class="schema-badge app">Holy Grail Mode</span>
                <span v-if="hasChanges" class="changes-badge">Modified</span>
                <span v-if="validationResult.valid && hasChanges" class="valid-badge">✓ Valid</span>
            </div>
            <div class="toolbar-right">
                <f7-button small outline @click="handleGenerateAIPrompt" :loading="isGeneratingPrompt" title="Copy AI Prompt Context">
                    <f7-icon f7="sparkles" size="14" />
                    AI Context
                </f7-button>
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
                <f7-button small fill @click="handleApply" :disabled="!hasChanges || hasError">
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
// No more table-specific props needed. Everything is in the App Schema.
import { validateAppJson, type ValidationResult } from '../../utils/jsonValidator';
import { ApiClient } from '@/common/api/ApiClient';
import { useAppStore } from '@/stores/app.store';
import { useTableStore } from '@/stores/table.store';

interface Props {
    // No more table-specific props needed. Everything is in the App Schema.
}

const props = defineProps<Props>();

const emit = defineEmits<{
    (e: 'generate-context'): void;
    (e: 'apply', payload: { fields: any[]; layout: any; settings: any }): void;
}>();

// Local state for the JSON code
const jsonCode = ref('');
const originalJson = ref('');
const syntaxError = ref('');
const fileInput = ref<HTMLInputElement | null>(null);
const isGeneratingPrompt = ref(false);
const appStore = useAppStore();

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
const isLoadingSchema = ref(false);

const isAppLevel = computed(() => true); // Unified App Mode

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
    const fileName = `app-schema-${Date.now()}.json`;

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
}

async function fetchAppSchema() {
    if (!appStore.currentApp?.id) return;
    
    isLoadingSchema.value = true;
    try {
        const res = await ApiClient.get(`/apps/${appStore.currentApp.id}/schema`);
        const schema = res.data;
        const json = JSON.stringify(schema, null, 2);
        jsonCode.value = json;
        originalJson.value = json;
    } catch (e: any) {
        console.error('Failed to fetch app schema', e);
    } finally {
        isLoadingSchema.value = false;
    }
}

async function handleGenerateAIPrompt() {
    if (isGeneratingPrompt.value) return;
    isGeneratingPrompt.value = true;
    
    const toast = f7.toast.create({ text: 'Assembling Super-Context (Technical Manual + Live Data)...', closeTimeout: 0 }).open();
    
    try {        let prompt = "# CERDAS AI ARCHITECT SUPER-CONTEXT v2.1\n"
                   + "You are an expert AI Architect specializing in the 'Cerdas' low-code ecosystem. Your goal is to modify or generate the provided Application Schema based on user instructions with 100% technical accuracy.\n\n"
                   + "## CHAPTER 1: THE CORE ARCHITECTURE\n"
                   + "Cerdas is an offline-first survey engine. The Application Schema defines the entire system: structure, logic, and UI. Technical precision is mandatory.\n\n"

                   + "## CHAPTER 2: LOGIC & EXPRESSIONS (CLOSURES)\n"
                   + "Custom logic uses JS function strings in `*_fn` and `validation_js` properties.\n"
                   + "- **Signature**: `(row, ctx, utils)`\n"
                   + "- **`ctx` Variable**:\n"
                   + "  - `user`: { id, name, email, role ['app_admin', 'editor', 'enumerator', 'supervisor', 'viewer'] }\n"
                   + "  - `app`: { id, mode ['simple', 'complex'] }\n"
                   + "  - `assignment`: { id, status, prelist_data: {} } (Data for follow-up surveys).\n"
                   + "  - `items`: All visible records.\n"
                   + "- **`utils` Variable**: `now()`, `today()`, `sum(arr, key)`, `daysSince(date)`, `uuid()`.\n\n"

                   + "## CHAPTER 3: DATA MASTER (TABLES & FIELDS)\n"
                   + "- **Field Types**: [text, number, url, date, time, select, radio, checkbox, gps, image, signature, html_block, nested_form, separator].\n"
                   + "- **HTML Blocks**: Required `content` (HTML) and `blockStyle` (info|success|warning|danger).\n"
                   + "- **Advanced Flags**: `pii` (sensitive), `preview` (show in map/list summaries), `searchable`.\n\n"

                   + "## CHAPTER 4: USER INTERFACE (VIEWS & NAVIGATION)\n"
                   + "- **Views**: Object keyed by View ID. Types: [deck, map, table, calendar].\n"
                   + "- **View Layout Configuration**: Flat structure directly under the view object:\n"
                   + "  - **Deck View**: `deck: { primaryHeaderField: string, secondaryHeaderField: string, imageField: string|null, imageShape: 'square'|'circle' }`\n"
                   + "  - **Map View**: `map: { gps_column: string, label: string, subtitle: string, mapbox_style: string }`\n"
                   + "  - **Actions**: Array of allowed operations: `actions: ['edit', 'delete']`\n"
                   + "  - **Group By**: Array of grouping fields: `groupBy: ['Field_Name']`\n"
                   + "- **Navigation**: Array of `{ id, type: 'view', view: 'ViewID', label, icon }`.\n\n"

                   + "## CHAPTER 5: ACTIVE SCHEMA CONTEXT\n"
                   + "Below is the CURRENT state of the application. USE THIS AS YOUR BASE.\n"
                   + "```json\n"
                   + jsonCode.value + "\n"
                   + "```\n\n"

                   + "## CHAPTER 6: REAL-WORLD DATA SAMPLES\n"
                   + "Use these real records to understand the data format and content:\n";
        
        let sampleDataPrompt = "";
        for (const table of (appStore.currentApp?.tables || [])) {
            try {
                if (appStore.currentApp?.id) {
                    const res = await ApiClient.get(`/apps/${appStore.currentApp.id}/responses`, {
                        table_id: table.id,
                        status: 'all',
                        page: 1,
                        per_page: 2
                    });
                    const responses = res.data?.data?.data || [];
                    if (responses.length > 0) {
                        sampleDataPrompt += `\n### Table: ${table.name} (${table.slug})\n` + "```json\n";
                        for(const r of responses) {
                            sampleDataPrompt += JSON.stringify(r.responses?.[0]?.data || r.prelist_data || {}, null, 2) + "\n";
                        }
                        sampleDataPrompt += "```\n";
                    }
                }
            } catch {}
        }
        
        prompt += sampleDataPrompt;

        prompt += "\n## CHAPTER 7: COMMON PATTERNS & COMPLEX VALIDATIONS\n"
                + "- **Pre-filling from Prelist**: `\"initial_value_fn\": \"return ctx.assignment?.prelist_data?.full_name;\"`.\n"
                + "- **Aggregating Siblings**: `\"formula_fn\": \"return utils.sum(ctx.allRows, 'amount');\"`.\n"
                + "- **Referencing Nested Form Fields in Views**: Use dot index notation (e.g. `\"primaryHeaderField\": \"kepala_keluarga_list.0.nama_kk\"`).\n"
                + "- **Complex Cross-Variable Validation**: Validation matching family members, genders, and age groups:\n"
                + "  `\"validation_js\": \"const total = Number(row.Jumlah_Anggota_Keluarga || 0); const laki = Number(row.Laki_Laki || 0); const pr = Number(row.Perempuan || 0); const listCount = Array.isArray(row.nested_list) ? row.nested_list.length : 0; if (total < listCount) { return 'Total ('+total+') cannot be less than nested items ('+listCount+')'; } if (total !== (laki + pr)) { return 'Total must match Laki-Laki + Perempuan!'; } return null;\"`.\n";
        
        prompt += "\n## FINAL INSTRUCTION\n"
                + "1. Output valid, strict JSON.\n"
                + "2. Maintain slug consistency.\n"
                + "3. Preserve existing `tableId` and `id` fields unless specifically asked to change them.\n"
                + "4. Respond with ONLY the modified parts or the full JSON depending on the user's request.";
                
        await navigator.clipboard.writeText(prompt);
        toast.close();
        f7.toast.show({ text: 'Super-Context Copied! LLM is now fully briefed.', position: 'center', closeTimeout: 3000 });
    } catch(e: any) {
        toast.close();
        f7.dialog.alert('Error: ' + e.message);
    } finally {
        isGeneratingPrompt.value = false;
    }
}

function generateJson(): string {
    return jsonCode.value; // Return the current state for download/copy
}

watch(
    () => appStore.currentApp?.id,
    () => {
        fetchAppSchema();
    },
    { immediate: true }
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

    // Force App-level validation
    validationResult.value = validateAppJson(parsed);
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

async function handleApply() {
    if (hasError.value) return;

    try {
        const parsed = JSON.parse(jsonCode.value);

        // ALWAYS App Level Sync
        f7.dialog.confirm(
            'Perhatian! Mengaplikasikan App-Level JSON akan menimpa seluruh struktur aplikasi (tabel, view, navigasi). Lanjutkan?',
            'Overwrite Full App Schema',
            async () => {
                f7.preloader.show();
                try {
                    if (!appStore.currentApp?.id) return;
                    await ApiClient.put(`/apps/${appStore.currentApp.id}/schema`, parsed);
                    f7.toast.show({ text: 'App Schema updated successfully!', position: 'center' });
                    // Refresh everything
                    await appStore.fetchApp(appStore.currentApp.id);
                    originalJson.value = jsonCode.value;

                    // Root Cause B Fix: Sync Visual Editor Memory & Iframe Preview
                    const tableStore = useTableStore();
                    const activeSlug = tableStore.currentTable?.slug;
                    if (activeSlug && parsed.tables?.[activeSlug]) {
                        const tableData = parsed.tables[activeSlug];
                        emit('apply', {
                            fields: tableData.fields || [],
                            layout: {
                                type: 'standard',
                                settings: tableData.settings || {},
                                views: parsed.views || tableStore.currentVersion?.layout?.views || {}
                            },
                            settings: tableData.settings || {}
                        });
                    }
                } catch (e: any) {
                    f7.dialog.alert('Failed to update app schema: ' + e.message);
                } finally {
                    f7.preloader.hide();
                }
            }
        );
    } catch (e: any) {
        syntaxError.value = `Failed to parse: ${e.message}`;
    }
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
