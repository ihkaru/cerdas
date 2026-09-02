<?php

namespace App\Actions\GoogleSheet;

use App\Models\App;
use App\Models\GoogleOAuthToken;
use App\Models\Table;
use App\Models\TableVersion;
use App\Services\GoogleSheetColumnMapper;
use App\Services\GoogleSheetsService;
use Illuminate\Support\Facades\Log;

/**
 * ReconcileGoogleSheetHeadersAction
 *
 * Reconciles the header row (Row 1) of a connected Google Sheet
 * with the latest field schema of a Cerdas Table.
 *
 * Ensures that newly added, renamed, or reordered fields in the Cerdas Form Editor
 * automatically reflect as column headers in Google Sheets.
 */
class ReconcileGoogleSheetHeadersAction
{
    public function __construct(
        private readonly GoogleSheetsService $sheetsService,
        private readonly GoogleSheetColumnMapper $mapper
    ) {}

    /**
     * Execute header reconciliation for a given Table and TableVersion.
     *
     * @param  Table  $table  Target table
     * @param  TableVersion|null  $version  Specific version (falls back to working/published version)
     * @return array{success: bool, message: string, root_headers: array<string>, nested_headers: array<string, array<string>>}
     */
    public function execute(Table $table, ?TableVersion $version = null): array
    {
        if ($table->source_type !== 'google_sheets') {
            return [
                'success' => false,
                'message' => 'Table is not connected to Google Sheets.',
                'root_headers' => [],
                'nested_headers' => [],
            ];
        }

        $sheetConfig = $table->source_config['google_sheet'] ?? null;
        if (! $sheetConfig || empty($sheetConfig['spreadsheet_id'])) {
            return [
                'success' => false,
                'message' => 'Table has no valid Google Sheets configuration.',
                'root_headers' => [],
                'nested_headers' => [],
            ];
        }

        /** @var App|null $app */
        $app = $table->app;
        if (! $app) {
            return [
                'success' => false,
                'message' => 'Parent app not found for table.',
                'root_headers' => [],
                'nested_headers' => [],
            ];
        }

        // Verify Google OAuth token
        $token = GoogleOAuthToken::where('app_id', $app->id)->first();
        if (! $token) {
            return [
                'success' => false,
                'message' => 'Google account not connected for this app.',
                'root_headers' => [],
                'nested_headers' => [],
            ];
        }

        // Proactively refresh token if needed
        if ($token->needsRefresh()) {
            $this->sheetsService->refreshToken($token);
            $token->refresh();
        }

        $spreadsheetId = $sheetConfig['spreadsheet_id'];
        $tableVersion = $version ?? $table->getWorkingVersion();
        $fields = $tableVersion?->fields ?? [];

        // Tab definitions
        $tabs = $sheetConfig['tabs'] ?? [];
        if (empty($tabs) && ! empty($sheetConfig['sheet_name'])) {
            $tabs = [
                [
                    'sheet_name' => $sheetConfig['sheet_name'],
                    'type' => 'root',
                    'field_key' => null,
                ],
            ];
        }

        $rootTab = null;
        $nestedTabsMap = [];
        foreach ($tabs as $tab) {
            if ($tab['type'] === 'root') {
                $rootTab = $tab;
            } else {
                $nestedTabsMap[$tab['field_key']] = $tab;
            }
        }

        $rootTabName = $rootTab['sheet_name'] ?? $sheetConfig['sheet_name'] ?? $table->name;
        $rootHeaders = $this->mapper->buildHeaders($fields, isRoot: true);

        // 1. Reconcile Root Tab Headers
        $this->sheetsService->writeHeaders($app, $spreadsheetId, $rootTabName, $rootHeaders);
        Log::info('ReconcileGoogleSheetHeadersAction: root headers reconciled', [
            'table_id' => $table->id,
            'spreadsheet_id' => $spreadsheetId,
            'tab' => $rootTabName,
            'headers_count' => count($rootHeaders),
        ]);

        // 2. Reconcile Nested Tab Headers (if any repeatable fields exist)
        $repeatableFields = $this->mapper->getRepeatableFields($fields);
        $nestedResults = [];

        foreach ($repeatableFields as $fieldKey => $fieldLabel) {
            $existingNestedTab = $nestedTabsMap[$fieldKey] ?? null;
            $nestedTabName = $existingNestedTab['sheet_name'] ?? "{$table->name} - {$fieldLabel}";

            // Ensure tab exists
            $this->sheetsService->ensureTabExists($app, $spreadsheetId, $nestedTabName);

            $nestedHeaders = $this->mapper->buildHeaders($fields, isRoot: false, nestedFieldKey: $fieldKey);
            $this->sheetsService->writeHeaders($app, $spreadsheetId, $nestedTabName, $nestedHeaders);

            $nestedResults[$nestedTabName] = $nestedHeaders;
        }

        return [
            'success' => true,
            'message' => 'Google Sheet headers reconciled successfully.',
            'root_headers' => $rootHeaders,
            'nested_headers' => $nestedResults,
        ];
    }
}
