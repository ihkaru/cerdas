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
                    <f7-list-item v-if="availableTabs.length > 0" title="Target Tab Sheet" smart-select :smart-select-params="{ openIn: 'popover' }">
                        <select v-model="selectedTabName">
                            <option value="">(Buat Tab Baru Otomatis)</option>
                            <option v-for="t in availableTabs" :key="t" :value="t">{{ t }}</option>
                        </select>
                    </f7-list-item>
                </f7-list>
            </div>

            <div v-if="spreadsheetUrlInput && availableTabs.length === 0" class="margin-horizontal margin-bottom-half">
                <f7-button
                    small
                    outline
                    color="blue"
                    :loading="isCheckingTabs"
                    @click="handleCheckTabs"
                >
                    <f7-icon f7="search" size="14" class="margin-right-half" />
                    Periksa Lembar Kerja (Tab)
                </f7-button>
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
                {{ selectedTabName ? `Tabel ini akan disinkronkan langsung ke tab '${selectedTabName}'.` : 'Tab akan dibuat otomatis: satu tab utama + satu tab per section repeatable.' }}
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
                    <f7-icon f7="arrow_up_circle" size="16" color="blue" />
                    <span class="info-label">Export terakhir:</span>
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
                <div class="info-row">
                    <f7-icon f7="arrow_2_squarepath" size="16" :color="isInboundEnabled ? 'green' : 'gray'" />
                    <span class="info-label">Inbound Auto-Pull:</span>
                    <span class="info-value" :style="{ color: isInboundEnabled ? '#16a34a' : '#64748b', fontWeight: 600 }">
                        {{ isInboundEnabled ? 'Aktif (Tiap 10 Menit)' : 'Nonaktif (One-Way Mode)' }}
                    </span>
                </div>
                <div class="info-row">
                    <f7-icon f7="key_fill" size="16" color="orange" />
                    <span class="info-label">Primary Key:</span>
                    <span class="info-value" style="font-weight: 600; color: #b45309;">
                        🔑 {{ primaryKeyDisplay }}
                    </span>
                </div>
            </div>

            <!-- Sync Mode Switcher -->
            <div class="sync-mode-card">
                <div class="sync-mode-header">
                    <span class="sync-mode-title">Mode Sinkronisasi</span>
                    <span class="sync-mode-current-badge" :class="isInboundEnabled ? 'two-way' : 'one-way'">
                        {{ isInboundEnabled ? '2-Way Sync' : 'One-Way Export' }}
                    </span>
                </div>
                <div class="sync-mode-options">
                    <div
                        class="sync-mode-option"
                        :class="{ active: !isInboundEnabled }"
                        @click="handleToggleSyncMode(false)"
                    >
                        <div class="mode-radio">
                            <span class="radio-dot" v-if="!isInboundEnabled"></span>
                        </div>
                        <div class="mode-info">
                            <div class="mode-name">📤 One-Way Export (Cerdas ➔ Sheet)</div>
                            <div class="mode-desc">Hanya mengirim respon dari Cerdas ke Sheet. Sheet berfungsi sebagai live report / backup.</div>
                        </div>
                    </div>
                    <div
                        class="sync-mode-option"
                        :class="{ active: isInboundEnabled }"
                        @click="handleToggleSyncMode(true)"
                    >
                        <div class="mode-radio">
                            <span class="radio-dot" v-if="isInboundEnabled"></span>
                        </div>
                        <div class="mode-info">
                            <div class="mode-name">🔄 Two-Way Sync (Cerdas ⇄ Sheet)</div>
                            <div class="mode-desc">Sinkronisasi 2 arah. Perubahan data di Google Sheet otomatis terdorong ke aplikasi Cerdas.</div>
                        </div>
                    </div>
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
                    id="btn-sync-headers"
                    small
                    outline
                    color="purple"
                    :loading="isSyncingHeaders"
                    @click="handleSyncHeaders"
                    title="Selaraskan judul kolom di Baris 1 Google Sheet dengan field terbaru di Cerdas"
                >
                    <f7-icon f7="rectangle_grid_1x2" size="16" class="margin-right-half" />
                    Perbarui Kolom Sheet
                </f7-button>
                <f7-button
                    id="btn-sync-now"
                    small
                    outline
                    color="blue"
                    :loading="isLoading"
                    @click="handleManualExport"
                    title="Kirim seluruh data Cerdas ke Google Sheets"
                >
                    <f7-icon f7="arrow_up_circle" size="16" class="margin-right-half" />
                    Export ke Sheet
                </f7-button>
                <f7-button
                    id="btn-pull-now"
                    small
                    outline
                    color="green"
                    :loading="isLoading"
                    @click="handlePullFromSheet"
                    title="Tarik data terbaru dari Google Sheets ke Cerdas"
                >
                    <f7-icon f7="arrow_down_circle" size="16" class="margin-right-half" />
                    Pull dari Sheet
                </f7-button>
                <f7-button
                    id="btn-webhook-info"
                    small
                    outline
                    color="orange"
                    @click="showWebhookModal = true"
                    title="Pengaturan Push Real-time via Google Apps Script"
                >
                    <f7-icon f7="bolt_fill" size="16" class="margin-right-half" />
                    Apps Script Push
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

        <!-- ========== Apps Script Webhook Modal ========== -->
        <f7-popup
            :opened="showWebhookModal"
            @popup:closed="showWebhookModal = false"
            class="webhook-popup"
        >
            <f7-page>
                <f7-navbar title="⚡ Real-time Push (Apps Script)">
                    <f7-nav-right>
                        <f7-link popup-close>Tutup</f7-link>
                    </f7-nav-right>
                </f7-navbar>
                <f7-block class="margin-top">
                    <p>
                        Secara bawaan, Cerdas otomatis menarik data baru dari Google Sheet setiap <strong>10 menit</strong>.
                        Jika Anda ingin perubahan langsung terdorong secara <strong>instan (real-time sub-detik)</strong> saat diedit di Google Sheet:
                    </p>
                    <ol style="font-size: 13px; line-height: 1.6; padding-left: 20px;">
                        <li>Buka Google Spreadsheet Anda di browser.</li>
                        <li>Klik menu <strong>Extensions &gt; Apps Script</strong>.</li>
                        <li>Hapus semua teks di editor, lalu paste kode di bawah ini:</li>
                    </ol>
                    <pre class="webhook-code-box"><code>function onChange(e) {
  UrlFetchApp.fetch("{{ webhookEndpointUrl }}", {
    method: "post",
    muteHttpExceptions: true
  });
}</code></pre>
                    <ol start="4" style="font-size: 13px; line-height: 1.6; padding-left: 20px;">
                        <li>Klik <strong>Triggers (Ikon Jam di bilah kiri) &gt; Add Trigger</strong>.</li>
                        <li>Pilih <code>onChange</code> pada event type, lalu klik <strong>Save</strong>.</li>
                    </ol>
                    <f7-button
                        fill
                        color="blue"
                        class="margin-top"
                        @click="copyWebhookScript"
                    >
                        <f7-icon f7="doc_on_doc" size="16" class="margin-right-half" />
                        {{ isCopied ? '✓ Berhasil Disalin!' : 'Salin Kode Apps Script' }}
                    </f7-button>
                </f7-block>
            </f7-page>
        </f7-popup>

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
import { ref, onMounted, computed } from 'vue';
import { useGoogleSheetSync } from '../../composables/useGoogleSheetSync';
import { f7 } from 'framework7-vue';

const props = defineProps<{
    tableId: string;
    appId: string;
}>();

const spreadsheetUrlInput = ref('');
const availableTabs = ref<string[]>([]);
const selectedTabName = ref<string>('');
const isCheckingTabs = ref(false);
const showDisconnectConfirm = ref(false);
const showWebhookModal = ref(false);
const isCopied = ref(false);

const {
    state,
    syncStatus,
    isLoading,
    isSyncingHeaders,
    refreshStatus,
    startOAuthFlow,
    connectSheet,
    inspectSpreadsheetTabs,
    disconnectSheet,
    triggerManualExport,
    triggerPullFromSheet,
    setSyncMode,
    reconcileHeaders,
    clearError,
} = useGoogleSheetSync(
    ref(props.tableId),
    ref(props.appId)
);

const isInboundEnabled = computed(() => {
    if (state.value.status === 'connected') {
        return Boolean(syncStatus.value?.config?.inbound_sync_enabled ?? state.value.config?.inbound_sync_enabled);
    }
    return false;
});

const primaryKeyDisplay = computed(() => {
    if (state.value.status === 'connected') {
        const key = syncStatus.value?.config?.key_column ?? (state.value.config as any)?.key_column;
        if (key && key !== '_cerdas_id') {
            return key;
        }
    }
    return 'Otomatis (Kunci Alami / ID Baris)';
});

const webhookEndpointUrl = computed(() => {
    return `${window.location.origin.replace(':9982', ':9980')}/api/webhooks/sheets/${props.tableId}`;
});

// ========== Handlers ==========

async function handleSyncHeaders() {
    f7.dialog.preloader('Menyelaraskan header Google Sheet...');
    try {
        const res = await reconcileHeaders();
        f7.dialog.close();
        if (res.success) {
            f7.toast.show({
                text: 'Header Google Sheet berhasil diselaraskan dengan field formulir!',
                position: 'center',
                closeTimeout: 3000
            });
        } else {
            f7.dialog.alert(res.message || 'Gagal menyelaraskan header.');
        }
    } catch (e: any) {
        f7.dialog.close();
        f7.dialog.alert(e?.message || 'Terjadi kesalahan saat menyelaraskan header.');
    }
}

async function handleCheckTabs() {
    if (!spreadsheetUrlInput.value) return;
    try {
        isCheckingTabs.value = true;
        availableTabs.value = await inspectSpreadsheetTabs(spreadsheetUrlInput.value);
        if (availableTabs.value.length > 0) {
            f7.toast.show({ text: `${availableTabs.value.length} tab ditemukan!`, closeTimeout: 2000 });
        } else {
            f7.toast.show({ text: 'Tidak ada tab ditemukan atau spreadsheet tidak dapat diakses.', closeTimeout: 2500 });
        }
    } finally {
        isCheckingTabs.value = false;
    }
}

async function handleConnectSheet() {
    if (!spreadsheetUrlInput.value) return;
    await connectSheet(spreadsheetUrlInput.value, selectedTabName.value || undefined);
}

async function handleDisconnect() {
    showDisconnectConfirm.value = false;
    await disconnectSheet();
}

async function handleManualExport() {
    await triggerManualExport();
}

async function handleToggleSyncMode(enable: boolean) {
    if (isInboundEnabled.value === enable) return;
    try {
        await setSyncMode(enable);
        f7.toast.show({
            text: enable ? '✓ Mode 2-Way Sync diaktifkan' : '✓ Mode One-Way Export diaktifkan',
            closeTimeout: 2000,
        });
    } catch (e: unknown) {
        const err = e as { message?: string };
        f7.dialog.alert(err?.message || 'Gagal mengubah mode sinkronisasi');
    }
}

async function handlePullFromSheet() {
    try {
        const res = await triggerPullFromSheet();
        f7.toast.show({
            text: res.message || `Berhasil menarik ${res.rows_imported} baris data!`,
            closeTimeout: 2500,
        });
    } catch (e: unknown) {
        const err = e as { message?: string };
        f7.dialog.alert(err?.message || 'Gagal menarik data dari Google Sheet');
    }
}

async function copyWebhookScript() {
    const script = `function onChange(e) {\n  UrlFetchApp.fetch("${webhookEndpointUrl.value}", {\n    method: "post",\n    muteHttpExceptions: true\n  });\n}`;
    try {
        await navigator.clipboard.writeText(script);
        isCopied.value = true;
        setTimeout(() => {
            isCopied.value = false;
        }, 3000);
    } catch {
        f7.dialog.alert('Gagal menyalin kode. Silakan salin secara manual.');
    }
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

/* Sync Mode Card */
.sync-mode-card {
    width: 100%;
    background: var(--f7-card-bg-color, #ffffff);
    border: 1px solid var(--f7-list-border-color, #e2e8f0);
    border-radius: 10px;
    padding: 14px;
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.sync-mode-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.sync-mode-title {
    font-size: 13px;
    font-weight: 700;
    color: var(--f7-text-color);
}

.sync-mode-current-badge {
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 12px;
}

.sync-mode-current-badge.two-way {
    background: #dcfce7;
    color: #15803d;
}

.sync-mode-current-badge.one-way {
    background: #f1f5f9;
    color: #475569;
}

.sync-mode-options {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.sync-mode-option {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1.5px solid var(--f7-list-border-color, #e2e8f0);
    background: var(--f7-list-bg-color, #f8fafc);
    cursor: pointer;
    transition: all 0.2s ease;
}

.sync-mode-option:hover {
    border-color: #93c5fd;
    background: #f0f9ff;
}

.sync-mode-option.active {
    border-color: var(--f7-color-blue, #2563eb);
    background: #eff6ff;
}

.mode-radio {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 2px solid #94a3b8;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 2px;
    flex-shrink: 0;
}

.sync-mode-option.active .mode-radio {
    border-color: var(--f7-color-blue, #2563eb);
}

.radio-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--f7-color-blue, #2563eb);
}

.mode-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.mode-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--f7-text-color);
}

.mode-desc {
    font-size: 11px;
    color: #64748b;
    line-height: 1.4;
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

.webhook-code-box {
    background: #1e293b;
    color: #38bdf8;
    padding: 12px;
    border-radius: 8px;
    font-size: 12px;
    font-family: monospace;
    overflow-x: auto;
    border: 1px solid #334155;
}
</style>
