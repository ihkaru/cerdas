<template>
    <div class="sheet-sync-panel">
        <!-- ========== STATE 1: No Google Token ========== -->
        <div v-if="state.status === 'no_token' || state.status === 'idle'" class="sync-state">
            <div class="sync-icon-wrap sync-icon-gray">
                <f7-icon f7="logo_google" size="40" />
            </div>
            <h4 class="sync-title">Hubungkan Google Sheets</h4>
            <p class="sync-desc">
                Hubungkan Google Account untuk membuat data replica otomatis di Google Sheets.
                Setiap response baru akan langsung tersinkron dalam ~30 detik.
            </p>
            <f7-button
                id="btn-connect-google-account"
                large
                fill
                :loading="isLoading"
                @click="startOAuthFlow"
                class="google-btn"
            >
                <f7-icon f7="logo_google" size="18" class="margin-right-half" />
                Hubungkan Google Account
            </f7-button>
        </div>

        <!-- ========== STATE 2: Token exists, Sheet not yet connected ========== -->
        <div v-else-if="state.status === 'token_ok'" class="sync-state">
            <div class="token-owner-badge">
                <f7-icon f7="checkmark_seal_fill" size="16" color="green" />
                <span>Terhubung sebagai <strong>{{ state.owner.email }}</strong></span>
            </div>

            <div class="sync-icon-wrap sync-icon-green">
                <f7-icon f7="table_badge_more" size="40" />
            </div>
            <h4 class="sync-title">Pilih Google Sheet</h4>
            <p class="sync-desc">
                Paste URL Google Sheet yang ingin dijadikan replica data.
                Sheet harus dapat diakses oleh akun Google yang sudah dihubungkan.
            </p>

            <div class="url-input-wrap">
                <f7-list no-hairlines class="margin-0">
                    <f7-list-input
                        id="input-spreadsheet-url"
                        type="url"
                        placeholder="https://docs.google.com/spreadsheets/d/..."
                        :value="spreadsheetUrlInput"
                        @input="spreadsheetUrlInput = ($event.target as HTMLInputElement).value"
                        clear-button
                    />
                </f7-list>
            </div>

            <div class="action-buttons">
                <f7-button
                    id="btn-connect-sheet"
                    large
                    fill
                    color="green"
                    :disabled="!spreadsheetUrlInput || isLoading"
                    :loading="isLoading"
                    @click="handleConnectSheet"
                >
                    <f7-icon f7="link" size="18" class="margin-right-half" />
                    Connect &amp; Sync
                </f7-button>
                <f7-button
                    id="btn-reconnect-google"
                    outline
                    @click="startOAuthFlow"
                    class="margin-top-half"
                >
                    Ganti Google Account
                </f7-button>
            </div>

            <p class="sync-hint">
                <f7-icon f7="info_circle" size="14" />
                Tab akan dibuat otomatis: satu tab utama + satu tab per section repeatable.
            </p>
        </div>

        <!-- ========== STATE 3: Connecting in progress ========== -->
        <div v-else-if="state.status === 'connecting'" class="sync-state sync-loading">
            <f7-preloader size="48" color="green" />
            <h4 class="sync-title">Menghubungkan Sheet...</h4>
            <p class="sync-desc">Membuat tab dan menulis header kolom. Sebentar ya.</p>
        </div>

        <!-- ========== STATE 4: Exporting (initial export) ========== -->
        <div v-else-if="state.status === 'exporting'" class="sync-state sync-loading">
            <f7-preloader size="48" color="blue" />
            <h4 class="sync-title">Mengekspor Data</h4>
            <p class="sync-desc">{{ state.progress || 'Memproses data historis...' }}</p>
            <p class="sync-hint">Proses ini berjalan di background. Kamu bisa tutup panel ini.</p>
        </div>

        <!-- ========== STATE 5: Connected & Idle ========== -->
        <div v-else-if="state.status === 'connected'" class="sync-state">
            <div class="connected-header">
                <div class="connected-badge">
                    <f7-icon f7="checkmark_circle_fill" size="20" color="green" />
                    <span class="connected-label">Terhubung</span>
                </div>
                <f7-link
                    :href="state.config.spreadsheet_url"
                    external
                    target="_blank"
                    class="open-sheet-link"
                >
                    <f7-icon f7="arrow_up_right_square" size="18" />
                    Buka Sheet
                </f7-link>
            </div>

            <!-- Spreadsheet info -->
            <div class="spreadsheet-info">
                <div class="info-row">
                    <f7-icon f7="doc_text" size="16" color="blue" />
                    <span class="info-label">Spreadsheet ID:</span>
                    <span class="info-value monospace">{{ state.config.spreadsheet_id.substring(0, 20) }}...</span>
                </div>
                <div class="info-row" v-if="syncStatus?.config?.last_synced_at">
                    <f7-icon f7="clock" size="16" color="gray" />
                    <span class="info-label">Sync terakhir:</span>
                    <span class="info-value">{{ formatRelativeTime(syncStatus.config.last_synced_at) }}</span>
                </div>
                <div class="info-row" v-if="syncStatus?.config?.total_rows_synced">
                    <f7-icon f7="chart_bar" size="16" color="blue" />
                    <span class="info-label">Total tersync:</span>
                    <span class="info-value">{{ syncStatus.config.total_rows_synced.toLocaleString() }} baris</span>
                </div>
                <div class="info-row" v-if="syncStatus?.pending_rows">
                    <f7-icon f7="hourglass" size="16" color="orange" />
                    <span class="info-label">Menunggu flush:</span>
                    <span class="info-value">{{ syncStatus.pending_rows }} baris</span>
                </div>
            </div>

            <!-- Tabs -->
            <div class="tabs-list">
                <div class="tabs-label">Tab yang dibuat:</div>
                <div v-for="tab in state.config.tabs" :key="tab.sheet_name" class="tab-chip">
                    <f7-icon :f7="tab.type === 'root' ? 'table' : 'list_bullet_indent'" size="14" />
                    {{ tab.sheet_name }}
                    <span class="tab-type-badge" :class="tab.type">{{ tab.type }}</span>
                </div>
            </div>

            <!-- Actions -->
            <div class="connected-actions">
                <f7-button
                    id="btn-sync-now"
                    small
                    outline
                    color="blue"
                    :loading="isLoading"
                    @click="handleManualExport"
                >
                    <f7-icon f7="arrow_clockwise" size="16" class="margin-right-half" />
                    Sync Sekarang
                </f7-button>
                <f7-button
                    id="btn-disconnect-sheet"
                    small
                    outline
                    color="red"
                    @click="showDisconnectConfirm = true"
                >
                    <f7-icon f7="xmark_circle" size="16" class="margin-right-half" />
                    Disconnect
                </f7-button>
            </div>
        </div>

        <!-- ========== STATE 6: Error ========== -->
        <div v-else-if="state.status === 'error'" class="sync-state sync-error">
            <div class="sync-icon-wrap sync-icon-red">
                <f7-icon f7="exclamationmark_triangle_fill" size="40" color="red" />
            </div>
            <h4 class="sync-title">Sync Gagal</h4>
            <p class="sync-desc error-message">{{ state.message }}</p>
            <f7-button
                v-if="state.can_reconnect"
                id="btn-reconnect-after-error"
                large
                fill
                color="red"
                @click="startOAuthFlow"
            >
                Hubungkan Ulang Google Account
            </f7-button>
            <f7-button
                outline
                class="margin-top-half"
                @click="clearError"
            >
                Tutup
            </f7-button>
        </div>

        <!-- ========== Disconnect Confirm Dialog ========== -->
        <f7-dialog
            :opened="showDisconnectConfirm"
            title="Disconnect Google Sheet?"
            @dialog:closed="showDisconnectConfirm = false"
        >
            <f7-dialog-text>
                Data di Google Sheet <strong>tidak akan dihapus</strong>. Hanya koneksi sinkronisasi yang diputus.
                Response baru tidak akan tersync ke Sheet setelah ini.
            </f7-dialog-text>
            <f7-dialog-button @click="handleDisconnect" color="red">Ya, Disconnect</f7-dialog-button>
            <f7-dialog-button @click="showDisconnectConfirm = false">Batal</f7-dialog-button>
        </f7-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useGoogleSheetSync } from '../../composables/useGoogleSheetSync';

const props = defineProps<{
    tableId: string;
    appId: string;
}>();

const spreadsheetUrlInput = ref('');
const showDisconnectConfirm = ref(false);

const {
    state,
    syncStatus,
    isLoading,
    refreshStatus,
    startOAuthFlow,
    connectSheet,
    disconnectSheet,
    triggerManualExport,
    clearError,
} = useGoogleSheetSync(
    ref(props.tableId),
    ref(props.appId)
);

// ========== Handlers ==========

async function handleConnectSheet() {
    if (!spreadsheetUrlInput.value) return;
    await connectSheet(spreadsheetUrlInput.value);
}

async function handleDisconnect() {
    showDisconnectConfirm.value = false;
    await disconnectSheet();
}

async function handleManualExport() {
    await triggerManualExport();
}

// ========== Utilities ==========

function formatRelativeTime(isoString: string): string {
    const date = new Date(isoString);
    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return 'baru saja';
    if (diffMin < 60) return `${diffMin} menit lalu`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} jam lalu`;
    return `${Math.floor(diffHour / 24)} hari lalu`;
}

// ========== Lifecycle ==========

onMounted(async () => {
    await refreshStatus();
});

watch(() => props.tableId, async (newId) => {
    if (newId) await refreshStatus();
});
</script>

<style scoped>
.sheet-sync-panel {
    padding: 16px;
}

.sync-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 12px;
    padding: 8px 0;
}

.sync-icon-wrap {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}
.sync-icon-gray { background: var(--f7-color-gray-tint); }
.sync-icon-green { background: #e8f5e9; }
.sync-icon-red { background: #fdecea; }

.sync-title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
}

.sync-desc {
    margin: 0;
    color: var(--f7-text-color-tertiary, #888);
    font-size: 13px;
    max-width: 320px;
    line-height: 1.5;
}

.sync-hint {
    margin: 0;
    color: var(--f7-color-blue);
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 4px;
}

.sync-loading {
    gap: 16px;
    padding: 24px 0;
}

.google-btn {
    width: 100%;
    max-width: 300px;
}

.token-owner-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    background: #e8f5e9;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 12px;
    color: #2e7d32;
    width: fit-content;
}

.url-input-wrap {
    width: 100%;
    max-width: 400px;
}

.action-buttons {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
    max-width: 300px;
}

/* Connected state */
.connected-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 8px 0;
    border-bottom: 1px solid var(--f7-list-border-color, #e0e0e0);
    margin-bottom: 8px;
}

.connected-badge {
    display: flex;
    align-items: center;
    gap: 6px;
}

.connected-label {
    font-weight: 600;
    color: #2e7d32;
    font-size: 14px;
}

.open-sheet-link {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    color: var(--f7-color-blue);
}

.spreadsheet-info {
    width: 100%;
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: 6px;
    background: var(--f7-list-bg-color, #f5f5f5);
    border-radius: 8px;
    padding: 12px;
}

.info-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
}

.info-label {
    color: #888;
    min-width: 100px;
    flex-shrink: 0;
}

.info-value {
    color: var(--f7-text-color);
    font-weight: 500;
}

.monospace {
    font-family: monospace;
    font-size: 12px;
}

.tabs-list {
    width: 100%;
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.tabs-label {
    font-size: 12px;
    color: #888;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.tab-chip {
    display: flex;
    align-items: center;
    gap: 6px;
    background: var(--f7-list-bg-color, #f5f5f5);
    padding: 6px 10px;
    border-radius: 6px;
    font-size: 13px;
}

.tab-type-badge {
    margin-left: auto;
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 600;
    text-transform: uppercase;
}

.tab-type-badge.root {
    background: #e3f2fd;
    color: #1565c0;
}

.tab-type-badge.nested {
    background: #f3e5f5;
    color: #6a1b9a;
}

.connected-actions {
    display: flex;
    gap: 8px;
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
}

.sync-error .error-message {
    color: var(--f7-color-red);
}
</style>
