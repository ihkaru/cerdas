<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\GoogleSheetInitialExportJob;
use App\Actions\GoogleSheet\BatchCreateTablesFromSheetAction;
use App\Actions\GoogleSheet\CreateAppFromSheetAction;
use App\Actions\GoogleSheet\CreateTableFromSheetAction;
use App\Actions\GoogleSheet\ImportGoogleSheetRowsAction;
use App\Actions\GoogleSheet\ReconcileGoogleSheetHeadersAction;
use App\Models\App;
use App\Models\GoogleOAuthToken;
use App\Models\Table;
use App\Models\View;
use App\Services\GoogleOAuthService;
use App\Services\GoogleSheetColumnMapper;
use App\Services\GoogleSheetsService;
use App\Services\SchemaInferenceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * GoogleSheetSyncController
 *
 * Handles all Google Sheet Sync API endpoints:
 * - App-level OAuth token management (connect/disconnect Google Account)
 * - Table-level Sheet connection (link/unlink a Sheet tab to a Table)
 * - Initial export trigger and sync status
 * - Schema inspection & auto Table/App creation from Google Sheet
 */
class GoogleSheetSyncController extends Controller
{
    public function __construct(
        private readonly GoogleOAuthService $oauthService,
        private readonly GoogleSheetsService $sheetsService,
        private readonly GoogleSheetColumnMapper $mapper,
        private readonly SchemaInferenceService $schemaInferenceService,
        private readonly CreateTableFromSheetAction $createTableAction,
        private readonly BatchCreateTablesFromSheetAction $batchCreateTablesAction,
        private readonly CreateAppFromSheetAction $createAppAction,
        private readonly ImportGoogleSheetRowsAction $importRowsAction,
        private readonly ReconcileGoogleSheetHeadersAction $reconcileHeadersAction
    ) {}

    // ========== App-Level OAuth ==========

    /**
     * GET /api/google/sheets/auth-url/{app}
     *
     * Generate a Google OAuth authorization URL for the given App.
     * The user should be redirected (or popup-opened) to this URL to grant
     * offline access to Sheets.
     */
    public function getAuthUrl(Request $request, App $app): JsonResponse
    {
        $this->authorizeAppAdmin($request, $app);

        $result = $this->oauthService->getAuthUrl($app->id);

        return response()->json([
            'url' => $result['url'],
            'state' => $result['state'],
        ]);
    }

    /**
     * POST /api/google/sheets/callback
     *
     * Exchange the OAuth authorization code for tokens and store them.
     * Called after Google redirects back with ?code=...&state=...
     */
    public function handleCallback(Request $request): JsonResponse
    {
        $request->validate([
            'code' => 'required|string',
            'state' => 'required|string',
        ]);

        $code = $request->input('code');
        $state = $request->input('state');

        // Decode state to get app_id
        $stateData = json_decode(base64_decode($state), true);
        $appId = $stateData['app_id'] ?? null;

        if (! $appId) {
            return response()->json(['message' => 'Invalid state parameter.'], 400);
        }

        /** @var App|null $app */
        $app = App::find($appId);
        if (! $app) {
            return response()->json(['message' => 'App not found.'], 404);
        }

        $this->authorizeAppAdmin($request, $app);

        try {
            $token = $this->oauthService->exchangeCodeAndStore($code, $appId, $request->user()->id);

            return response()->json([
                'success' => true,
                'message' => 'Google Account berhasil dihubungkan.',
                'owner' => [
                    'name' => $token->owner->name,
                    'email' => $token->owner->email,
                ],
            ]);
        } catch (\RuntimeException $e) {
            Log::error('GoogleSheetSyncController: handleCallback failed', [
                'app_id' => $appId,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Gagal menghubungkan Google Account: '.$e->getMessage(),
            ], 422);
        }
    }

    /**
     * GET /api/google/sheets/token-status/{app}
     *
     * Check whether an App has a valid Google OAuth token.
     */
    public function tokenStatus(Request $request, App $app): JsonResponse
    {
        $this->authorizeAppAdmin($request, $app);

        $token = GoogleOAuthToken::where('app_id', $app->id)->with('owner')->first();

        if (! $token) {
            return response()->json([
                'has_token' => false,
                'owner' => null,
                'is_expired' => false,
                'scopes' => [],
            ]);
        }

        return response()->json([
            'has_token' => true,
            'owner' => [
                'name' => $token->owner->name,
                'email' => $token->owner->email,
            ],
            'is_expired' => $token->isExpired(),
            'scopes' => explode(' ', $token->scopes),
        ]);
    }

    /**
     * DELETE /api/google/sheets/disconnect/{app}
     *
     * Remove the Google OAuth token for an App.
     * Also disables sync on all Tables in the App.
     */
    public function disconnectApp(Request $request, App $app): JsonResponse
    {
        $this->authorizeAppAdmin($request, $app);

        GoogleOAuthToken::where('app_id', $app->id)->delete();

        // Disable sync on all tables in this app
        Table::where('app_id', $app->id)
            ->where('source_type', 'google_sheets')
            ->get()
            ->each(function (Table $table) {
                $config = $table->source_config ?? [];
                if (isset($config['google_sheet'])) {
                    $config['google_sheet']['sync_enabled'] = false;
                    $table->update(['source_config' => $config]);
                }
            });

        return response()->json(['success' => true, 'message' => 'Google Account berhasil diputus.']);
    }

    // ========== Table-Level Sheet Connection ==========

    /**
     * POST /api/tables/{table}/sheets/connect
     *
     * Link a Google Sheet to a Table.
     * - Verifies access to the spreadsheet
     * - Creates tab(s) for root + nested fields
     * - Writes header rows
     * - Dispatches initial export if existing data exists
     */
    public function connectSheet(Request $request, Table $table): JsonResponse
    {
        $request->validate([
            'spreadsheet_url' => 'required|string|url',
            'sheet_name' => 'nullable|string',
        ]);

        $app = $table->app;
        $this->authorizeAppAdmin($request, $app);

        // Check Google token exists for this App
        if (! $this->oauthService->hasToken($app->id)) {
            return response()->json([
                'message' => 'Google Account belum dihubungkan untuk App ini. Hubungkan dulu sebelum connect Sheet.',
            ], 422);
        }

        // Extract spreadsheet ID from URL
        $spreadsheetId = $this->extractSpreadsheetId($request->input('spreadsheet_url'));
        if (! $spreadsheetId) {
            return response()->json([
                'message' => 'URL Google Sheet tidak valid. Pastikan format: https://docs.google.com/spreadsheets/d/{ID}/...',
            ], 422);
        }

        // Verify access
        if (! $this->sheetsService->verifyAccess($app, $spreadsheetId)) {
            return response()->json([
                'message' => 'Tidak bisa mengakses spreadsheet ini. Pastikan spreadsheet dapat diakses oleh akun Google yang terhubung, atau spreadsheet tersebut sudah ada.',
            ], 422);
        }

        // Load table version & fields
        $tableVersion = $table->getWorkingVersion();
        $fields = $tableVersion?->fields ?? [];
        $tableName = $table->name;

        // Detect repeatable (nested) fields
        $repeatableFields = $this->mapper->getRepeatableFields($fields);

        // Build tab definitions
        $tabs = [];

        $syncMode = $request->input('sync_mode', $table->source_config['google_sheet']['sync_mode'] ?? 'standard');

        // Root tab (use user-specified tab name if provided, otherwise default to Table name)
        $rootTabName = $request->filled('sheet_name') ? trim((string) $request->input('sheet_name')) : $tableName;
        $rootGid = $this->sheetsService->ensureTabExists($app, $spreadsheetId, $rootTabName);
        $rootHeaders = $this->mapper->buildHeaders($fields, isRoot: true, nestedFieldKey: null, syncMode: $syncMode);
        $this->sheetsService->writeHeaders($app, $spreadsheetId, $rootTabName, $rootHeaders);

        $tabs[] = [
            'sheet_name' => $rootTabName,
            'sheet_gid' => $rootGid,
            'type' => 'root',
            'field_key' => null,
        ];

        // Nested tabs (one per repeatable field)
        foreach ($repeatableFields as $fieldKey => $fieldLabel) {
            $nestedTabName = "{$tableName} - {$fieldLabel}";
            $nestedGid = $this->sheetsService->ensureTabExists($app, $spreadsheetId, $nestedTabName);
            $nestedHeaders = $this->mapper->buildHeaders($fields, isRoot: false, nestedFieldKey: $fieldKey, syncMode: $syncMode);
            $this->sheetsService->writeHeaders($app, $spreadsheetId, $nestedTabName, $nestedHeaders);

            $tabs[] = [
                'sheet_name' => $nestedTabName,
                'sheet_gid' => $nestedGid,
                'type' => 'nested',
                'field_key' => $fieldKey,
            ];
        }

        // Update Table source config
        $sourceConfig = $table->source_config ?? [];
        $sourceConfig['google_sheet'] = [
            'spreadsheet_id' => $spreadsheetId,
            'spreadsheet_url' => $request->input('spreadsheet_url'),
            'tabs' => $tabs,
            'sync_enabled' => true,
            'last_synced_at' => null,
            'total_rows_synced' => 0,
        ];

        $table->update([
            'source_type' => 'google_sheets',
            'source_config' => $sourceConfig,
        ]);

        // Check if there's existing data to export
        $hasExistingData = \App\Models\Response::whereHas(
            'assignment',
            fn ($q) => $q->whereHas('tableVersion', fn ($q2) => $q2->where('table_id', $table->id))
        )->exists();

        if ($hasExistingData) {
            GoogleSheetInitialExportJob::dispatch($table->id);
        }

        Log::info('GoogleSheetSyncController: sheet connected', [
            'table_id' => $table->id,
            'spreadsheet_id' => $spreadsheetId,
            'tabs' => count($tabs),
            'has_data' => $hasExistingData,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Google Sheet berhasil dihubungkan.'.($hasExistingData ? ' Ekspor data historis sedang diproses.' : ''),
            'spreadsheet_id' => $spreadsheetId,
            'tabs' => $tabs,
            'has_existing_data' => $hasExistingData,
        ]);
    }

    /**
     * DELETE /api/tables/{table}/sheets/disconnect
     *
     * Unlink the Google Sheet from a Table.
     * Does NOT delete data from the Sheet — only removes the connection config.
     */
    public function disconnectSheet(Request $request, Table $table): JsonResponse
    {
        $this->authorizeAppAdmin($request, $table->app);

        $table->update([
            'source_type' => 'internal',
            'source_config' => null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Google Sheet berhasil diputus. Data di Sheet tidak terhapus.',
        ]);
    }

    /**
     * POST /api/tables/{table}/sheets/export-all
     *
     * Manually trigger a full re-export of all Responses to the connected Sheet.
     * Useful for re-sync after connectivity issues.
     */
    public function triggerInitialExport(Request $request, Table $table): JsonResponse
    {
        $this->authorizeAppAdmin($request, $table->app);

        if ($table->source_type !== 'google_sheets') {
            return response()->json(['message' => 'Table ini belum dihubungkan ke Google Sheet.'], 422);
        }

        GoogleSheetInitialExportJob::dispatch($table->id);

        return response()->json([
            'success' => true,
            'queued' => true,
            'message' => 'Re-export dijadwalkan. Data akan muncul di Sheet dalam beberapa menit.',
        ]);
    }

    /**
     * POST /api/tables/{table}/sheets/sync-headers
     *
     * Reconcile Google Sheet headers with the current Table fields.
     * Writes updated header labels to Row 1 of the connected Google Sheet.
     */
    public function syncHeaders(Request $request, Table $table): JsonResponse
    {
        $this->authorizeAppAdmin($request, $table->app);

        if ($table->source_type !== 'google_sheets') {
            return response()->json(['message' => 'Table ini belum dihubungkan ke Google Sheet.'], 422);
        }

        try {
            $result = $this->reconcileHeadersAction->execute($table);

            return response()->json([
                'success' => $result['success'],
                'message' => $result['message'],
                'root_headers' => $result['root_headers'],
                'nested_headers' => $result['nested_headers'],
            ]);
        } catch (\Throwable $e) {
            Log::error('GoogleSheetSyncController: syncHeaders failed', [
                'table_id' => $table->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal menyelaraskan header Google Sheet: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/tables/{table}/sheets/status
     *
     * Get the current sync status for a Table's Sheet connection.
     */
    public function syncStatus(Request $request, Table $table): JsonResponse
    {
        $this->authorizeAppAdmin($request, $table->app);

        $app = $table->app;
        $token = GoogleOAuthToken::where('app_id', $app->id)->with('owner')->first();
        $sheetConfig = $table->source_config['google_sheet'] ?? null;
        $pendingRows = 0;

        if ($sheetConfig) {
            $spreadsheetId = $sheetConfig['spreadsheet_id'] ?? null;
            if ($spreadsheetId) {
                $pendingRows = \App\Models\PendingSheetRow::where('spreadsheet_id', $spreadsheetId)->count();
            }
        }

        return response()->json([
            'table_id' => $table->id,
            'is_connected' => $table->source_type === 'google_sheets',
            'config' => $sheetConfig,
            'token_status' => [
                'has_token' => $token !== null,
                'owner' => $token ? ['name' => $token->owner->name, 'email' => $token->owner->email] : null,
                'is_expired' => $token?->isExpired() ?? false,
            ],
            'pending_rows' => $pendingRows,
        ]);
    }

    /**
     * PATCH /api/tables/{table}/sheets/mode
     *
     * Update sync mode (e.g. toggle inbound_sync_enabled between One-Way and Two-Way).
     */
    public function updateSyncMode(Request $request, Table $table): JsonResponse
    {
        $this->authorizeAppAdmin($request, $table->app);

        if ($table->source_type !== 'google_sheets') {
            return response()->json(['message' => 'Table ini belum dihubungkan ke Google Sheet.'], 422);
        }

        $request->validate([
            'inbound_sync_enabled' => 'required|boolean',
        ]);

        $sourceConfig = $table->source_config ?? [];
        $sourceConfig['google_sheet']['inbound_sync_enabled'] = $request->boolean('inbound_sync_enabled');
        $table->update(['source_config' => $sourceConfig]);

        $modeName = $sourceConfig['google_sheet']['inbound_sync_enabled'] ? 'Two-Way (2 Arah)' : 'One-Way Export (1 Arah)';

        return response()->json([
            'success' => true,
            'config' => $sourceConfig['google_sheet'],
            'message' => "Mode sinkronisasi berhasil diubah menjadi {$modeName}.",
        ]);
    }

    // ========== Schema Inspection & Auto Creation ==========

    /**
     * POST /api/google/sheets/inspect-workbook/{app}
     *
     * Lightweight inspection of a Google Spreadsheet: fetches title and tab names
     * without fetching data rows or inferring column schemas.
     */
    public function inspectWorkbook(Request $request, App $app): JsonResponse
    {
        $this->authorizeAppAdmin($request, $app);

        $request->validate([
            'spreadsheet_url' => 'required_without:spreadsheet_id|nullable|string',
            'spreadsheet_id' => 'required_without:spreadsheet_url|nullable|string',
        ]);

        $rawInput = (string) ($request->input('spreadsheet_url') ?? $request->input('spreadsheet_id'));
        $spreadsheetId = $this->sheetsService->extractSpreadsheetId($rawInput);

        if (! $spreadsheetId) {
            return response()->json(['message' => 'URL atau ID Spreadsheet tidak valid.'], 422);
        }

        try {
            $meta = $this->sheetsService->getSpreadsheetMeta($app, $spreadsheetId);

            return response()->json([
                'spreadsheet_id' => $spreadsheetId,
                'spreadsheet_url' => "https://docs.google.com/spreadsheets/d/{$spreadsheetId}/edit",
                'title' => $meta['title'],
                'sheets' => $meta['sheets'],
            ]);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Exception $e) {
            Log::error('GoogleSheetSyncController: inspectWorkbook failed', [
                'app_id' => $app->id,
                'spreadsheet_id' => $spreadsheetId,
                'error' => $e->getMessage(),
            ]);

            return response()->json(['message' => 'Gagal membaca spreadsheet: '.$e->getMessage()], 500);
        }
    }

    /**
     * POST /api/google/sheets/inspect-schema/{app}
     *
     * Inspect a Google Spreadsheet's tabs and infer schema from sample rows.
     */
    public function inspectSchema(Request $request, App $app): JsonResponse
    {
        $this->authorizeAppAdmin($request, $app);

        $request->validate([
            'spreadsheet_url' => 'required_without:spreadsheet_id|nullable|string',
            'spreadsheet_id' => 'required_without:spreadsheet_url|nullable|string',
            'sheet_name' => 'nullable|string',
        ]);

        $rawInput = (string) ($request->input('spreadsheet_url') ?? $request->input('spreadsheet_id'));
        $spreadsheetId = $this->sheetsService->extractSpreadsheetId($rawInput);

        if (! $spreadsheetId) {
            return response()->json(['message' => 'URL atau ID Spreadsheet tidak valid.'], 422);
        }

        try {
            // 1. Fetch metadata (sheet tab names & title)
            $meta = $this->sheetsService->getSpreadsheetMeta($app, $spreadsheetId);

            if (empty($meta['sheets'])) {
                return response()->json(['message' => 'Spreadsheet tidak memiliki lembar kerja (tab).'], 422);
            }

            // 2. Select target sheet (default to first tab)
            $selectedSheet = $request->input('sheet_name');
            if (! $selectedSheet || ! in_array($selectedSheet, $meta['sheets'], true)) {
                $selectedSheet = $meta['sheets'][0];
            }

            // 3. Fetch sample rows (up to 30 rows)
            $rows = $this->sheetsService->getSampleSheetRows($app, $spreadsheetId, $selectedSheet, 30);

            // 4. Infer schema definition
            $inference = $this->schemaInferenceService->inferSchema($rows);

            return response()->json([
                'spreadsheet_id' => $spreadsheetId,
                'spreadsheet_url' => "https://docs.google.com/spreadsheets/d/{$spreadsheetId}/edit",
                'title' => $meta['title'],
                'sheets' => $meta['sheets'],
                'selected_sheet' => $selectedSheet,
                'columns' => $inference['columns'],
                'suggested_key' => $inference['suggested_key'],
                'preview' => $inference['preview'],
            ]);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Exception $e) {
            Log::error('GoogleSheetSyncController: inspectSchema failed', [
                'app_id' => $app->id,
                'spreadsheet_id' => $spreadsheetId,
                'error' => $e->getMessage(),
            ]);

            return response()->json(['message' => 'Gagal membaca spreadsheet: '.$e->getMessage()], 500);
        }
    }

    /**
     * POST /api/google/sheets/create-table-from-sheet/{app}
     *
     * Create a new Table in the App from an inspected Google Sheet schema and bind 2-way sync.
     */
    public function createTableFromSheet(Request $request, App $app): JsonResponse
    {
        $this->authorizeAppAdmin($request, $app);

        $request->validate([
            'spreadsheet_url' => 'required_without:spreadsheet_id|nullable|string',
            'spreadsheet_id' => 'required_without:spreadsheet_url|nullable|string',
            'table_name' => 'required|string|max:255',
            'sheet_name' => 'nullable|string',
            'columns' => 'required|array|min:1',
            'key_column' => 'nullable|string',
        ]);

        $rawInput = (string) ($request->input('spreadsheet_url') ?? $request->input('spreadsheet_id'));
        $spreadsheetId = $this->sheetsService->extractSpreadsheetId($rawInput);

        try {
            $result = $this->createTableAction->execute(
                $app,
                $spreadsheetId,
                trim((string) $request->input('table_name')),
                (string) ($request->input('sheet_name') ?? 'Sheet1'),
                $request->input('columns'),
                (string) ($request->input('key_column') ?? '_cerdas_id')
            );

            return response()->json([
                'success' => true,
                'message' => "Tabel '{$result['table']->name}' berhasil dibuat dan terhubung ke Google Sheets.",
                'table_id' => $result['table']->id,
                'app_id' => $app->id,
                'view_id' => $result['view']->id,
            ], 201);
        } catch (\Exception $e) {
            Log::error('GoogleSheetSyncController: createTableFromSheet failed', [
                'app_id' => $app->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json(['message' => 'Gagal membuat tabel dari sheet: '.$e->getMessage()], 500);
        }
    }

    /**
     * POST /api/google/sheets/batch-create-tables-from-sheet/{app}
     *
     * Batch create multiple Tables in an existing App from multiple Google Spreadsheet tabs.
     */
    public function batchCreateTablesFromSheet(Request $request, App $app): JsonResponse
    {
        $this->authorizeAppAdmin($request, $app);

        $request->validate([
            'spreadsheet_url' => 'required_without:spreadsheet_id|nullable|string',
            'spreadsheet_id' => 'required_without:spreadsheet_url|nullable|string',
            'tabs' => 'required|array|min:1',
            'tabs.*.sheet_name' => 'required|string',
            'tabs.*.table_name' => 'required|string|max:255',
            'tabs.*.columns' => 'required|array|min:1',
            'tabs.*.key_column' => 'nullable|string',
        ]);

        $rawInput = (string) ($request->input('spreadsheet_url') ?? $request->input('spreadsheet_id'));
        $spreadsheetId = $this->sheetsService->extractSpreadsheetId($rawInput);

        if (! $spreadsheetId) {
            return response()->json(['message' => 'URL atau ID Spreadsheet tidak valid.'], 422);
        }

        try {
            $result = $this->batchCreateTablesAction->execute(
                $app,
                $spreadsheetId,
                $request->input('tabs')
            );

            return response()->json([
                'success' => true,
                'message' => count($result['results']).' tabel berhasil dibuat dan terhubung ke Google Sheets.',
                'app_id' => $app->id,
                'results' => $result['results'],
            ], 201);
        } catch (\Exception $e) {
            Log::error('GoogleSheetSyncController: batchCreateTablesFromSheet failed', [
                'app_id' => $app->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json(['message' => 'Gagal membuat tabel dari sheet: '.$e->getMessage()], 500);
        }
    }

    /**
     * POST /api/google/sheets/create-app-from-sheet
     *
     * Create a new App along with its Tables from an inspected Google Sheet (single or multi-tab).
     */
    public function createAppFromSheet(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'mode' => 'nullable|string|in:simple,complex',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'expired_behavior' => 'nullable|string|in:read_only,hidden',
            'temp_app_id' => 'nullable|uuid',
            'spreadsheet_url' => 'required_without:spreadsheet_id|nullable|string',
            'spreadsheet_id' => 'required_without:spreadsheet_url|nullable|string',
            'table_name' => 'nullable|string|max:255',
            'sheet_name' => 'nullable|string',
            'columns' => 'required_without:tabs|nullable|array',
            'key_column' => 'nullable|string',
            'tabs' => 'nullable|array|min:1',
            'tabs.*.sheet_name' => 'required_with:tabs|string',
            'tabs.*.table_name' => 'required_with:tabs|string|max:255',
            'tabs.*.columns' => 'required_with:tabs|array|min:1',
            'tabs.*.key_column' => 'nullable|string',
        ]);

        $rawInput = (string) ($request->input('spreadsheet_url') ?? $request->input('spreadsheet_id'));
        $validated['spreadsheet_id'] = $this->sheetsService->extractSpreadsheetId($rawInput);

        try {
            $result = $this->createAppAction->execute($request->user(), $validated);

            $primaryTableId = $result['table']?->id ?? ($result['results'][0]['table_id'] ?? null);
            $primaryViewId = $result['view']?->id ?? ($result['results'][0]['view_id'] ?? null);

            return response()->json([
                'success' => true,
                'message' => "App '{$result['app']->name}' berhasil dibuat dan terhubung ke Google Sheets.",
                'app_id' => $result['app']->id,
                'table_id' => $primaryTableId,
                'view_id' => $primaryViewId,
                'results' => $result['results'] ?? [],
            ], 201);
        } catch (\Exception $e) {
            Log::error('GoogleSheetSyncController: createAppFromSheet failed', [
                'error' => $e->getMessage(),
            ]);

            return response()->json(['message' => 'Gagal membuat aplikasi dari Google Sheet: '.$e->getMessage()], 500);
        }
    }

    /**
     * POST /api/tables/{table}/sheets/pull
     *
     * Pull/refresh latest records from the connected Google Sheet into the Table's AppRecords and Assignments.
     */
    public function pullSheetData(Request $request, Table $table): JsonResponse
    {
        $app = $table->app;
        $this->authorizeAppAdmin($request, $app);

        $sourceConfig = $table->source_config['google_sheet'] ?? null;
        if (! $sourceConfig || empty($sourceConfig['spreadsheet_id'])) {
            return response()->json([
                'message' => 'Tabel ini tidak terhubung ke Google Sheet.',
            ], 422);
        }

        $spreadsheetId = $sourceConfig['spreadsheet_id'];
        $sheetName = $sourceConfig['sheet_name'] ?? $table->name;

        $tableVersion = $table->getWorkingVersion();
        $fields = $tableVersion?->fields ?? [];

        try {
            $importedCount = $this->importRowsAction->execute(
                $app,
                $table,
                $spreadsheetId,
                $sheetName,
                $fields
            );

            return response()->json([
                'success' => true,
                'rows_imported' => $importedCount,
                'message' => "Berhasil menyinkronkan {$importedCount} baris data dari Google Sheet.",
            ]);
        } catch (\Exception $e) {
            Log::error('GoogleSheetSyncController: pullSheetData failed', [
                'table_id' => $table->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Gagal menarik data dari Google Sheet: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * POST /api/webhooks/sheets/{tableId}
     *
     * Inbound webhook endpoint triggered by Google Apps Script onChange/onEdit.
     * Ingests latest rows from the Google Sheet into Cerdas.
     */
    public function handleWebhook(Request $request, string $tableId): JsonResponse
    {
        $table = Table::find($tableId);
        if (! $table || $table->source_type !== 'google_sheets') {
            return response()->json(['message' => 'Table not found or not connected to Google Sheets'], 404);
        }

        $sourceConfig = $table->source_config['google_sheet'] ?? null;
        if (! $sourceConfig || empty($sourceConfig['spreadsheet_id'])) {
            return response()->json(['message' => 'Sheet configuration missing'], 422);
        }

        $app = $table->app;
        if (! $app) {
            return response()->json(['message' => 'App not found'], 404);
        }

        $spreadsheetId = $sourceConfig['spreadsheet_id'];
        $sheetName = $sourceConfig['sheet_name'] ?? $table->name;
        $version = $table->getWorkingVersion();
        $fields = $version?->fields ?? [];

        try {
            $count = $this->importRowsAction->execute(
                $app,
                $table,
                $spreadsheetId,
                $sheetName,
                $fields
            );

            $fullConfig = $table->source_config ?? [];
            $fullConfig['google_sheet']['last_inbound_synced_at'] = now()->toISOString();
            $fullConfig['google_sheet']['inbound_rows_count'] = $count;
            $table->update(['source_config' => $fullConfig]);

            return response()->json([
                'success' => true,
                'rows_synced' => $count,
                'message' => "Webhook processed successfully. {$count} rows synced.",
            ]);
        } catch (\Exception $e) {
            Log::error('GoogleSheetSyncController: webhook error', [
                'table_id' => $tableId,
                'error' => $e->getMessage(),
            ]);

            return response()->json(['message' => 'Webhook processing failed: '.$e->getMessage()], 500);
        }
    }

    // ========== Private Helpers ==========

    /**
     * Extract spreadsheet ID from a Google Sheets URL.
     * Supports: .../d/{ID}/... and .../d/{ID} (no trailing slash)
     */
    private function extractSpreadsheetId(string $url): ?string
    {
        if (preg_match('/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/', $url, $matches)) {
            return $matches[1];
        }

        return null;
    }

    /**
     * Authorize that the authenticated user is an admin of the given App.
     * Allows: app creator, app_admin member, project_admin, super_admin.
     */
    private function authorizeAppAdmin(Request $request, App $app): void
    {
        $user = $request->user();

        if ($user->isSuperAdmin()) {
            return;
        }

        if ($app->created_by === $user->id) {
            return;
        }

        $membership = $user->appMemberships()
            ->where('app_id', $app->id)
            ->where('is_active', true)
            ->first();

        if (! $membership || ! in_array($membership->role, ['app_admin', 'project_admin', 'org_admin'], true)) {
            abort(403, 'Anda tidak memiliki akses untuk mengelola integrasi App ini.');
        }
    }
}
