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
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <h4 style="margin: 0;">CSV Format Requirements:</h4>
                        <f7-button small fill color="blue" @click.stop.prevent="downloadTemplateCSV">
                            <f7-icon f7="arrow_down_circle" size="14" />
                            <span class="margin-left-half">Download CSV Template</span>
                        </f7-button>
                    </div>
                    <ul>
                        <li>First row must be column headers</li>
                        <li>Each row represents one assignment</li>
                        <li>UTF-8 encoding recommended</li>
                    </ul>
                </f7-block>
            </div>

            <!-- Step 2: Preview & Map -->
            <div v-if="step === 'preview'" class="import-step">
                <!-- Safety Guardrail Notice -->
                <div class="safety-reassurance-card">
                    <f7-icon f7="shield_fill" color="green" size="20" />
                    <div class="safety-text">
                        <strong>Proteksi Data Lapangan Aktif:</strong>
                        Data jawaban survei yang sudah diisi/dikirim oleh surveyor di lapangan aman dan tidak akan hilang.
                    </div>
                </div>

                <!-- Key Detection Contextual Card -->
                <div class="key-contextual-card" :class="matchKey ? 'key-found' : 'key-synthetic'">
                    <f7-icon :f7="matchKey ? 'checkmark_shield_fill' : 'info_circle_fill'" :color="matchKey ? 'blue' : 'orange'" size="18" />
                    <div class="key-contextual-text" v-if="matchKey">
                        <strong>Kunci Pencocokan Terdeteksi:</strong>
                        Menggunakan kolom <code>{{ matchKey }}</code> untuk mencocokkan data lama & baru secara akurat.
                    </div>
                    <div class="key-contextual-text" v-else>
                        <strong>Posisi Baris Urut (Synthetic Key):</strong>
                        Tidak ada kolom ID khusus. Cerdas otomatis memetakan berdasarkan urutan baris (Baris #1 ➔ Tugas #1).
                    </div>
                </div>

                <f7-block-title>Preview (5 Baris Pertama)</f7-block-title>
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

                <f7-block-title>Pemetaan Kolom (Column Mapping)</f7-block-title>
                <f7-list inset strong>
                    <f7-list-item v-for="col in csvColumns" :key="col" :title="col">
                        <template #after>
                            <select :value="columnMapping[col]" @change="updateMapping(col, $event)">
                                <option value="">— Lewati (Skip) —</option>
                                <option v-if="col.toLowerCase().includes('id')" :value="col">🔑 Kunci ID ({{ col }})</option>
                                <option v-for="field in availableFields" :key="field.name" :value="field.name">
                                    {{ field.label }} ({{ field.name }})
                                </option>
                                <option v-if="!availableFields.some(f => f.name === col) && !col.toLowerCase().includes('id')" :value="col">
                                    ✨ Simpan Kolom Baru ({{ col }})
                                </option>
                            </select>
                        </template>
                    </f7-list-item>
                </f7-list>

                <!-- Strategy Selection -->
                <f7-block-title>Pilihan Strategi Impor</f7-block-title>
                <div class="strategy-options-container">
                    <label class="strategy-card" :class="{ active: strategy === 'upsert' }">
                        <input type="radio" value="upsert" v-model="strategy" />
                        <div class="strategy-card-content">
                            <div class="strategy-card-title">
                                <span>🔄 Perbarui & Tambah Data (UPSERT)</span>
                                <span class="badge-recommended">Rekomendasi</span>
                            </div>
                            <div class="strategy-card-desc">
                                Memperbarui data prelist yang sudah ada dan menambahkan entri baru. Aman untuk operasional lapangan.
                            </div>
                        </div>
                    </label>

                    <label class="strategy-card" :class="{ active: strategy === 'merge_columns' }">
                        <input type="radio" value="merge_columns" v-model="strategy" />
                        <div class="strategy-card-content">
                            <div class="strategy-card-title">
                                <span>➕ Gabungkan Kolom Baru (Merge Columns)</span>
                            </div>
                            <div class="strategy-card-desc">
                                Menyuntikkan kolom baru ke data yang ada tanpa mengubah nilai kolom lainnya.
                            </div>
                        </div>
                    </label>

                    <label class="strategy-card" :class="{ active: strategy === 'append' }">
                        <input type="radio" value="append" v-model="strategy" />
                        <div class="strategy-card-content">
                            <div class="strategy-card-title">
                                <span>📥 Hanya Tambahkan Baris Baru (Append Only)</span>
                            </div>
                            <div class="strategy-card-desc">
                                Menambahkan semua baris sebagai tugas baru tanpa memeriksa duplikasi data lama.
                            </div>
                        </div>
                    </label>

                    <label class="strategy-card" :class="{ active: strategy === 'replace_prelist' }">
                        <input type="radio" value="replace_prelist" v-model="strategy" />
                        <div class="strategy-card-content">
                            <div class="strategy-card-title">
                                <span>⚠️ Ganti Bersih Prelist Belum Dikerjakan</span>
                            </div>
                            <div class="strategy-card-desc">
                                Mengganti seluruh data prelist yang belum dimulai oleh surveyor di lapangan.
                            </div>
                        </div>
                    </label>
                </div>

                <!-- Match Key Dropdown -->
                <div v-if="strategy === 'upsert' || strategy === 'merge_columns'" class="match-key-block">
                    <div class="match-key-title">Kolom Kunci Pencocokan (Match Key):</div>
                    <select v-model="matchKey" class="match-key-select">
                        <option value="">-- Posisi Baris Urut Otomatis (Row Position) --</option>
                        <option v-if="csvColumns.some(c => c.toLowerCase().includes('id'))" :value="csvColumns.find(c => c.toLowerCase().includes('id'))">
                            🔑 {{ csvColumns.find(c => c.toLowerCase().includes('id')) }} (Rekomendasi ID)
                        </option>
                        <option v-for="field in availableFields" :key="field.name" :value="field.name">
                            {{ field.label || field.name }} ({{ field.name }})
                        </option>
                    </select>
                </div>

                <f7-toolbar bottom>
                    <f7-link @click="step = 'upload'">Kembali</f7-link>
                    <f7-button fill color="blue" @click="confirmImport" :disabled="isImporting">
                        <f7-icon f7="arrow_down_circle" size="14" :class="{ 'spin': isImporting }" class="margin-right-half" />
                        {{ isImporting ? 'Memproses...' : `Impor ${csvData.length} Baris Data` }}
                    </f7-button>
                </f7-toolbar>
            </div>

            <!-- Step 3: Success -->
            <div v-if="step === 'success'" class="import-step success-step">
                <f7-icon f7="checkmark_circle_fill" class="success-icon" />
                <h2>Impor Data Berhasil!</h2>
                <div class="import-summary-box">
                    <div class="summary-item" v-if="importStats.updated > 0">
                        <span class="summary-label">Diperbarui di tempat:</span>
                        <span class="summary-val text-color-blue font-bold">{{ importStats.updated }} baris</span>
                    </div>
                    <div class="summary-item" v-if="importStats.created > 0">
                        <span class="summary-label">Baris baru ditambahkan:</span>
                        <span class="summary-val text-color-green font-bold">{{ importStats.created }} baris</span>
                    </div>
                    <div class="summary-item" v-if="importStats.soft_deleted > 0">
                        <span class="summary-label">Prelist lama dibersihkan:</span>
                        <span class="summary-val text-color-orange font-bold">{{ importStats.soft_deleted }} baris</span>
                    </div>
                    <div class="summary-item total-item">
                        <span class="summary-label">Total data aktif:</span>
                        <span class="summary-val font-bold">{{ importStats.total }} tugas survei</span>
                    </div>
                </div>
                <f7-button fill popup-close class="margin-top">Selesai</f7-button>
            </div>
        </f7-page>
    </f7-popup>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { f7 } from 'framework7-vue';
import { useTableEditor } from '../../composables/useTableEditor';
import { ApiClient } from '../../../../common/api/ApiClient';

// ============================================================================
// Props & Emits
// ============================================================================

interface Props {
    opened: boolean;
    fields?: any[];
    appId?: string;
    tableId?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
    close: [];
    import: [data: Record<string, unknown>[]];
}>();

// ============================================================================
// State
// ============================================================================

const { fields } = useTableEditor();

const step = ref<'upload' | 'preview' | 'success'>('upload');
const isDragging = ref(false);
const isImporting = ref(false);
const fileInput = ref<HTMLInputElement>();
const csvData = ref<Record<string, string>[]>([]);
const csvColumns = ref<string[]>([]);
const columnMapping = ref<Record<string, string>>({});
const strategy = ref<'upsert' | 'merge_columns' | 'append' | 'replace_prelist'>('upsert');
const matchKey = ref<string>('');
const importedCount = ref(0);
const importStats = ref({ updated: 0, created: 0, soft_deleted: 0, total: 0 });

// ============================================================================
// Computed
// ============================================================================

const availableFields = computed(() => {
    if (props.fields && Array.isArray(props.fields) && props.fields.length > 0) {
        return props.fields;
    }
    return fields.value || [];
});

const previewRows = computed(() => {
    return csvData.value.slice(0, 5);
});

// ============================================================================
// Methods
// ============================================================================

async function downloadTemplateCSV() {
    const list = availableFields.value;
    if (!list || list.length === 0) {
        f7.dialog.alert('Silakan pilih tabel pada filter toolbar di atas terlebih dahulu.');
        return;
    }

    const headers = list.map((f: any) => f.name || f.key || 'field');
    const sampleValues = list.map((f: any) => `[Contoh ${f.label || f.name}]`);
    const csvContent = [
        headers.join(','),
        sampleValues.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
    ].join('\r\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const finalFileName = `template_import_${props.tableId || props.appId || 'data'}.csv`;

    // 1. Native File System Access API (Modern July 2026 Web Standard)
    if ('showSaveFilePicker' in window) {
        try {
            const handle = await (window as any).showSaveFilePicker({
                suggestedName: finalFileName,
                types: [{ description: 'CSV File', accept: { 'text/csv': ['.csv'] } }],
            });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
            f7.toast.create({ text: '✅ Template CSV Tersimpan!', closeTimeout: 2000 }).open();
            return;
        } catch (e) {
            console.warn('[CSV Template Picker] Handled fallback after cancel/error:', e);
        }
    }

    // 2. Standard Blob Anchor Fallback
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = finalFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 2000);
}

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

        // Auto-map columns to fields and auto-detect system export headers
        columnMapping.value = {};
        const systemIgnoreCols = new Set([
            'status', 'submitted version', 'created at', 'updated at', 'deleted at', 
            'status history', 'enumerator', 'supervisor', 'organization'
        ]);

        let detectedMatchKey = '';

        for (const col of csvColumns.value) {
            const cleanCol = col.toLowerCase().trim();

            // 1. Detect ID column as matchKey
            if (cleanCol === 'assignment id' || cleanCol === 'assignment_id' || cleanCol === 'id' || cleanCol === 'external_id') {
                detectedMatchKey = col;
                columnMapping.value[col] = col; // keep for backend matching
                continue;
            }

            // 2. Automatically ignore system metadata/status columns
            if (systemIgnoreCols.has(cleanCol)) {
                columnMapping.value[col] = ''; // skip
                continue;
            }

            // 3. Match against schema fields
            const matchedField = availableFields.value.find(
                f => f.name.toLowerCase() === cleanCol ||
                    f.label?.toLowerCase() === cleanCol
            );
            if (matchedField) {
                columnMapping.value[col] = matchedField.name;
            } else {
                // 4. If it's a new supplementary column, keep it as-is so backend can store it
                columnMapping.value[col] = col;
            }
        }

        if (detectedMatchKey) {
            matchKey.value = detectedMatchKey;
            strategy.value = 'upsert';
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

async function confirmImport() {
    if (!props.tableId) {
        f7.dialog.alert('Tabel target tidak ditemukan. Pastikan memilih tabel terlebih dahulu.', 'Error');
        return;
    }

    // Transform CSV data using column mapping
    const mappedData = csvData.value.map(row => {
        const mapped: Record<string, unknown> = {};
        for (const [csvCol, fieldName] of Object.entries(columnMapping.value)) {
            if (fieldName && row[csvCol] !== undefined) {
                mapped[fieldName] = row[csvCol];
            }
        }
        return mapped;
    }).filter(row => Object.keys(row).length > 0);

    if (mappedData.length === 0) {
        f7.dialog.alert('Tidak ada data valid yang dipetakan.', 'Peringatan');
        return;
    }

    isImporting.value = true;
    try {
        const res = await ApiClient.post('/assignments/import-json', {
            table_id: props.tableId,
            rows: mappedData,
            strategy: strategy.value,
            match_key: matchKey.value || undefined,
        });

        if (res.data?.success) {
            importStats.value = {
                updated: res.data.updated || 0,
                created: res.data.created || 0,
                soft_deleted: res.data.soft_deleted || 0,
                total: res.data.total || mappedData.length,
            };
            importedCount.value = res.data.total || mappedData.length;
            emit('import', mappedData);
            step.value = 'success';
        } else {
            f7.dialog.alert(res.data?.message || 'Gagal mengimpor data', 'Error');
        }
    } catch (err: any) {
        f7.dialog.alert('Gagal mengimpor data: ' + (err.response?.data?.message || err.message || err), 'Error');
    } finally {
        isImporting.value = false;
    }
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

/* Safety Reassurance Card */
.safety-reassurance-card {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 8px;
    padding: 12px 14px;
    margin-bottom: 16px;
    color: #166534;
    font-size: 13px;
    line-height: 1.4;
}

.safety-text {
    flex: 1;
}

/* Key Contextual Notice */
.key-contextual-card {
    display: flex;
    align-items: center;
    gap: 10px;
    border-radius: 8px;
    padding: 10px 14px;
    margin-bottom: 16px;
    font-size: 12px;
    line-height: 1.4;
}

.key-contextual-card.key-found {
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    color: #1e40af;
}

.key-contextual-card.key-synthetic {
    background: #fffbeb;
    border: 1px solid #fde68a;
    color: #92400e;
}

.key-contextual-card code {
    background: rgba(0, 0, 0, 0.06);
    padding: 1px 5px;
    border-radius: 4px;
    font-weight: 600;
}

.key-contextual-text {
    flex: 1;
}

/* Strategy Options */
.strategy-options-container {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin: 12px 0 16px;
}

.strategy-card {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 14px;
    background: var(--f7-list-item-bg-color, #ffffff);
    border: 1.5px solid var(--f7-list-border-color, #e2e8f0);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.strategy-card:hover {
    border-color: #93c5fd;
    background: #f8fafc;
}

.strategy-card.active {
    border-color: #3b82f6;
    background: #eff6ff;
}

.strategy-card input[type="radio"] {
    margin-top: 3px;
    accent-color: #3b82f6;
}

.strategy-card-content {
    flex: 1;
}

.strategy-card-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    font-size: 14px;
    color: #1e293b;
}

.badge-recommended {
    font-size: 10px;
    font-weight: bold;
    padding: 2px 6px;
    border-radius: 10px;
    background: #22c55e;
    color: #ffffff;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.strategy-card-desc {
    font-size: 12px;
    color: #64748b;
    margin-top: 2px;
    line-height: 1.35;
}

/* Match Key Block */
.match-key-block {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 20px;
}

.match-key-title {
    font-size: 12px;
    font-weight: 600;
    color: #475569;
    margin-bottom: 6px;
}

.match-key-select {
    width: 100%;
    padding: 8px 10px;
    font-size: 13px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    background: #ffffff;
}

/* Import Summary Box */
.import-summary-box {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 16px;
    width: 100%;
    max-width: 320px;
    margin-top: 12px;
    text-align: left;
}

.summary-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 0;
    font-size: 13px;
    color: #334155;
    border-bottom: 1px dashed #e2e8f0;
}

.summary-item.total-item {
    border-bottom: none;
    border-top: 1.5px solid #cbd5e1;
    margin-top: 6px;
    padding-top: 8px;
    font-size: 14px;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.spin {
    animation: spin 1s linear infinite;
}
</style>
