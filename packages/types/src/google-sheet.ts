/**
 * Google Sheet Sync types for Cerdas
 *
 * Used by: apps/editor (TableSheetSyncPanel.vue + useGoogleSheetSync.ts)
 * Used by: apps/backend (API contract reference)
 */

// ========== Sheet Config (stored in Table.source_config.google_sheet) ==========

export interface GoogleSheetTabConfig {
  /** The name of the tab in the Google Spreadsheet */
  sheet_name: string;
  /** The GID (sheet ID) of the tab, used for direct deep links */
  sheet_gid: number;
  /** 'root' = main tab for top-level responses, 'nested' = sub-form repeatable section */
  type: 'root' | 'nested';
  /** For nested tabs: the field_key of the repeatable section. null for root. */
  field_key: string | null;
}

export interface GoogleSheetConfig {
  spreadsheet_id: string;
  spreadsheet_url: string;
  tabs: GoogleSheetTabConfig[];
  sync_enabled: boolean;
  last_synced_at: string | null;
  total_rows_synced: number;
}

// ========== Token Status ==========

export interface GoogleSheetTokenOwner {
  name: string;
  email: string;
}

export interface GoogleSheetTokenStatus {
  /** True if the App has a stored Google OAuth token (even if expired) */
  has_token: boolean;
  /** The user who connected the Google Account */
  owner: GoogleSheetTokenOwner | null;
  /** True if the access_token has expired and refresh failed */
  is_expired: boolean;
  /** Granted OAuth scopes */
  scopes?: string[];
}

// ========== Sync Status (GET /tables/{table}/sheets/status) ==========

export interface SheetSyncStatus {
  table_id: string;
  is_connected: boolean;
  config: GoogleSheetConfig | null;
  token_status: GoogleSheetTokenStatus;
  /** Number of rows in pending_sheet_rows not yet flushed to Sheets */
  pending_rows: number;
}

// ========== UI State Machine ==========

export type SheetSyncState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'no_token' }                                         // Google Account not connected
  | { status: 'token_ok'; owner: GoogleSheetTokenOwner }           // Token exists, Sheet not connected yet
  | { status: 'connecting' }                                       // Connecting to Sheet (API call in progress)
  | { status: 'connected'; config: GoogleSheetConfig }             // Sheet connected, idle/syncing
  | { status: 'exporting'; progress?: string }                     // Initial export in progress
  | { status: 'error'; message: string; can_reconnect: boolean };  // Error state

// ========== API Request/Response shapes ==========

export interface ConnectSheetRequest {
  spreadsheet_url: string;
}

export interface ConnectSheetResponse {
  success: boolean;
  message: string;
  spreadsheet_id: string;
  tabs: GoogleSheetTabConfig[];
  has_existing_data: boolean;
}

export interface AuthUrlResponse {
  url: string;
  state: string;
}

export interface OAuthCallbackRequest {
  code: string;
  state: string;
}
