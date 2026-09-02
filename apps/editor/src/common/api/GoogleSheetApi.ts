import { ApiClient } from './ApiClient';
import type {
  AuthUrlResponse,
  BatchCreateTablesFromSheetRequest,
  BatchCreateTablesFromSheetResponse,
  BatchCreateTablesResultItem,
  ConnectSheetRequest,
  ConnectSheetResponse,
  CreateAppFromSheetRequest,
  CreateTableFromSheetRequest,
  GoogleSheetConfig,
  GoogleSheetTokenStatus,
  GoogleSheetWorkbookMeta,
  InspectSheetSchemaResponse,
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
  connectSheet: (tableId: string, spreadsheetUrl: string, sheetName?: string): Promise<ConnectSheetResponse> =>
    ApiClient.post<ConnectSheetResponse>(`/tables/${tableId}/sheets/connect`, {
      spreadsheet_url: spreadsheetUrl,
      sheet_name: sheetName,
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
   * Pull/refresh latest records from the connected Google Sheet into the Table.
   */
  pullSheetData: (tableId: string): Promise<{ success: boolean; rows_imported: number; message: string }> =>
    ApiClient.post<{ success: boolean; rows_imported: number; message: string }>(`/tables/${tableId}/sheets/pull`)
      .then(res => res.data),

  /**
   * Update sync mode (inbound_sync_enabled: true/false).
   */
  updateSyncMode: (tableId: string, payload: { inbound_sync_enabled: boolean }): Promise<{ success: boolean; config: GoogleSheetConfig; message: string }> =>
    ApiClient.patch<{ success: boolean; config: GoogleSheetConfig; message: string }>(`/tables/${tableId}/sheets/mode`, payload)
      .then(res => res.data),

  /**
   * Get the current sync status for a Table's Sheet connection.
   */
  getSyncStatus: (tableId: string): Promise<SheetSyncStatus> =>
    ApiClient.get<SheetSyncStatus>(`/tables/${tableId}/sheets/status`)
      .then(res => res.data),

  /**
   * Reconcile Google Sheet headers with the current Table fields.
   * Updates Row 1 in the connected Google Sheet to match all fields in Cerdas.
   */
  syncHeaders: (tableId: string): Promise<{ success: boolean; message: string; root_headers: string[]; nested_headers: Record<string, string[]> }> =>
    ApiClient.post(`/tables/${tableId}/sheets/sync-headers`)
      .then(res => res.data),

  // ========== Schema Inspection & Creation ==========

  /**
   * Inspect a Google Spreadsheet workbook: fetch title and tab names (fast, metadata only).
   */
  inspectWorkbook: (appId: string, payload: { spreadsheet_url?: string; spreadsheet_id?: string }): Promise<GoogleSheetWorkbookMeta> =>
    ApiClient.post<GoogleSheetWorkbookMeta>(`/google/sheets/inspect-workbook/${appId}`, payload)
      .then(res => res.data),

  /**
   * Inspect a Google Spreadsheet's tabs, headers, and inferred column types for a specific tab.
   */
  inspectSchema: (appId: string, payload: { spreadsheet_url?: string; spreadsheet_id?: string; sheet_name?: string }): Promise<InspectSheetSchemaResponse> =>
    ApiClient.post<InspectSheetSchemaResponse>(`/google/sheets/inspect-schema/${appId}`, payload)
      .then(res => res.data),

  /**
   * Create a new Table in the App directly from an inspected Google Sheet and configure 2-way sync.
   */
  createTableFromSheet: (appId: string, payload: CreateTableFromSheetRequest): Promise<{ success: boolean; table_id: string; app_id: string; view_id: string; message: string }> =>
    ApiClient.post(`/google/sheets/create-table-from-sheet/${appId}`, payload)
      .then(res => res.data),

  /**
   * Batch create multiple Tables in an existing App from multiple Google Spreadsheet tabs.
   */
  batchCreateTablesFromSheet: (appId: string, payload: BatchCreateTablesFromSheetRequest): Promise<BatchCreateTablesFromSheetResponse> =>
    ApiClient.post<BatchCreateTablesFromSheetResponse>(`/google/sheets/batch-create-tables-from-sheet/${appId}`, payload)
      .then(res => res.data),

  /**
   * Create a new App and its Tables in one step from an inspected Google Sheet.
   */
  createAppFromSheet: (payload: CreateAppFromSheetRequest): Promise<{ success: boolean; app_id: string; table_id: string; view_id: string; message: string; results?: BatchCreateTablesResultItem[] }> =>
    ApiClient.post(`/google/sheets/create-app-from-sheet`, payload)
      .then(res => res.data),
};

