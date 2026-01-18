<template>
    <f7-popup class="csv-import-popup" :opened="opened" @popup:closed="$emit('close')">
        <f7-page>
            <f7-navbar title="Import from CSV">
                <template #right>
                    <f7-link popup-close>Cancel</f7-link>
                </template>
            </f7-navbar>

            <!-- Step 1: Upload -->
            <div v-if="step === 'upload'" class="import-step">
                <div class="upload-area" :class="{ dragover: isDragging }" @dragover.prevent="isDragging = true"
                    @dragleave.prevent="isDragging = false" @drop.prevent="handleDrop" @click="triggerFileInput">
                    <f7-icon f7="arrow_down_doc" class="upload-icon" />
                    <h3>Drop CSV file here</h3>
                    <p>or click to browse</p>
                    <input ref="fileInput" type="file" accept=".csv" hidden @change="handleFileSelect" />
                </div>

                <f7-block class="instructions">
                    <h4>CSV Format Requirements:</h4>
                    <ul>
                        <li>First row must be column headers</li>
                        <li>Each row represents one assignment</li>
                        <li>UTF-8 encoding recommended</li>
                    </ul>
                </f7-block>
            </div>

            <!-- Step 2: Preview & Map -->
            <div v-if="step === 'preview'" class="import-step">
                <f7-block-title>Preview (first 5 rows)</f7-block-title>
                <div class="preview-table-wrapper">
                    <table class="preview-table">
                        <thead>
                            <tr>
                                <th v-for="col in csvColumns" :key="col">{{ col }}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(row, idx) in previewRows" :key="idx">
                                <td v-for="col in csvColumns" :key="col">{{ row[col] || '-' }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <f7-block-title>Column Mapping</f7-block-title>
                <f7-list inset strong>
                    <f7-list-item v-for="col in csvColumns" :key="col" :title="col">
                        <template #after>
                            <select :value="columnMapping[col]" @change="updateMapping(col, $event)">
                                <option value="">— Skip —</option>
                                <option v-for="field in availableFields" :key="field.name" :value="field.name">
                                    {{ field.label }} ({{ field.name }})
                                </option>
                            </select>
                        </template>
                    </f7-list-item>
                </f7-list>

                <f7-toolbar bottom>
                    <f7-link @click="step = 'upload'">Back</f7-link>
                    <f7-link @click="confirmImport" class="color-green">
                        Import {{ csvData.length }} rows
                    </f7-link>
                </f7-toolbar>
            </div>

            <!-- Step 3: Success -->
            <div v-if="step === 'success'" class="import-step success-step">
                <f7-icon f7="checkmark_circle_fill" class="success-icon" />
                <h2>Import Complete!</h2>
                <p>{{ importedCount }} assignments imported successfully.</p>
                <f7-button fill popup-close>Done</f7-button>
            </div>
        </f7-page>
    </f7-popup>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useSchemaEditor } from '../../composables/useSchemaEditor';

// ============================================================================
// Props & Emits
// ============================================================================

interface Props {
    opened: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
    close: [];
    import: [data: Record<string, unknown>[]];
}>();

// ============================================================================
// State
// ============================================================================

const { fields } = useSchemaEditor();

const step = ref<'upload' | 'preview' | 'success'>('upload');
const isDragging = ref(false);
const fileInput = ref<HTMLInputElement>();
const csvData = ref<Record<string, string>[]>([]);
const csvColumns = ref<string[]>([]);
const columnMapping = ref<Record<string, string>>({});
const importedCount = ref(0);

// ============================================================================
// Computed
// ============================================================================

const availableFields = computed(() => {
    return fields.value || [];
});

const previewRows = computed(() => {
    return csvData.value.slice(0, 5);
});

// ============================================================================
// Methods
// ============================================================================

function triggerFileInput() {
    fileInput.value?.click();
}

function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
        parseCSV(file);
    }
}

function handleDrop(event: DragEvent) {
    isDragging.value = false;
    const file = event.dataTransfer?.files[0];
    if (file && file.name.endsWith('.csv')) {
        parseCSV(file);
    }
}

function parseCSV(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
            alert('CSV must have at least a header row and one data row');
            return;
        }

        // Parse header
        const headerLine = lines[0];
        if (!headerLine) return;
        csvColumns.value = parseCSVLine(headerLine);
        
        // Auto-map columns to fields
        columnMapping.value = {};
        for (const col of csvColumns.value) {
            const matchedField = availableFields.value.find(
                f => f.name.toLowerCase() === col.toLowerCase() ||
                    f.label.toLowerCase() === col.toLowerCase()
            );
            if (matchedField) {
                columnMapping.value[col] = matchedField.name;
            }
        }

        // Parse data rows
        csvData.value = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (!line) continue;
            const values = parseCSVLine(line);
            const row: Record<string, string> = {};
            csvColumns.value.forEach((col, idx) => {
                row[col] = values[idx] || '';
            });
            csvData.value.push(row);
        }

        step.value = 'preview';
    };
    reader.readAsText(file);
}

function parseCSVLine(line: string): string[] {
    // Simple CSV parsing (handles quoted values)
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (const char of line) {
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    
    return result;
}

function updateMapping(column: string, event: Event) {
    const select = event.target as HTMLSelectElement;
    columnMapping.value[column] = select.value;
}

function confirmImport() {
    // Transform CSV data using column mapping
    const mappedData = csvData.value.map(row => {
        const mapped: Record<string, unknown> = {};
        for (const [csvCol, fieldName] of Object.entries(columnMapping.value)) {
            if (fieldName && row[csvCol] !== undefined) {
                mapped[fieldName] = row[csvCol];
            }
        }
        return mapped;
    });

    importedCount.value = mappedData.length;
    emit('import', mappedData);
    step.value = 'success';
}

// Reset on close
watch(() => props.opened, (isOpen) => {
    if (!isOpen) {
        step.value = 'upload';
        csvData.value = [];
        csvColumns.value = [];
        columnMapping.value = {};
    }
});
</script>

<style scoped>
.import-step {
    padding: 20px;
}

.upload-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 24px;
    border: 2px dashed var(--f7-list-border-color);
    border-radius: 12px;
    background: var(--f7-list-item-bg-color);
    cursor: pointer;
    transition: all 0.2s;
}

.upload-area:hover,
.upload-area.dragover {
    border-color: var(--f7-theme-color);
    background: rgba(var(--f7-theme-color-rgb), 0.05);
}

.upload-icon {
    font-size: 48px;
    color: var(--f7-theme-color);
    margin-bottom: 16px;
}

.upload-area h3 {
    margin: 0;
    font-size: 18px;
    color: var(--f7-list-item-title-text-color);
}

.upload-area p {
    margin: 4px 0 0;
    font-size: 14px;
    color: var(--f7-list-item-subtitle-text-color);
}

.instructions {
    margin-top: 24px;
}

.instructions h4 {
    margin: 0 0 8px;
    font-size: 14px;
}

.instructions ul {
    margin: 0;
    padding-left: 20px;
    font-size: 13px;
    color: var(--f7-list-item-subtitle-text-color);
}

.instructions li {
    margin: 4px 0;
}

/* Preview Table */
.preview-table-wrapper {
    overflow-x: auto;
    margin: 12px 0;
}

.preview-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
}

.preview-table th,
.preview-table td {
    padding: 8px 12px;
    border: 1px solid var(--f7-list-border-color);
    text-align: left;
}

.preview-table th {
    background: var(--f7-bars-bg-color);
    font-weight: 600;
}

.preview-table td {
    background: var(--f7-list-item-bg-color);
}

/* Success Step */
.success-step {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    text-align: center;
}

.success-icon {
    font-size: 64px;
    color: var(--f7-color-green);
    margin-bottom: 16px;
}

.success-step h2 {
    margin: 0;
    font-size: 24px;
}

.success-step p {
    margin: 8px 0 24px;
    color: var(--f7-list-item-subtitle-text-color);
}
</style>
