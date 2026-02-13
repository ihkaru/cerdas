<template>
    <f7-popup v-model:opened="isOpen" class="excel-import-popup" @popup:closed="handleClosed">
        <f7-view>
            <f7-page>
                <f7-navbar title="Import Data Source">
                    <f7-nav-right>
                        <f7-link popup-close>Close</f7-link>
                    </f7-nav-right>
                </f7-navbar>

                <div class="import-wizard">
                    <!-- Step 1: Upload -->
                    <div v-if="step === 1" class="wizard-step">
                        <div class="step-header">
                            <h3>Upload Excel File</h3>
                            <p>Select a .xlsx, .xls, or .csv file to import.</p>
                        </div>

                        <div class="upload-area" :class="{ 'dragging': isDragging }"
                            @dragover.prevent="isDragging = true" @dragleave.prevent="isDragging = false"
                            @drop.prevent="handleDrop" @click="triggerFileSelect">
                            <f7-icon f7="arrow_up_doc" size="48" class="text-color-gray"></f7-icon>
                            <p v-if="!isUploading">Drag & Drop or Click to Upload</p>
                            <p v-else>Uploading...</p>
                            <input type="file" ref="fileInput" accept=".xlsx,.xls,.csv" @change="handleFileSelect"
                                style="display: none;" />
                        </div>

                        <f7-block-title>Or choose manual source</f7-block-title>
                        <f7-list>
                            <f7-list-item title="Google Sheets (2-Way Sync)" link="#" class="disabled-link">
                                <template #after><span class="badge color-gray">Soon</span></template>
                            </f7-list-item>
                        </f7-list>
                    </div>

                    <!-- Step 2: Configuration & Preview -->
                    <div v-if="step === 2" class="wizard-step">
                        <div class="step-header">
                            <h3>Configure Data Source</h3>
                        </div>

                        <f7-list inset>
                            <f7-list-input label="Table Name" type="text"
                                placeholder="Enter table name (e.g. Sales Data)" :value="tableName"
                                @input="tableName = $event.target.value" required validate></f7-list-input>

                            <f7-list-input v-if="sheets.length > 1" label="Select Sheet" type="select"
                                :value="selectedSheet" @change="handleSheetChange">
                                <option v-for="sheet in sheets" :key="sheet" :value="sheet">{{ sheet }}</option>
                            </f7-list-input>
                        </f7-list>

                        <div v-if="isLoadingPreview" class="text-align-center padding">
                            <f7-preloader />
                            <p>Analyzing file structure...</p>
                        </div>

                        <div v-else-if="columns.length > 0" class="preview-section">
                            <f7-block-title>Column Mapping & Types</f7-block-title>
                            <div class="data-table card">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Excel Header</th>
                                            <th>Field Name</th>
                                            <th>Type</th>
                                            <th>Preview (Row 1)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="(col, idx) in columns" :key="idx">
                                            <td>{{ col.original_header }}</td>
                                            <td>
                                                <input type="text" v-model="col.name" class="input-cell" />
                                            </td>
                                            <td>
                                                <select v-model="col.type" class="input-cell">
                                                    <option value="text">Text</option>
                                                    <option value="number">Number</option>
                                                    <option value="date">Date</option>
                                                    <option value="boolean">Boolean</option>
                                                </select>
                                            </td>
                                            <td class="text-color-gray">{{ getPreviewValue(col.name) }}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <p class="padding-horizontal text-color-gray text-align-right">
                                <small>{{ totalRows }} rows found</small>
                            </p>
                        </div>

                        <f7-block>
                            <f7-button fill large @click="doImport" :loading="isImporting">Import Data</f7-button>
                        </f7-block>
                    </div>
                </div>
            </f7-page>
        </f7-view>
    </f7-popup>
</template>

<script setup lang="ts">
import { f7 } from 'framework7-vue';
import { computed, ref } from 'vue';
import { ExcelImportService, type ExcelColumn } from '../../services/excelImportService';

const props = defineProps<{
    opened: boolean;
    appId: string | number;
}>();

const emit = defineEmits(['update:opened', 'imported']);

const isOpen = computed({
    get: () => props.opened,
    set: (val) => emit('update:opened', val)
});

// State
const step = ref(1);
const isDragging = ref(false);
const isUploading = ref(false);
const isLoadingPreview = ref(false);
const isImporting = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

// Import Data
const filePath = ref('');
const sheets = ref<string[]>([]);
const selectedSheet = ref<string>('');
const tableName = ref('');
const columns = ref<ExcelColumn[]>([]);
const previewData = ref<any[]>([]);
const totalRows = ref(0);

function handleClosed() {
    reset();
}

function reset() {
    step.value = 1;
    filePath.value = '';
    sheets.value = [];
    selectedSheet.value = '';
    tableName.value = '';
    columns.value = [];
    previewData.value = [];
    totalRows.value = 0;
}

function triggerFileSelect() {
    fileInput.value?.click();
}

async function handleFileSelect(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) await uploadFile(file);
}

async function handleDrop(event: DragEvent) {
    isDragging.value = false;
    const file = event.dataTransfer?.files[0];
    if (file) await uploadFile(file);
}

async function uploadFile(file: File) {
    if (!file.name.match(/\.(xlsx|xls|csv)$/)) {
        f7.dialog.alert('Invalid file format. Please upload Excel or CSV.');
        return;
    }

    isUploading.value = true;
    try {
        const result = await ExcelImportService.upload(file);
        filePath.value = result.file_path;
        sheets.value = result.sheets;
        selectedSheet.value = result.sheets[0] || '';

        // Auto-set table name from file name
        const name = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, " ");
        tableName.value = name;

        step.value = 2;
        loadPreview();
    } catch (e: any) {
        f7.dialog.alert(e.message || 'Upload failed');
    } finally {
        isUploading.value = false;
    }
}

async function loadPreview() {
    if (!filePath.value) return;

    isLoadingPreview.value = true;
    try {
        const result = await ExcelImportService.preview(filePath.value, selectedSheet.value);
        columns.value = result.columns;
        previewData.value = result.preview;
        totalRows.value = result.total_rows;
    } catch (e: any) {
        f7.dialog.alert(e.message || 'Preview failed');
    } finally {
        isLoadingPreview.value = false;
    }
}

function handleSheetChange(e: any) {
    selectedSheet.value = e.target.value;
    loadPreview();
}

function getPreviewValue(colName: string) {
    if (previewData.value.length === 0) return '-';
    return previewData.value[0][colName] || '-';
}

async function doImport() {
    if (!tableName.value) {
        f7.dialog.alert('Please enter a table name');
        return;
    }

    isImporting.value = true;
    console.log('[ExcelImportModal] Starting import...');
    try {
        const result = await ExcelImportService.import(
            props.appId,
            tableName.value,
            filePath.value,
            columns.value,
            selectedSheet.value
        );
        console.log('[ExcelImportModal] Import successful, result:', result);

        // Close modal first to prevent UI freeze
        console.log('[ExcelImportModal] Closing modal (isOpen = false)');
        isOpen.value = false;

        f7.toast.create({
            text: 'Data imported successfully',
            position: 'center',
            closeTimeout: 2000,
        }).open();

        // Pass result to parent for auto-selection
        console.log('[ExcelImportModal] Emitting imported event');
        emit('imported', { table_id: result.table_id });
    } catch (e: any) {
        console.error('[ExcelImportModal] Import failed:', e);
        f7.dialog.alert(e.message || 'Import failed');
    } finally {
        isImporting.value = false;
    }
}
</script>

<style scoped>
.import-wizard {
    max-width: 800px;
    margin: 0 auto;
    padding: 24px;
}

.step-header {
    text-align: center;
    margin-bottom: 32px;
}

.upload-area {
    border: 2px dashed #cbd5e1;
    border-radius: 12px;
    padding: 48px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    background: #f8fafc;
}

.upload-area:hover,
.upload-area.dragging {
    border-color: #3b82f6;
    background: #eff6ff;
}

.disabled-link {
    opacity: 0.6;
    pointer-events: none;
}

.input-cell {
    width: 100%;
    padding: 4px 8px;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
}

.preview-section {
    margin-top: 24px;
}

.data-table {
    overflow-x: auto;
}
</style>
