import { ApiClient } from './ApiClient';
import type {
  AuthUrlResponse,
  ConnectSheetRequest,
  ConnectSheetResponse,
  GoogleSheetTokenStatus,
  SheetSyncStatus,
} from '@cerdas/types';

/**
 * GoogleSheetApi
 *
 * All API calls for Google Sheet Sync feature.
 * Mirrors GoogleSheetSyncController endpoints.
 */
export const GoogleSheetApi = {
  // ========== App-Level OAuth ==========

  /**
   * Get the Google OAuth authorization URL for a given App.
   * The editor should open this URL in a popup window.
   */
  getAuthUrl: (appId: string): Promise<AuthUrlResponse> =>
    ApiClient.get<AuthUrlResponse>(`/google/sheets/auth-url/${appId}`)
      .then(res => res.data),

  /**
   * Exchange OAuth authorization code for tokens (called from OAuth callback).
   */
  handleCallback: (code: string, state: string): Promise<{ success: boolean; message: string }> =>
    ApiClient.post(`/google/sheets/callback`, { code, state })
      .then(res => res.data),

  /**
   * Get the current OAuth token status for an App.
   */
  getTokenStatus: (appId: string): Promise<GoogleSheetTokenStatus> =>
    ApiClient.get<GoogleSheetTokenStatus>(`/google/sheets/token-status/${appId}`)
      .then(res => res.data),

  /**
   * Disconnect (revoke + delete) the Google OAuth token for an App.
   * Also disables sync on all Tables in the App.
   */
  disconnectApp: (appId: string): Promise<{ success: boolean }> =>
    ApiClient.delete(`/google/sheets/disconnect/${appId}`)
      .then(res => res.data),

  // ========== Table-Level Sheet Connection ==========

  /**
   * Connect a Google Sheet URL to a Table.
   * Creates tabs, writes headers, and dispatches initial export if data exists.
   */
  connectSheet: (tableId: string, spreadsheetUrl: string): Promise<ConnectSheetResponse> =>
    ApiClient.post<ConnectSheetResponse>(`/tables/${tableId}/sheets/connect`, {
      spreadsheet_url: spreadsheetUrl,
    } as ConnectSheetRequest).then(res => res.data),

  /**
   * Disconnect a Table from its Google Sheet.
   * Does NOT delete data from the Sheet.
   */
  disconnectSheet: (tableId: string): Promise<{ success: boolean }> =>
    ApiClient.delete(`/tables/${tableId}/sheets/disconnect`)
      .then(res => res.data),

  /**
   * Manually trigger a full re-export of all Responses to the connected Sheet.
   */
  triggerInitialExport: (tableId: string): Promise<{ queued: boolean; message: string }> =>
    ApiClient.post(`/tables/${tableId}/sheets/export-all`)
      .then(res => res.data),

  /**
   * Get the current sync status for a Table's Sheet connection.
   */
  getSyncStatus: (tableId: string): Promise<SheetSyncStatus> =>
    ApiClient.get<SheetSyncStatus>(`/tables/${tableId}/sheets/status`)
      .then(res => res.data),
};
