<template>
    <f7-popup v-model:opened="isOpen" class="excel-import-popup" @popup:closed="handleClosed">
        <f7-view>
            <f7-page>
                <f7-navbar title="Import Data Source">
                    <f7-nav-right>
                        <f7-link popup-close>Close</f7-link>
                    </f7-nav-right>
                </f7-navbar>

                <div class="wizard">

                    <!-- Step Indicator -->
                    <div class="step-indicator">
                        <div class="step-indicator-track">
                            <div class="step-indicator-fill" :style="{ width: step === 1 ? '50%' : '100%' }"></div>
                        </div>
                        <div class="step-indicator-labels">
                            <span :class="{ active: step >= 1 }">Upload</span>
                            <span :class="{ active: step >= 2 }">Configure</span>
                        </div>
                    </div>

                    <!-- ── Step 1: Upload ── -->
                    <!-- ── Step 1: Select & Connect Source ── -->
                    <div v-if="step === 1" class="wizard-step">
                        <!-- Source Selector Tabs -->
                        <div class="segmented segmented-raised margin-bottom" style="margin-bottom: 20px;">
                            <button
                                type="button"
                                class="button"
                                :class="{ 'button-active': sourceType === 'file' }"
                                @click="selectSourceType('file')"
                            >
                                <f7-icon f7="arrow_up_doc_fill" size="16" class="margin-right-half" />
                                Upload File (Excel / CSV)
                            </button>
                            <button
                                type="button"
                                class="button"
                                :class="{ 'button-active': sourceType === 'google_sheets' }"
                                @click="selectSourceType('google_sheets')"
                            >
                                <f7-icon f7="logo_google" size="16" class="margin-right-half" />
                                Google Sheets (2-Way Sync)
                            </button>
                        </div>

                        <!-- Mode A: File Upload Dropzone -->
                        <div v-if="sourceType === 'file'">
                            <div class="upload-area" :class="{ dragging: isDragging, uploading: isUploading }"
                                @dragover.prevent="isDragging = true" @dragleave.prevent="isDragging = false"
                                @drop.prevent="handleDrop" @click="triggerFileSelect">
                                <input type="file" ref="fileInput" accept=".xlsx,.xls,.csv" @change="handleFileSelect"
                                    style="display:none;" />
                                <div v-if="!isUploading" class="upload-idle">
                                    <div class="upload-icon-wrapper">
                                        <f7-icon f7="arrow_up_doc" size="32" class="upload-icon"></f7-icon>
                                    </div>
                                    <p class="upload-title">Drag & Drop or Click to Upload</p>
                                    <p class="upload-hint">.xlsx · .xls · .csv</p>
                                </div>
                                <div v-else class="upload-loading">
                                    <f7-preloader color="blue"></f7-preloader>
                                    <p class="upload-loading-text">Uploading ({{ uploadProgress }}%)</p>
                                    <div class="import-progress-track" style="width: 100%; max-width: 200px; margin: 8px auto 0;">
                                        <div class="import-progress-fill" :style="{ width: uploadProgress + '%' }"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Mode B: Google Sheets URL & Inspect -->
                        <div v-else-if="sourceType === 'google_sheets'" class="google-sheets-panel">
                            <div class="card margin-0" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;">
                                <div class="card-content card-content-padding">
                                    <div class="display-flex align-items-center margin-bottom">
                                        <div style="width: 40px; height: 40px; border-radius: 10px; background: #dcfce7; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                                            <f7-icon f7="table" size="22" color="green" />
                                        </div>
                                        <div>
                                            <div style="font-weight: 600; font-size: 15px; color: #1e293b;">Google Spreadsheet 2-Way Sync</div>
                                            <div style="font-size: 12px; color: #64748b;">Sinkronisasi data otomatis dengan Google Sheet Anda.</div>
                                        </div>
                                    </div>

                                    <!-- Google Auth Status: Connected -->
                                    <div v-if="hasGoogleToken" class="display-flex align-items-center justify-content-space-between margin-bottom" style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px;">
                                        <div class="display-flex align-items-center" style="gap: 10px;">
                                            <div style="width: 32px; height: 32px; border-radius: 50%; background: #dcfce7; display: flex; align-items: center; justify-content: center;">
                                                <f7-icon f7="checkmark_seal_fill" size="20" color="green" />
                                            </div>
                                            <div>
                                                <div style="font-weight: 600; font-size: 13px; color: #166534;">Akun Google Terhubung</div>
                                                <div style="font-size: 11px; color: #15803d;">{{ formattedTokenOwner }}</div>
                                            </div>
                                        </div>
                                        <span style="font-size: 11px; background: #dcfce7; color: #15803d; font-weight: 600; padding: 4px 10px; border-radius: 20px;">
                                            ✓ Active
                                        </span>
                                    </div>

                                    <!-- Google Auth Prompt: If Not Connected -->
                                    <div v-else class="display-flex align-items-center justify-content-space-between margin-bottom" style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px;">
                                        <div class="display-flex align-items-center" style="gap: 10px;">
                                            <f7-icon f7="logo_google" size="24" color="blue" />
                                            <div>
                                                <div style="font-weight: 600; font-size: 13px; color: #1e3a8a;">Hubungkan Akun Google</div>
                                                <div style="font-size: 11px; color: #3b82f6;">Izin akses Google Drive diperlukan untuk membaca spreadsheet.</div>
                                            </div>
                                        </div>
                                        <f7-button fill small color="blue" :loading="isAuthenticating" @click="handleConnectOAuth">
                                            Connect
                                        </f7-button>
                                    </div>

                                    <f7-list inset class="margin-0" style="margin-bottom: 12px;">
                                        <f7-list-input
                                            label="Google Spreadsheet URL"
                                            type="url"
                                            placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                                            :value="spreadsheetUrl"
                                            @input="spreadsheetUrl = ($event.target as HTMLInputElement).value"
                                            clear-button
                                            required
                                        />
                                    </f7-list>

                                    <f7-button
                                        fill
                                        large
                                        :color="hasGoogleToken ? 'green' : 'blue'"
                                        :disabled="!spreadsheetUrl || isLoadingPreview || isAuthenticating"
                                        :loading="isLoadingPreview || isAuthenticating"
                                        @click="loadGoogleSheetPreview"
                                    >
                                        <f7-icon :f7="hasGoogleToken ? 'sparkles' : 'logo_google'" size="18" class="margin-right-half" />
                                        {{ hasGoogleToken ? 'Inspect Google Sheet' : 'Hubungkan Akun & Inspect' }}
                                    </f7-button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- ── Step 2: Configure ── -->
                    <div v-if="step === 2" class="wizard-step">
                        <div class="step-header">
                            <div class="step-header-icon">
                                <f7-icon f7="table" size="28" class="step-header-icon-inner"></f7-icon>
                            </div>
                            <h3 class="step-title">Configure Data Source</h3>
                            <p class="step-subtitle">Review columns and set field types before importing</p>
                        </div>

                        <f7-list inset class="config-list">
                            <f7-list-input label="Table Name" type="text" placeholder="e.g. Sales Data"
                                :value="tableName" @input="tableName = ($event.target as HTMLInputElement).value"
                                required validate clear-button></f7-list-input>

                            <f7-list-input v-if="sheets.length > 1" label="Sheet" type="select" :value="selectedSheet"
                                @change="handleSheetChange">
                                <option v-for="sheet in sheets" :key="sheet" :value="sheet">{{ sheet }}</option>
                            </f7-list-input>
                        </f7-list>

                        <!-- Loading Preview -->
                        <div v-if="isLoadingPreview" class="preview-loading">
                            <f7-preloader color="blue"></f7-preloader>
                            <p>Analyzing file structure...</p>
                        </div>

                        <!-- Column Mapping Table -->
                        <div v-else-if="columns.length > 0" class="preview-section">
                            <div class="preview-header">
                                <span class="preview-title">Column Mapping</span>
                                <span class="preview-count">{{ totalRows }} rows</span>
                            </div>

                            <div class="mapping-table-wrapper">
                                <table class="mapping-table">
                                    <thead>
                                        <tr>
                                            <th>Original Header</th>
                                            <th>Field Name</th>
                                            <th>Type</th>
                                            <th>Preview</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="(col, idx) in columns" :key="idx">
                                            <td class="col-original">{{ col.original_header }}</td>
                                            <td class="col-input">
                                                <input type="text" v-model="col.name" class="mapping-input" />
                                            </td>
                                            <td class="col-type">
                                                <select v-model="col.type" class="mapping-select">
                                                    <optgroup label="Basic">
                                                        <option value="text">Text (Single Line)</option>
                                                        <option value="number">Number</option>
                                                        <option value="date">Date</option>
                                                        <option value="time">Time</option>
                                                        <option value="datetime">DateTime</option>
                                                        <option value="url">URL / Hyperlink</option>
                                                    </optgroup>
                                                    <optgroup label="Choice">
                                                        <option value="select">Dropdown (Select)</option>
                                                        <option value="radio">Radio Group</option>
                                                        <option value="checkbox">Checkbox (Multi)</option>
                                                    </optgroup>
                                                    <optgroup label="Media & Location">
                                                        <option value="gps">GPS Location</option>
                                                        <option value="image">Image / Photo</option>
                                                        <option value="signature">Signature Pad</option>
                                                    </optgroup>
                                                </select>
                                            </td>
                                            <td class="col-preview">{{ getPreviewValue(col) }}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <!-- Import Button -->
                        <div class="import-action">
                            <f7-button fill large :disabled="isImporting || !tableName.trim()" @click="doImport"
                                class="import-btn">
                                <template v-if="isImporting">
                                    <f7-preloader color="white" :size="20" class="import-btn-preloader"></f7-preloader>
                                    <span>{{ importStatus || 'Importing...' }}</span>
                                </template>
                                <template v-else>
                                    <span>Import Data</span>
                                </template>
                            </f7-button>

                            <div v-if="isImporting && importProgress" class="import-progress-info">
                                <div class="import-progress-track">
                                    <div class="import-progress-fill import-progress-indeterminate"></div>
                                </div>
                                <p class="import-progress-text">{{ importProgress }}</p>
                            </div>
                        </div>
                    </div>

                </div>
            </f7-page>
        </f7-view>
    </f7-popup>
</template>

<script setup lang="ts">
import { f7 } from 'framework7-vue';
import { computed, onUnmounted, ref, watch } from 'vue';
import { ExcelImportService, type ExcelColumn } from '../../services/excelImportService';
import { GoogleSheetApi } from '@/common/api/GoogleSheetApi';
import { useGoogleOAuthPopup } from '@/common/composables/useGoogleOAuthPopup';

const props = withDefaults(defineProps<{
    opened: boolean;
    appId: string | number;
    initialSourceType?: 'file' | 'google_sheets';
}>(), {
    initialSourceType: 'file',
});

const emit = defineEmits(['update:opened', 'imported']);

const isOpen = computed({
    get: () => props.opened,
    set: (val) => emit('update:opened', val),
});

// State
const step = ref(1);
const sourceType = ref<'file' | 'google_sheets'>(props.initialSourceType || 'file');
const spreadsheetUrl = ref('');
const isDragging = ref(false);
const isUploading = ref(false);
const uploadProgress = ref(0);
const isLoadingPreview = ref(false);
const isImporting = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

// Google OAuth Integration
const { isAuthenticating, triggerOAuthPopup } = useGoogleOAuthPopup();
const hasGoogleToken = ref(false);
const tokenOwner = ref<string | null>(null);

const formattedTokenOwner = computed(() => {
    if (!tokenOwner.value) return 'Izin Google Drive & Sheets aktif';
    try {
        const parsed = typeof tokenOwner.value === 'string' && tokenOwner.value.startsWith('{')
            ? JSON.parse(tokenOwner.value)
            : tokenOwner.value;
        if (typeof parsed === 'object' && parsed !== null) {
            return `${parsed.name || ''} (${parsed.email || ''})`.trim();
        }
        return String(parsed);
    } catch {
        return String(tokenOwner.value);
    }
});

async function checkTokenStatus() {
    if (!props.appId) return;
    try {
        const res = await GoogleSheetApi.getTokenStatus(String(props.appId));
        hasGoogleToken.value = res.has_token && !res.is_expired;
        tokenOwner.value = res.owner || null;
    } catch {
        hasGoogleToken.value = false;
    }
}

watch(() => props.opened, (val) => {
    if (val) {
        if (props.initialSourceType) {
            sourceType.value = props.initialSourceType;
        }
        checkTokenStatus();
    }
});

async function handleConnectOAuth() {
    const ok = await triggerOAuthPopup(String(props.appId));
    if (ok) {
        await checkTokenStatus();
        if (hasGoogleToken.value) {
            f7.toast.show({ text: 'Akun Google berhasil dihubungkan!', closeTimeout: 2000 });
        }
    }
}

// Data
const filePath = ref('');
const sheets = ref<string[]>([]);
const selectedSheet = ref('');
const tableName = ref('');
const columns = ref<ExcelColumn[]>([]);
const keyColumn = ref('');
const previewData = ref<Record<string, unknown>[]>([]);
const totalRows = ref(0);
const importStatus = ref('');
const importProgress = ref('');

// Polling management
let pollIntervalId: ReturnType<typeof setInterval> | null = null;

// Cleanup on unmount
onUnmounted(() => {
    stopPolling();
});

function stopPolling() {
    if (pollIntervalId) {
        clearInterval(pollIntervalId);
        pollIntervalId = null;
    }
}

function handleClosed() {
    stopPolling();
    reset();
}

function reset() {
    step.value = 1;
    sourceType.value = 'file';
    spreadsheetUrl.value = '';
    filePath.value = '';
    sheets.value = [];
    selectedSheet.value = '';
    tableName.value = '';
    columns.value = [];
    keyColumn.value = '';
    previewData.value = [];
    totalRows.value = 0;
    importStatus.value = '';
    importProgress.value = '';
    isImporting.value = false;
    isLoadingPreview.value = false;
    isUploading.value = false;
    isDragging.value = false;
}

function selectSourceType(type: 'file' | 'google_sheets') {
    sourceType.value = type;
    if (type === 'google_sheets') {
        checkTokenStatus();
    }
}

function triggerFileSelect() {
    if (!isUploading.value) {
        sourceType.value = 'file';
        fileInput.value?.click();
    }
}

async function handleFileSelect(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
        await uploadFile(file);
    }
    // Reset input value to allow re-uploading the same file
    if (event.target) {
        (event.target as HTMLInputElement).value = '';
    }
}

async function handleDrop(event: DragEvent) {
    isDragging.value = false;
    const file = event.dataTransfer?.files[0];
    if (file) {
        await uploadFile(file);
    }
}

async function uploadFile(file: File) {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
        f7.dialog.alert('Invalid file format. Please upload an Excel or CSV file.');
        return;
    }

    isUploading.value = true;
    uploadProgress.value = 0;
    sourceType.value = 'file';

    try {
        const result = await ExcelImportService.uploadChunked(file, (percent) => {
            uploadProgress.value = percent;
        });
        filePath.value = result.file_path;
        tableName.value = file.name
            .replace(/\.[^/.]+$/, '')
            .replace(/[^a-zA-Z0-9]/g, ' ')
            .trim();
        step.value = 2;
        await loadPreview();
    } catch (e) {
        const msg = e instanceof Error ? e.message : 'Upload failed';
        f7.dialog.alert(msg);
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
        totalRows.value = result.total_rows ?? 0;
        sheets.value = result.sheets ?? [];

        // Set default sheet if not already selected
        if (!selectedSheet.value && sheets.value.length > 0) {
            selectedSheet.value = sheets.value[0] || '';
        }
    } catch (e) {
        const msg = e instanceof Error ? e.message : 'Preview failed';
        f7.dialog.alert(msg);
    } finally {
        isLoadingPreview.value = false;
    }
}

async function loadGoogleSheetPreview() {
    if (!spreadsheetUrl.value.trim()) {
        f7.dialog.alert('Masukkan URL Google Spreadsheet');
        return;
    }

    // Auto-prompt Google OAuth if token is not yet connected
    if (!hasGoogleToken.value) {
        const ok = await triggerOAuthPopup(String(props.appId));
        if (!ok) return;
        await checkTokenStatus();
    }

    isLoadingPreview.value = true;

    try {
        const res = await GoogleSheetApi.inspectSchema(String(props.appId), {
            spreadsheet_url: spreadsheetUrl.value.trim(),
            sheet_name: selectedSheet.value || undefined,
        });

        sheets.value = res.sheets;
        selectedSheet.value = res.selected_sheet;
        columns.value = res.columns as any;
        keyColumn.value = res.suggested_key;
        previewData.value = res.preview as any;
        totalRows.value = res.preview.length;

        if (!tableName.value) {
            tableName.value = res.selected_sheet || res.title || 'Sheet Data';
        }

        step.value = 2;
    } catch (e: any) {
        const msg = e.response?.data?.message || (e instanceof Error ? e.message : 'Gagal membaca Google Sheet');
        f7.dialog.alert(msg);
    } finally {
        isLoadingPreview.value = false;
    }
}

function handleSheetChange(e: Event) {
    selectedSheet.value = (e.target as HTMLSelectElement).value;
    if (sourceType.value === 'google_sheets') {
        loadGoogleSheetPreview();
    } else {
        loadPreview();
    }
}

function getPreviewValue(col: ExcelColumn): string {
    if (previewData.value.length === 0) return '—';
    const firstRow = previewData.value[0];
    if (!firstRow) return '—';

    // If firstRow is an array, look up by source_index or columns index
    if (Array.isArray(firstRow)) {
        const index = col.source_index !== undefined ? col.source_index : columns.value.indexOf(col);
        const val = firstRow[index];
        return val !== null && val !== undefined ? String(val) : '—';
    }

    // Fallback if firstRow is an object
    const val = (firstRow as Record<string, any>)[col.name] !== undefined 
        ? (firstRow as Record<string, any>)[col.name] 
        : (firstRow as Record<string, any>)[col.original_header];
    return val !== null && val !== undefined ? String(val) : '—';
}

async function doImport() {
    if (!tableName.value.trim()) {
        f7.dialog.alert('Please enter a table name');
        return;
    }

    isImporting.value = true;
    importStatus.value = 'Starting import...';
    importProgress.value = '';

    try {
        if (sourceType.value === 'google_sheets') {
            const res = await GoogleSheetApi.createTableFromSheet(String(props.appId), {
                spreadsheet_url: spreadsheetUrl.value,
                table_name: tableName.value,
                sheet_name: selectedSheet.value || undefined,
                columns: columns.value as any,
                key_column: keyColumn.value || undefined,
            });

            finishImport(res.table_id);
            return;
        }

        const result = await ExcelImportService.import(
            props.appId,
            tableName.value,
            filePath.value,
            columns.value,
            selectedSheet.value,
        );

        if (result.job_id) {
            // Start polling for async import
            startPolling(result.job_id, result.table_id);
        } else {
            // Synchronous import completed
            finishImport(result.table_id);
        }
    } catch (e) {
        const err = e as Record<string, any>;
        const msg = err?.response?.data?.error || err?.response?.data?.message || (e instanceof Error ? e.message : 'Import failed');
        f7.dialog.alert(msg);
        isImporting.value = false;
        importStatus.value = '';
        importProgress.value = '';
    }
}

function startPolling(jobId: string, tableId: string) {
    // Clear any existing polling
    stopPolling();

    // Start new polling interval
    pollIntervalId = setInterval(async () => {
        try {
            const status = await ExcelImportService.checkStatus(jobId);

            if (status.status === 'completed') {
                stopPolling();
                finishImport(tableId);
                return;
            }

            if (status.status === 'failed') {
                stopPolling();
                throw new Error(status.message || 'Import failed');
            }

            // Update progress
            importStatus.value = status.message || 'Processing...';
            if (status.rows_processed) {
                importProgress.value = `${status.rows_processed} rows processed`;
            }
        } catch (e) {
            stopPolling();
            const msg = e instanceof Error ? e.message : 'Import failed during processing';
            importStatus.value = '';
            importProgress.value = '';
            isImporting.value = false;
            f7.dialog.alert(msg);
        }
    }, 2000);
}

function finishImport(tableId: string) {
    stopPolling();
    isOpen.value = false;

    f7.toast.create({
        text: '✓ Data imported successfully',
        position: 'center',
        closeTimeout: 2000,
    }).open();

    emit('imported', { table_id: tableId });

    // Reset state after a short delay to allow popup to close smoothly
    setTimeout(() => {
        reset();
    }, 300);
}
</script>

<style scoped src="./ExcelImportModal.css"></style>