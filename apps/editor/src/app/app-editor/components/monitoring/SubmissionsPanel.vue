<template>
    <div class="submissions-panel">
        <!-- Toolbar -->
        <div class="monitoring-toolbar-wrapper">
            <div class="monitoring-toolbar">
                <div class="search-and-filter-bar">
                    <f7-searchbar 
                        :value="searchQuery" 
                        placeholder="Search enumerator or data..."
                        @input="searchQuery = ($event.target as HTMLInputElement).value" 
                        :disable-button="false"
                        class="monitoring-search" 
                    />
                    <f7-button 
                        small 
                        outline 
                        :fill="showAdvancedFilters" 
                        class="advanced-filter-btn" 
                        @click="showAdvancedFilters = !showAdvancedFilters"
                    >
                        <f7-icon f7="slider_horizontal_3" size="14" />
                        <span class="margin-left-half">Filter ({{ activeFilters.length }})</span>
                    </f7-button>
                </div>
                <div class="filter-row">
                    <div class="table-filter-wrapper">
                        <select v-model="tableFilter" class="table-filter-select">
                            <option v-for="table in appTables" :key="table.id" :value="table.id">
                                {{ table.name }}
                            </option>
                        </select>
                    </div>
                    <f7-segmented strong class="status-filter">
                        <f7-button :active="statusFilter === 'all'" @click="statusFilter = 'all'" small>
                            All
                        </f7-button>
                        <!-- complex mode only: submitted entries waiting for supervisor review -->
                        <f7-button v-if="appMode === 'complex'" :active="statusFilter === 'submitted'" @click="statusFilter = 'submitted'" small>
                            Pending Review
                        </f7-button>
                        <!-- in_progress is relevant for both modes -->
                        <f7-button :active="statusFilter === 'in_progress'" @click="statusFilter = 'in_progress'" small>
                            In Progress
                        </f7-button>
                        <!-- approved/submitted terminal state -->
                        <f7-button :active="statusFilter === 'approved'" @click="statusFilter = 'approved'" small>
                            {{ appMode === 'simple' ? 'Submitted' : 'Approved' }}
                        </f7-button>
                        <!-- complex mode only: rejected by supervisor, returned to enumerator -->
                        <f7-button v-if="appMode === 'complex'" :active="statusFilter === 'rejected'" @click="statusFilter = 'rejected'" small>
                            Returned
                        </f7-button>
                    </f7-segmented>
                    <div style="display: flex; gap: 8px;">
                        <f7-button v-if="appMode === 'complex'" small fill @click="showImportPopup = true">
                            <f7-icon f7="arrow_down_doc" size="14" />
                            Import CSV
                        </f7-button>
                        <f7-button small fill color="blue" @click="exportData" :disabled="loading || isExporting || !tableFilter">
                            <f7-icon f7="arrow_down_circle" size="14" :class="{ 'spin': isExporting }" />
                            Export
                        </f7-button>
                        <f7-button small outline class="refresh-btn" @click="fetchResponses" :disabled="loading">
                            <f7-icon f7="arrow_counterclockwise" size="14" :class="{ 'spin': loading }" />
                            Refresh
                        </f7-button>
                    </div>
                </div>
            </div>

            <!-- Advanced Filter Builder Panel (Adaptable, robust dynamic schema filter) -->
            <div v-if="showAdvancedFilters" class="advanced-filters-panel card padding margin-vertical-half">
                <div class="display-flex justify-content-space-between align-items-center margin-bottom-half">
                    <div class="font-bold size-14">Filter Data Kustom</div>
                    <div class="display-flex gap-half">
                        <f7-button small outline color="red" @click="clearAllFilters" :disabled="activeFilters.length === 0">
                            Hapus Semua
                        </f7-button>
                        <f7-button small fill color="blue" @click="addFilter">
                            + Tambah Filter
                        </f7-button>
                    </div>
                </div>

                <div v-if="activeFilters.length === 0" class="text-align-center text-color-gray padding-vertical size-12">
                    Belum ada filter kustom. Gunakan tombol "+ Tambah Filter" untuk menyaring data berdasarkan kolom formulir secara robust.
                </div>

                <div v-else class="filters-list">
                    <div v-for="(filter, index) in activeFilters" :key="index" class="filter-item-row">
                        <!-- Dropdown Field -->
                        <div class="filter-col field-col">
                            <select v-model="filter.field" @change="fetchResponses" class="filter-select">
                                <option value="" disabled>-- Pilih Kolom --</option>
                                <option v-for="field in availableFilterFields" :key="field.name" :value="field.name">
                                    {{ field.label }} ({{ field.type }})
                                </option>
                            </select>
                        </div>

                        <!-- Dropdown Operator -->
                        <div class="filter-col operator-col">
                            <select v-model="filter.operator" @change="fetchResponses" class="filter-select">
                                <option value="equals">Sama Dengan (=)</option>
                                <option value="contains">Mengandung (Like)</option>
                                <option value="starts_with">Berawalan Dengan</option>
                                <option value="ends_with">Berakhiran Dengan</option>
                                <option value="greater_than">Lebih Besar Dari (&gt;)</option>
                                <option value="less_than">Lebih Kecil Dari (&lt;)</option>
                            </select>
                        </div>

                        <!-- Input Value -->
                        <div class="filter-col value-col">
                            <input 
                                type="text" 
                                v-model="filter.value" 
                                placeholder="Cari nilai..." 
                                @input="fetchResponses" 
                                class="filter-input" 
                            />
                        </div>

                        <!-- Action Button -->
                        <div class="filter-col action-col">
                            <f7-link @click="removeFilter(index)" color="red">
                                <f7-icon f7="trash" size="18" />
                            </f7-link>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Assignments Grid (Comprehensive Monitoring) -->
        <div class="monitoring-content">
            <div v-if="responses.length > 0" class="data-table">
                <table>
                    <thead>
                        <tr>
                            <th>Status</th>
                            <th>Enumerator</th>
                            <th>Data Preview</th>
                            <th>Last Updated</th>
                            <th class="actions-cell">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in responses" :key="item.id" class="data-row">
                            <td>
                                <span class="status-chip" :class="`status-${item.status}`">
                                    {{ formatStatusLabel(item.status) }}
                                </span>
                            </td>
                            <td class="enumerator-cell">{{ item.enumerator?.name || 'Unassigned' }}</td>
                            <td class="preview-cell">{{ formatPreview(item) }}</td>
                            <td class="date-cell">{{ formatDate(item.updated_at) }}</td>
                            <td class="actions-cell">
                                <div style="display: flex; gap: 6px; align-items: center;">
                                    <f7-button small fill color="blue" @click="openReview(item)">Review</f7-button>
                                    <f7-button small outline color="red" @click="confirmDeleteSubmission(item)">Delete</f7-button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div class="data-table-footer">
                    <div class="data-table-pagination">
                        <span class="data-table-pagination-label">
                            {{ (pagination.page - 1) * 100 + 1 }}-{{ Math.min(pagination.page * 100, pagination.total) }} of {{ pagination.total }}
                        </span>
                        <a href="#" class="link" :class="{ disabled: pagination.page === 1 }" @click.prevent="prevPage">
                            <i class="icon f7-icons">chevron_left</i>
                        </a>
                        <a href="#" class="link" :class="{ disabled: pagination.page >= Math.ceil(pagination.total / 100) || pagination.total === 0 }" @click.prevent="nextPage">
                            <i class="icon f7-icons">chevron_right</i>
                        </a>
                    </div>
                </div>
            </div>

            <!-- Loading State -->
            <div v-if="loading && responses.length === 0" class="monitoring-loader">
                <f7-preloader />
                <p>Loading submissions...</p>
            </div>

            <!-- Empty State -->
            <div v-if="!loading && responses.length === 0" class="monitoring-empty">
                <div class="empty-icon-wrap">
                    <f7-icon f7="tray" class="empty-icon" />
                </div>
                <p class="empty-title">No data found</p>
                <p class="empty-subtitle">Data from Enumerators or Imported Base Data will appear here</p>
            </div>
        </div>

        <!-- Review Drawer -->
        <ResponseReviewDrawer 
            v-model:opened="showReview" 
            :response="selectedResponse" 
            @action-complete="fetchResponses"
        />

        <!-- CSV Import Popup -->
        <CsvImportPopup :opened="showImportPopup" @close="showImportPopup = false" @import="handleImportData" />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useAppStore } from '../../../../stores/app.store';
import { useTableStore } from '../../../../stores/table.store';
import { ApiClient, getApiBaseUrl } from '../../../../common/api/ApiClient';
import ResponseReviewDrawer from './ResponseReviewDrawer.vue';
import CsvImportPopup from './CsvImportPopup.vue';
import { f7 } from 'framework7-vue';
import axios from 'axios';

const appStore = useAppStore();
const tableStore = useTableStore();

// ============================================================================
// State
// ============================================================================

const responses = ref<any[]>([]);
const loading = ref(false);
const searchQuery = ref('');
const statusFilter = ref('all');
const tableFilter = ref<string>('');
const pagination = ref({ page: 1, total: 0 });

const selectedResponse = ref<any | null>(null);
const showReview = ref(false);
const showImportPopup = ref(false);
const isExporting = ref(false);

// Advanced JSON Filters
const showAdvancedFilters = ref(false);
const activeFilters = ref<{ field: string; operator: string; value: string }[]>([]);

const appMode = computed(() => appStore.currentApp?.mode || 'simple');
const appTables = computed(() => appStore.currentApp?.tables || []);

// Schema fields resolution from active table
const schemaFields = computed(() => {
    if (!tableFilter.value) return [];
    const table = tableStore.tables.find(t => t.id === tableFilter.value) as any;
    if (!table) return [];
    
    // Check multiple potential locations of fields (root property, latest version, or current version relation)
    let fields = table.fields || 
                 table.latest_published_version?.fields || 
                 table.latestPublishedVersion?.fields || 
                 table.current_version_model?.fields;
                 
    if (typeof fields === 'string') {
        try { fields = JSON.parse(fields); } catch { fields = []; }
    }
    
    if (fields && !Array.isArray(fields) && (fields as any).fields) {
        fields = (fields as any).fields;
    }
    
    return Array.isArray(fields) ? fields : [];
});

// Flat helper to extract sub-fields from repeat/groups (dot notation support)
function flattenFields(fields: any[], prefix = ''): { name: string; label: string; type: string }[] {
    let result: any[] = [];
    fields.forEach(f => {
        const fieldName = prefix ? `${prefix}.${f.name}` : f.name;
        const fieldLabel = prefix ? `${prefix} ➔ ${f.label || f.name}` : (f.label || f.name);
        
        if (f.type === 'group' || f.type === 'repeat') {
            if (f.fields && Array.isArray(f.fields)) {
                result = result.concat(flattenFields(f.fields, fieldName));
            }
        } else {
            result.push({ name: fieldName, label: fieldLabel, type: f.type || 'text' });
        }
    });
    return result;
}

const availableFilterFields = computed(() => {
    return flattenFields(schemaFields.value);
});

// Filter management
function addFilter() {
    activeFilters.value.push({ field: '', operator: 'contains', value: '' });
}

function removeFilter(index: number) {
    activeFilters.value.splice(index, 1);
    fetchResponses();
}

function clearAllFilters() {
    activeFilters.value = [];
    fetchResponses();
}

// ============================================================================
// Methods
// ============================================================================

async function fetchResponses() {
    if (!appStore.currentApp?.id || !tableFilter.value) return;
    
    loading.value = true;
    try {
        const params: any = {
            search: searchQuery.value,
            status: statusFilter.value,
            page: pagination.value.page,
            per_page: 100,
            table_id: tableFilter.value,
            filters: activeFilters.value.length > 0 ? JSON.stringify(activeFilters.value) : undefined
        };

        const res = await ApiClient.get(`/apps/${appStore.currentApp.id}/responses`, params);
        responses.value = res.data.data.data;
        pagination.value.total = res.data.data.total;
    } catch (e) {
        console.error('Failed to fetch responses', e);
    } finally {
        loading.value = false;
    }
}

function confirmDeleteSubmission(item: any) {
    f7.dialog.confirm(
        'Apakah Anda yakin ingin menghapus data submission ini?',
        'Konfirmasi Hapus Data',
        async () => {
            try {
                await ApiClient.delete(`/assignments/${item.id}`);
                f7.toast.show({ text: 'Data berhasil dihapus dari server', closeTimeout: 2000 });
                await fetchResponses();
            } catch (e: any) {
                f7.dialog.alert('Gagal menghapus data: ' + (e.message || e), 'Error');
            }
        }
    );
}

function nextPage() {
    if (pagination.value.page < Math.ceil(pagination.value.total / 100)) {
        pagination.value.page++;
        fetchResponses();
    }
}

function prevPage() {
    if (pagination.value.page > 1) {
        pagination.value.page--;
        fetchResponses();
    }
}

/**
 * Export CSV using Async Queue Polling + Fetch/Blob (April 2026 Best Practice).
 * - Safe for massive datasets (>300k rows) as it offloads work to strict queue worker.
 * - Progress update visible to user.
 * - Prevents HTTP timeout since generation is detached.
 */
async function exportData() {
    if (!tableFilter.value) return;

    isExporting.value = true;
    const toast = f7.toast.create({ text: 'Meminta export dari server...', closeTimeout: 0 }).open();

    try {
        const token = localStorage.getItem('auth_token') || '';
        const baseUrl = getApiBaseUrl();
        
        const reqRes = await axios.post(`${baseUrl}/tables/${tableFilter.value}/export/request?version=current`, {}, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const jobId = reqRes.data.job_id;
        if (!jobId) throw new Error("No job ID returned");

        // 2. Poll Status
        const pollResult: any = await pollExportStatus(jobId, baseUrl, token, toast);
        if (!pollResult.success) throw new Error(pollResult.error);

        toast.close();

        // 3. Final Step: Show "Ready" Dialog
        f7.dialog.create({
            title: 'Data Siap!',
            text: `Export berhasil diproses (${pollResult.totalRows} baris).`,
            buttons: [
                {
                    text: 'Unduh Sekarang',
                    strong: true,
                    onClick: async () => {
                        try {
                            const fileName = "Export_" + tableFilter.value + ".csv";
                            await downloadExportFile(jobId, baseUrl, token, fileName);
                        } catch (err: any) {
                            f7.dialog.alert(err.message || 'Gagal mengunduh file.');
                        }
                    }
                },
                {
                    text: 'Tutup',
                    color: 'red'
                }
            ]
        }).open();

    } catch (e: any) {
        console.error('[Export] Error:', e);
        toast.close();
        f7.dialog.alert(e.message || 'Gagal memulai proses ekspor.');
    } finally {
        isExporting.value = false;
    }
}

/**
 * Helper: Polling Export Job Status
 */
async function pollExportStatus(jobId: string, baseUrl: string, token: string, toast: any) {
    const isDone = false;
    while (!isDone) {
        await new Promise(r => setTimeout(r, 2000));
        
        const res = await axios.get(`${baseUrl}/tables/${tableFilter.value}/export/status/${jobId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const { status, total_rows, error_message } = res.data;

        if (status === 'processing') {
            if (toast && toast.$el) {
                toast.$el.find('.toast-text').text('Sedang memproses (OOM-Safe lazy-load)...');
            }
        } else if (status === 'completed') {
            return { success: true, totalRows: total_rows };
        } else if (status === 'failed') {
            return { success: false, error: error_message || 'Job failed on server' };
        }
    }
}

/**
 * Helper: Execute the actual download
 */
async function downloadExportFile(jobId: string, baseUrl: string, token: string, fileName: string) {
    const downloadToast = f7.toast.create({ text: 'Menyiapkan data...', closeTimeout: 2000 }).open();
    
    // 1. Get Signed URL
    const urlRes = await axios.get(`${baseUrl}/tables/${tableFilter.value}/export/get-download-url/${jobId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const signedUrl = urlRes.data.download_url;
    if (!signedUrl) throw new Error("Gagal mendapatkan link unduhan.");

    // 2. Resolve URL
    let finalUrl = signedUrl;
    if (!signedUrl.startsWith('http')) {
        finalUrl = new URL(baseUrl).origin + signedUrl;
    }

    // 3. Fetch Blob
    const downloadRes = await axios.get(finalUrl, { responseType: 'blob' });
    const blob = downloadRes.data;

    // Determine the actual filename and type from blob type
    const isZip = blob.type === 'application/zip';
    const finalFileName = isZip ? fileName.replace(/\.csv$/, '.zip') : fileName;

    // 4. Save (Native Picker or Legacy)
    if ('showSaveFilePicker' in window) {
        try {
            const options: any = isZip ? {
                suggestedName: finalFileName,
                types: [{ description: 'ZIP Archive', accept: {'application/zip': ['.zip']} }],
            } : {
                suggestedName: finalFileName,
                types: [{ description: 'CSV File', accept: {'text/csv': ['.csv']} }],
            };
            const handle = await (window as any).showSaveFilePicker(options);
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
            downloadToast.close();
            f7.toast.create({ text: '✅ Tersimpan!', closeTimeout: 2000 }).open();
            return;
        } catch (e) {
            console.error('[Export Picker] Handled fallback after error/cancel:', e);
        }
    }

    // Fallback
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = finalFileName;
    link.click();
    downloadToast.close();
}

function openReview(response: any) {
    selectedResponse.value = response;
    showReview.value = true;
}

function formatPreview(item: any): string {
    // If has responses, show latest submission data
    const data = item.responses?.[0]?.data || item.prelist_data;
    if (!data) return 'No data available';
    
    // Take first 3-4 keys for a quick look
    return Object.entries(data)
        .filter(([k,v]) => typeof v !== 'object' && v !== null)
        .slice(0, 3)
        .map(([k, v]) => `${k}: ${v}`)
        .join(' · ');
}

function formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString();
}

function getStatusColor(status: string): string {
    switch (status) {
        case 'submitted': return 'orange';
        case 'completed': return 'green';
        case 'approved': return 'teal';
        case 'synced': return 'teal';
        case 'rejected': return 'red';
        case 'in_progress': return 'blue';
        case 'assigned': return 'gray';
        default: return 'gray';
    }
}

function formatStatusLabel(status: string): string {
    if (status === 'submitted') {
        return appMode.value === 'simple' ? 'Submitted' : 'Pending Review';
    }
    if (status === 'completed') return 'Completed';
    if (status === 'approved' || status === 'synced') return 'Approved';
    if (status === 'in_progress') return 'In Progress';
    if (status === 'rejected') return 'Returned';
    if (status === 'assigned') return 'Assigned';
    return status;
}

function handleImportData(mappedData: any[]) {
    // Note: The backend actual implementation using the file endpoint is pending
    // For now, this is wired up UI-wise to close and show success
    console.log('[SubmissionsPanel] Parsed CSV data to import:', mappedData);
    f7.toast.show({
        text: 'Import API wiring pending backend support for mapped JSON',
        position: 'center',
        closeTimeout: 3000
    });
    showImportPopup.value = false;
    fetchResponses();
}

// ============================================================================
// Watchers & Lifecycle
// ============================================================================

onMounted(() => {
    if (appStore.currentApp?.id) {
        tableStore.fetchTables(appStore.currentApp.id).catch(err => {
            console.error('Failed to pre-fetch tables for schema fields', err);
        });
    }
});

watch(() => appStore.currentApp?.id, (newAppId) => {
    if (newAppId) {
        tableStore.fetchTables(newAppId).catch(err => {
            console.error('Failed to fetch tables on app change', err);
        });
    }
}, { immediate: true });

watch(appTables, (tables) => {
    if (tables && tables.length > 0 && !tableFilter.value) {
        tableFilter.value = tables[0].id;
    }
}, { immediate: true });

watch([statusFilter, searchQuery, tableFilter], () => {
    if (tableFilter.value) {
        pagination.value.page = 1;
        fetchResponses();
    }
});

</script>

<style scoped>
/* ============================================================================
   Submissions Panel - Premium UI aligned with editor design system
   ============================================================================ */

.submissions-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #ffffff;
}

/* Toolbar */
.monitoring-toolbar {
    padding: 10px 14px;
    background: #ffffff;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    flex-direction: column;
    gap: 10px;
    flex-shrink: 0;
}

/* Remove extra space injected by F7 searchbar in toolbar context */
.monitoring-search :deep(.searchbar) {
    margin: 0;
    height: 36px;
}

.filter-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
}

.table-filter-wrapper {
    flex-shrink: 0;
}

.table-filter-select {
    padding: 5px 10px;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
    background: #ffffff;
    color: #1e293b;
    font-size: 13px;
    font-weight: 500;
    outline: none;
    cursor: pointer;
    transition: border-color 0.15s;
}

.table-filter-select:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Content Area */
.monitoring-content {
    flex: 1;
    overflow-y: auto;
    position: relative;
    background: #ffffff;
}

/* ============================================================================
   Data Table - Premium Styling
   ============================================================================ */
.data-table {
    width: 100%;
    background: #ffffff;
}

.data-table table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
}

.data-table thead tr {
    background: #f8fafc;
    border-bottom: 2px solid #e2e8f0;
}

.data-table thead th {
    padding: 10px 14px;
    text-align: left;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #64748b;
    white-space: nowrap;
}

.data-table thead th.actions-cell {
    text-align: right;
}

.data-row {
    border-bottom: 1px solid #f1f5f9;
    transition: background 0.12s ease;
}

.data-row:last-child {
    border-bottom: none;
}

.data-row:hover {
    background: #f8fafc;
}

.data-table tbody td {
    padding: 10px 14px;
    color: #1e293b;
    vertical-align: middle;
}

.enumerator-cell {
    font-weight: 500;
    white-space: nowrap;
    color: #1e293b;
}

.preview-cell {
    color: #64748b;
    max-width: 300px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.date-cell {
    color: #94a3b8;
    white-space: nowrap;
    font-size: 12px;
}

.actions-cell {
    text-align: right;
    white-space: nowrap;
}

/* ============================================================================
   Status Chip — Soft Pastel Semantic Colors
   ============================================================================ */
.status-chip {
    display: inline-flex;
    align-items: center;
    padding: 3px 9px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
    white-space: nowrap;
}

/* assigned → gray-blue (not started) */
.status-chip.status-assigned {
    background: #f1f5f9;
    color: #475569;
}

/* in_progress → soft blue */
.status-chip.status-in_progress {
    background: #eff6ff;
    color: #2563eb;
}

/* submitted → soft orange (complex mode: waiting for review) */
.status-chip.status-submitted {
    background: #fff7ed;
    color: #ea580c;
}

/* completed → soft green */
.status-chip.status-completed {
    background: #f0fdf4;
    color: #16a34a;
}

/* synced → teal/emerald */
.status-chip.status-synced {
    background: #f0fdfa;
    color: #0d9488;
}

/* rejected → soft red */
.status-chip.status-rejected {
    background: #fff1f2;
    color: #dc2626;
}

/* ============================================================================
   Pagination Footer
   ============================================================================ */
.data-table-footer {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    padding: 10px 14px;
    border-top: 1px solid #e2e8f0;
    background: #f8fafc;
}

.data-table-pagination {
    display: flex;
    align-items: center;
    gap: 8px;
}

.data-table-pagination-label {
    font-size: 12px;
    color: #64748b;
}

.data-table-pagination .link {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
    color: #475569;
    transition: all 0.15s;
}

.data-table-pagination .link:hover:not(.disabled) {
    background: #eff6ff;
    border-color: #bfdbfe;
    color: #2563eb;
}

.data-table-pagination .link.disabled {
    opacity: 0.35;
    pointer-events: none;
}

/* ============================================================================
   States: Loading / Empty
   ============================================================================ */
.monitoring-loader {
    padding: 80px 32px;
    text-align: center;
    color: #94a3b8;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
}

.monitoring-empty {
    padding: 80px 32px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
}

.empty-icon-wrap {
    width: 64px;
    height: 64px;
    border-radius: 16px;
    background: #f1f5f9;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 8px;
}

.empty-icon {
    font-size: 32px;
    color: #94a3b8;
}

.empty-title {
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
    margin: 0;
}

.empty-subtitle {
    font-size: 13px;
    color: #94a3b8;
    margin: 0;
    max-width: 280px;
}

/* Spin Animation */
.refresh-btn {
    gap: 6px;
}

.spin {
    animation: rotate 1s linear infinite;
}

@keyframes rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

/* ============================================================================
   Advanced Filters Panel Styles
   ============================================================================ */
.monitoring-toolbar-wrapper {
    display: flex;
    flex-direction: column;
    width: 100%;
}

.search-and-filter-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    margin-bottom: 8px;
}

.advanced-filter-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 36px;
    padding: 0 14px;
    font-weight: 600;
    border-radius: 8px;
}

.advanced-filters-panel {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    margin-bottom: 12px;
}

.filters-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 10px;
}

.filter-item-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
}

.filter-col {
    display: flex;
    align-items: center;
}

.field-col {
    flex: 2;
}

.operator-col {
    flex: 1.5;
}

.value-col {
    flex: 3;
}

.action-col {
    flex: 0.5;
    justify-content: center;
}

.filter-select {
    width: 100%;
    height: 32px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 0 8px;
    background-color: #ffffff;
    font-size: 13px;
    color: #334155;
    outline: none;
}

.filter-select:focus {
    border-color: #3b82f6;
}

.filter-input {
    width: 100%;
    height: 32px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 0 8px;
    font-size: 13px;
    color: #334155;
    outline: none;
}

.filter-input:focus {
    border-color: #3b82f6;
}
</style>
