<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\GoogleSheetInitialExportJob;
use App\Models\App;
use App\Models\GoogleOAuthToken;
use App\Models\Table;
use App\Services\GoogleOAuthService;
use App\Services\GoogleSheetColumnMapper;
use App\Services\GoogleSheetsService;
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
 */
class GoogleSheetSyncController extends Controller
{
    public function __construct(
        private readonly GoogleOAuthService $oauthService,
        private readonly GoogleSheetsService $sheetsService,
        private readonly GoogleSheetColumnMapper $mapper
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

        // Root tab
        $rootTabName = $tableName;
        $rootGid = $this->sheetsService->ensureTabExists($app, $spreadsheetId, $rootTabName);
        $rootHeaders = $this->mapper->buildHeaders($fields, isRoot: true);
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
            $nestedHeaders = $this->mapper->buildHeaders($fields, isRoot: false, nestedFieldKey: $fieldKey);
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
