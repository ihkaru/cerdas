import { ref, computed, type Ref } from 'vue';
import { GoogleSheetApi } from '@/common/api/GoogleSheetApi';
import { useGoogleOAuthPopup } from '@/common/composables/useGoogleOAuthPopup';
import type {
  GoogleSheetConfig,
  SheetSyncState,
  SheetSyncStatus,
} from '@cerdas/types';

/**
 * useGoogleSheetSync
 *
 * Composable managing the full lifecycle of Google Sheet Sync for a single Table.
 * Handles: OAuth popup flow, Sheet connection, status polling, disconnect.
 *
 * @param tableId - Ref to the Table UUID
 * @param appId   - Ref to the App UUID (for App-level token management)
 */
export function useGoogleSheetSync(tableId: Ref<string>, appId: Ref<string>) {
  const state = ref<SheetSyncState>({ status: 'idle' });
  const syncStatus = ref<SheetSyncStatus | null>(null);
  const isLoading = ref(false);
  const errorMessage = ref<string | null>(null);
  const { triggerOAuthPopup } = useGoogleOAuthPopup();

  // ========== Computed ==========

  const isConnected = computed(() =>
    state.value.status === 'connected' || state.value.status === 'exporting'
  );

  const hasToken = computed((): boolean => {
    if (syncStatus.value) {
      return syncStatus.value.token_status.has_token;
    }
    return false;
  });

  const spreadsheetUrl = computed((): string | null => {
    if (state.value.status === 'connected') {
      return state.value.config.spreadsheet_url;
    }
    return null;
  });

  // ========== Actions ==========

  /**
   * Load the current sync status from the API and update local state.
   */
  async function refreshStatus(): Promise<void> {
    if (!tableId.value) return;

    try {
      isLoading.value = true;
      const status = await GoogleSheetApi.getSyncStatus(tableId.value);
      syncStatus.value = status;

      // Map API status to UI state
      if (status.is_connected && status.config) {
        state.value = { status: 'connected', config: status.config };
      } else if (status.token_status.has_token && !status.token_status.is_expired) {
        state.value = { status: 'token_ok', owner: status.token_status.owner! };
      } else if (status.token_status.has_token && status.token_status.is_expired) {
        state.value = { status: 'error', message: 'Token Google sudah expired. Silakan hubungkan ulang.', can_reconnect: true };
      } else {
        state.value = { status: 'no_token' };
      }
    } catch (err: unknown) {
      console.error('[useGoogleSheetSync] refreshStatus failed', err);
      // Don't override state on refresh failure — keep last known state
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Start the Google OAuth flow in a popup window.
   */
  async function startOAuthFlow(): Promise<void> {
    try {
      isLoading.value = true;
      const ok = await triggerOAuthPopup(appId.value);
      if (ok) {
        await refreshStatus();
      }
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Connect a Google Sheet URL to the current Table.
   */
  async function connectSheet(url: string): Promise<void> {
    if (!tableId.value) return;

    state.value = { status: 'connecting' };
    errorMessage.value = null;

    try {
      const result = await GoogleSheetApi.connectSheet(tableId.value, url);

      // Immediately update state to connected
      const config: GoogleSheetConfig = {
        spreadsheet_id: result.spreadsheet_id,
        spreadsheet_url: url,
        tabs: result.tabs,
        sync_enabled: true,
        last_synced_at: null,
        total_rows_synced: 0,
      };

      state.value = { status: 'connected', config };

      // If there's existing data being exported, show exporting state briefly
      if (result.has_existing_data) {
        state.value = { status: 'exporting', progress: 'Mengekspor data historis...' };
        // Poll until export completes (or timeout after 5 minutes)
        await pollUntilExportComplete();
      }

      // Final refresh to get accurate stats
      await refreshStatus();

    } catch (err: any) {
      const message = err?.response?.data?.message || 'Gagal menghubungkan Google Sheet. Coba lagi.';
      state.value = { status: 'error', message, can_reconnect: false };
      errorMessage.value = message;
    }
  }

  /**
   * Disconnect the Table from its Google Sheet.
   */
  async function disconnectSheet(): Promise<void> {
    if (!tableId.value) return;

    try {
      await GoogleSheetApi.disconnectSheet(tableId.value);
      syncStatus.value = null;

      // Revert state based on token status
      const tokenStatus = await GoogleSheetApi.getTokenStatus(appId.value);
      if (tokenStatus.has_token && !tokenStatus.is_expired) {
        state.value = { status: 'token_ok', owner: tokenStatus.owner! };
      } else {
        state.value = { status: 'no_token' };
      }
    } catch (err: any) {
      console.error('[useGoogleSheetSync] disconnectSheet failed', err);
    }
  }

  /**
   * Manually trigger a full re-export of all Responses to the Sheet.
   */
  async function triggerManualExport(): Promise<void> {
    if (!tableId.value) return;

    try {
      await GoogleSheetApi.triggerInitialExport(tableId.value);
      state.value = { status: 'exporting', progress: 'Re-export dijadwalkan...' };
      await pollUntilExportComplete();
      await refreshStatus();
    } catch (err: any) {
      console.error('[useGoogleSheetSync] triggerManualExport failed', err);
    }
  }

  /**
   * Poll sync status until pending_rows drops to 0 or timeout.
   * Max polling time: 5 minutes (300 seconds), every 3 seconds.
   */
  async function pollUntilExportComplete(): Promise<void> {
    const maxAttempts = 100;
    let attempts = 0;

    while (attempts < maxAttempts) {
      await sleep(3000);
      attempts++;

      try {
        const status = await GoogleSheetApi.getSyncStatus(tableId.value);
        syncStatus.value = status;

        if (state.value.status === 'exporting') {
          state.value = {
            status: 'exporting',
            progress: `Tersync: ${status.config?.total_rows_synced ?? 0} baris (${status.pending_rows} menunggu...)`,
          };
        }

        if (status.pending_rows === 0) {
          break;
        }
      } catch {
        break;
      }
    }
  }

  // ========== Utilities ==========

  function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function clearError(): void {
    errorMessage.value = null;
    if (state.value.status === 'error') {
      state.value = { status: 'idle' };
    }
  }

  /**
   * Manually pull latest records from the connected Sheet into the Table.
   */
  async function triggerPullFromSheet(): Promise<{ success: boolean; rows_imported: number; message: string }> {
    if (!tableId.value) return { success: false, rows_imported: 0, message: 'No table selected' };
    try {
      isLoading.value = true;
      const res = await GoogleSheetApi.pullSheetData(tableId.value);
      await refreshStatus();
      return res;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Update sync mode (toggle between One-Way and Two-Way sync).
   */
  async function setSyncMode(inboundEnabled: boolean): Promise<void> {
    if (!tableId.value) return;
    try {
      isLoading.value = true;
      await GoogleSheetApi.updateSyncMode(tableId.value, { inbound_sync_enabled: inboundEnabled });
      await refreshStatus();
    } finally {
      isLoading.value = false;
    }
  }

  return {
    // State
    state,
    syncStatus,
    isLoading,
    errorMessage,

    // Computed
    isConnected,
    hasToken,
    spreadsheetUrl,

    // Actions
    refreshStatus,
    startOAuthFlow,
    connectSheet,
    disconnectSheet,
    triggerManualExport,
    triggerPullFromSheet,
    setSyncMode,
    clearError,
  };
}
