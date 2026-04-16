<template>
    <div class="submissions-panel">
        <!-- Toolbar -->
        <div class="monitoring-toolbar">
            <f7-searchbar 
                :value="searchQuery" 
                placeholder="Search enumerator or data..."
                @input="searchQuery = ($event.target as HTMLInputElement).value" 
                :disable-button="false"
                class="monitoring-search" 
            />
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
                    <f7-button v-if="appMode === 'complex'" :active="statusFilter === 'pending'" @click="statusFilter = 'pending'" small>
                        Pending Review
                    </f7-button>
                    <f7-button :active="statusFilter === 'approved'" @click="statusFilter = 'approved'" small>
                        Synced
                    </f7-button>
                    <f7-button :active="statusFilter === 'rejected'" @click="statusFilter = 'rejected'" small>
                        Returned
                    </f7-button>
                </f7-segmented>
                
                <div style="display: flex; gap: 8px;">
                    <f7-button v-if="appMode === 'complex'" small fill @click="showImportPopup = true">
                        <f7-icon f7="arrow_down_doc" size="14" />
                        Import CSV
                    </f7-button>
                    <f7-button small outline @click="exportData" :disabled="loading || isExporting || !tableFilter">
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

        <!-- Assignments Grid (Comprehensive Monitoring) -->
        <div class="monitoring-content">
            <div v-if="responses.length > 0" class="data-table">
                <table>
                    <thead>
                        <tr>
                            <th class="label-cell">Status</th>
                            <th class="label-cell">Enumerator</th>
                            <th class="label-cell">Data Preview</th>
                            <th class="label-cell">Last Updated</th>
                            <th class="actions-cell">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in responses" :key="item.id">
                            <td class="label-cell">
                                <f7-badge :color="getStatusColor(item.status)">
                                    {{ formatStatusLabel(item.status) }}
                                </f7-badge>
                            </td>
                            <td class="label-cell">{{ item.enumerator?.name || 'Unassigned' }}</td>
                            <td class="label-cell">{{ formatPreview(item) }}</td>
                            <td class="label-cell">{{ formatDate(item.updated_at) }}</td>
                            <td class="actions-cell">
                                <f7-button small outline @click="openReview(item)">Review</f7-button>
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
            <f7-block v-if="!loading && responses.length === 0" class="monitoring-empty">
                <f7-icon f7="tray" class="empty-icon" />
                <p class="empty-title">No data found</p>
                <p class="empty-subtitle">Data from Enumerators or Imported Base Data will appear here</p>
            </f7-block>
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
import { ApiClient } from '../../../../common/api/ApiClient';
import ResponseReviewDrawer from './ResponseReviewDrawer.vue';
import CsvImportPopup from './CsvImportPopup.vue';
import { f7 } from 'framework7-vue';
import axios from 'axios';

const appStore = useAppStore();

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

const appMode = computed(() => appStore.currentApp?.mode || 'simple');
const appTables = computed(() => appStore.currentApp?.tables || []);

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
            table_id: tableFilter.value
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
        const token = localStorage.getItem('auth_token');
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
        
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
            toast.setText('Sedang memproses (OOM-Safe cursor)...');
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

    // 4. Save (Native Picker or Legacy)
    if ('showSaveFilePicker' in window) {
        try {
            const handle = await (window as any).showSaveFilePicker({
                suggestedName: fileName,
                types: [{ description: 'CSV File', accept: {'text/csv': ['.csv']} }],
            });
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
    link.download = fileName;
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
        case 'completed': return 'blue';
        case 'synced': return 'green';
        case 'rejected': return 'red';
        case 'in_progress': return 'blue';
        case 'assigned': return 'gray';
        default: return 'gray';
    }
}

function formatStatusLabel(status: string): string {
    if (status === 'submitted') return 'Pending Review';
    if (status === 'completed') return 'Completed';
    if (status === 'synced') return 'Synced';
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
    // Note: fetching is now driven by the appTables watch -> tableFilter initialization
});

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
.submissions-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.monitoring-toolbar {
    padding: 12px;
    background: var(--f7-bars-bg-color);
    border-bottom: 1px solid var(--f7-list-border-color);
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.filter-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
}

.table-filter-wrapper {
    flex-shrink: 0;
}

.table-filter-select {
    padding: 6px 10px;
    border-radius: 6px;
    border: 1px solid var(--f7-list-border-color);
    background: var(--f7-list-item-bg-color);
    color: var(--f7-list-item-text-color);
    font-size: 13px;
    outline: none;
    cursor: pointer;
}

.table-filter-select:focus {
    border-color: var(--f7-theme-color);
}

.monitoring-content {
    flex: 1;
    overflow-y: auto;
    position: relative;
    background: var(--f7-page-bg-color);
}

.monitoring-list {
    margin: 0;
}

.monitoring-loader, .monitoring-empty {
    padding: 64px 32px;
    text-align: center;
    color: var(--f7-label-color);
}

.empty-icon {
    font-size: 48px;
    opacity: 0.2;
    margin-bottom: 16px;
}

.empty-title {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
}

.empty-subtitle {
    opacity: 0.6;
    margin-top: 4px;
}

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
</style>
