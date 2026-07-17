<template>
    <div class="data-preview-panel">
        <div class="dp-header">
            <div class="dp-header-left">
                <span class="dp-title">Data Preview</span>
                <span v-if="!isLoading && total > 0" class="dp-count">{{ total.toLocaleString() }} rows</span>
            </div>
            <button class="dp-refresh-btn" :class="{ spinning: isLoading }" @click="fetchRecords" title="Refresh">
                <f7-icon f7="arrow_clockwise" size="13" />
            </button>
        </div>

        <div v-if="isLoading && rows.length === 0" class="dp-skeleton">
            <div class="dp-skeleton-header">
                <div v-for="i in 5" :key="i" class="dp-skeleton-cell header" />
            </div>
            <div v-for="row in 8" :key="row" class="dp-skeleton-row">
                <div v-for="i in 5" :key="i" class="dp-skeleton-cell" />
            </div>
        </div>

        <div v-else-if="error" class="dp-empty-state">
            <p class="dp-empty-title">Gagal Memuat Data</p>
            <p class="dp-empty-sub">{{ error }}</p>
            <button class="dp-retry-btn" @click="fetchRecords">Coba Lagi</button>
        </div>

        <div v-else-if="!isLoading && rows.length === 0" class="dp-empty-state">
            <f7-icon f7="tray" size="36" />
            <p class="dp-empty-title">Belum Ada Data</p>
            <p class="dp-empty-sub">Import data via Excel/CSV untuk melihat preview di sini.</p>
        </div>

        <div v-else class="dp-table-wrapper">
            <table class="dp-table">
                <thead>
                    <tr>
                        <th class="dp-th dp-th-num">#</th>
                        <th v-for="col in columns" :key="col.key" class="dp-th">
                            <div class="dp-th-inner">
                                <span class="dp-col-type-icon">{{ getTypeIcon(col.type) }}</span>
                                <span class="dp-col-label">{{ col.label }}</span>
                            </div>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(row, rowIdx) in rows" :key="String(row['_id']) || String(rowIdx)" class="dp-tr">
                        <td class="dp-td dp-td-num">{{ rowNumber(rowIdx) }}</td>
                        <td v-for="col in columns" :key="col.key" class="dp-td">
                            <span class="dp-cell-value" :title="String(row[col.key] ?? '')">
                                {{ formatCell(row[col.key], col.type) }}
                            </span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div v-if="totalPages > 1" class="dp-pagination">
            <button class="dp-page-btn" :disabled="page <= 1" @click="goPage(page - 1)">
                <f7-icon f7="chevron_left" size="12" />
            </button>
            <span class="dp-page-info">{{ page }} / {{ totalPages }}</span>
            <button class="dp-page-btn" :disabled="page >= totalPages" @click="goPage(page + 1)">
                <f7-icon f7="chevron_right" size="12" />
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ApiClient } from '@/common/api/ApiClient';
import { useTableStore } from '@/stores';
import { computed, onMounted, ref, watch } from 'vue';

interface Column { key: string; label: string; type: string; }

const tableStore = useTableStore();

const isLoading = ref(false);
const error = ref<string | null>(null);
const rows = ref<Record<string, unknown>[]>([]);
const columns = ref<Column[]>([]);
const total = ref(0);
const page = ref(1);
const perPage = 50;

const totalPages = computed(() => Math.ceil(total.value / perPage) || 1);
const currentTableId = computed(() => tableStore.currentTable?.id);

function rowNumber(idx: number): number {
    return (page.value - 1) * perPage + idx + 1;
}

async function fetchRecords(): Promise<void> {
    const id = currentTableId.value;
    if (!id) return;
    isLoading.value = true;
    error.value = null;
    try {
        const url = '/tables/' + String(id) + '/records';
        const res = await ApiClient.get(url, {
            params: { page: page.value, per_page: perPage }
        });
        const d = res.data as { data: Record<string, unknown>[]; columns: Column[]; total: number };
        rows.value = d.data ?? [];
        columns.value = d.columns ?? [];
        total.value = d.total ?? 0;
    } catch (e: unknown) {
        const err = e as { response?: { data?: { message?: string } }; message?: string };
        error.value = err?.response?.data?.message || err?.message || 'Unknown error';
    } finally {
        isLoading.value = false;
    }
}

function goPage(p: number): void {
    page.value = p;
    void fetchRecords();
}

function getTypeIcon(type: string): string {
    const map: Record<string, string> = {
        number: '#', text: 'T', date: 'D', datetime: 'DT',
        gps: 'GPS', checkbox: 'CB', select: 'SEL', radio: 'RAD',
    };
    return map[type] ?? 'T';
}

function formatCell(val: unknown, type: string): string {
    if (val === null || val === undefined || val === '') return '—';
    if (type === 'checkbox') return val ? '✓' : '✗';
    if (typeof val === 'object') return JSON.stringify(val).slice(0, 60);
    return String(val).slice(0, 80);
}

watch(currentTableId, (newId) => {
    if (newId) { page.value = 1; void fetchRecords(); }
    else { rows.value = []; columns.value = []; total.value = 0; }
});

onMounted(() => { if (currentTableId.value) void fetchRecords(); });

defineExpose({ fetchRecords });
</script>

<style scoped>
.data-preview-panel { display:flex; flex-direction:column; height:100%; overflow:hidden; background:#fff; }
.dp-header { display:flex; align-items:center; justify-content:space-between; padding:8px 12px; border-bottom:1px solid #e2e8f0; background:#f8fafc; flex-shrink:0; }
.dp-header-left { display:flex; align-items:center; gap:8px; }
.dp-title { font-size:12px; font-weight:600; color:#334155; }
.dp-count { font-size:11px; color:#64748b; background:#e2e8f0; padding:1px 6px; border-radius:10px; }
.dp-refresh-btn { all:unset; cursor:pointer; width:24px; height:24px; border-radius:5px; display:flex; align-items:center; justify-content:center; color:#64748b; transition:background 0.15s,transform 0.3s; }
.dp-refresh-btn:hover { background:#e2e8f0; }
.dp-refresh-btn.spinning { animation:spin 0.8s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
.dp-skeleton { padding:0; }
.dp-skeleton-header { display:flex; gap:1px; background:#e2e8f0; }
.dp-skeleton-cell { flex:1; height:32px; background:#f1f5f9; animation:shimmer 1.4s ease-in-out infinite; }
.dp-skeleton-cell.header { background:#e2e8f0; }
.dp-skeleton-row { display:flex; gap:12px; padding:8px 12px; border-bottom:1px solid #f1f5f9; }
.dp-skeleton-row .dp-skeleton-cell { height:12px; border-radius:4px; flex:unset; width:30%; }
@keyframes shimmer { 0%,100%{opacity:0.6} 50%{opacity:1} }
.dp-empty-state { display:flex; flex-direction:column; align-items:center; justify-content:center; flex:1; gap:8px; color:#94a3b8; padding:40px 20px; }
.dp-empty-title { margin:0; font-size:14px; font-weight:600; color:#475569; }
.dp-empty-sub { margin:0; font-size:12px; text-align:center; max-width:240px; line-height:1.5; }
.dp-retry-btn { all:unset; cursor:pointer; font-size:12px; font-weight:600; color:#3b82f6; padding:5px 12px; border:1px solid #3b82f6; border-radius:6px; margin-top:4px; }
.dp-table-wrapper { flex:1; overflow:auto; min-height:0; }
.dp-table { width:100%; border-collapse:collapse; font-size:12px; }
.dp-th { position:sticky; top:0; background:#1e293b; color:#e2e8f0; text-align:left; padding:0 12px; height:34px; font-weight:600; white-space:nowrap; border-right:1px solid #334155; z-index:1; }
.dp-th:last-child { border-right:none; }
.dp-th-num { width:36px; min-width:36px; text-align:right; color:#64748b; font-weight:400; font-size:11px; }
.dp-th-inner { display:flex; align-items:center; gap:5px; }
.dp-col-type-icon { font-size:9px; opacity:0.55; flex-shrink:0; font-weight:700; background:rgba(255,255,255,0.12); border-radius:3px; padding:0 3px; }
.dp-col-label { overflow:hidden; text-overflow:ellipsis; max-width:120px; }
.dp-tr { border-bottom:1px solid #f1f5f9; transition:background 0.1s; }
.dp-tr:hover { background:#f8fafc; }
.dp-tr:nth-child(even) { background:#fafafa; }
.dp-tr:nth-child(even):hover { background:#f1f5f9; }
.dp-td { padding:6px 12px; color:#334155; vertical-align:middle; border-right:1px solid #f1f5f9; max-width:200px; overflow:hidden; }
.dp-td:last-child { border-right:none; }
.dp-td-num { text-align:right; color:#94a3b8; font-size:11px; width:36px; min-width:36px; user-select:none; }
.dp-cell-value { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.dp-pagination { display:flex; align-items:center; justify-content:center; gap:8px; padding:6px 12px; border-top:1px solid #e2e8f0; background:#f8fafc; flex-shrink:0; }
.dp-page-btn { all:unset; cursor:pointer; width:26px; height:26px; border-radius:5px; display:flex; align-items:center; justify-content:center; color:#475569; transition:background 0.15s; }
.dp-page-btn:hover:not([disabled]) { background:#e2e8f0; }
.dp-page-btn[disabled] { opacity:0.35; cursor:not-allowed; }
.dp-page-info { font-size:12px; color:#64748b; min-width:48px; text-align:center; }
</style>