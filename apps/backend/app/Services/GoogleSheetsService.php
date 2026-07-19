<?php

namespace App\Services;

use App\Models\App;
use App\Models\GoogleOAuthToken;
use Google\Client as GoogleClient;
use Google\Service\Sheets;
use Google\Service\Sheets\AddSheetRequest;
use Google\Service\Sheets\BatchUpdateSpreadsheetRequest;
use Google\Service\Sheets\Request as SheetsRequest;
use Google\Service\Sheets\SheetProperties;
use Google\Service\Sheets\ValueRange;
use Illuminate\Support\Facades\Log;

/**
 * GoogleSheetsService
 *
 * Core service for all Google Sheets API v4 operations.
 * Handles: client management, tab creation, header writing, batch row upsert/delete.
 *
 * All methods accept an App model and automatically handle token loading + refresh.
 */
class GoogleSheetsService
{
    private GoogleSheetColumnMapper $mapper;

    public function __construct(GoogleSheetColumnMapper $mapper)
    {
        $this->mapper = $mapper;
    }

    // ========== Client Management ==========

    /**
     * Build an authenticated Google Client for a given App.
     * Auto-refreshes the token if it's close to expiry.
     *
     * @throws \RuntimeException If no token found for App
     */
    public function clientForApp(App $app): GoogleClient
    {
        /** @var GoogleOAuthToken|null $token */
        $token = GoogleOAuthToken::where('app_id', $app->id)->first();

        if (! $token) {
            throw new \RuntimeException("No Google OAuth token found for App [{$app->id}].");
        }

        $client = new GoogleClient;
        $client->setClientId(config('services.google.client_id'));
        $client->setClientSecret(config('services.google.client_secret'));

        if (app()->isLocal()) {
            $client->setHttpClient(new \GuzzleHttp\Client(['verify' => false]));
        }

        $client->setAccessToken($token->toGoogleTokenArray());

        if ($client->isAccessTokenExpired()) {
            $this->refreshToken($token, $client);
        }

        return $client;
    }

    /**
     * Build a Sheets API service from a client.
     */
    private function sheetsService(GoogleClient $client): Sheets
    {
        return new Sheets($client);
    }

    // ========== Token Refresh ==========

    /**
     * Refresh the OAuth access token using the stored refresh_token.
     * Updates the DB record with the new token data.
     *
     * @throws \RuntimeException If refresh fails (e.g., token revoked)
     */
    public function refreshToken(GoogleOAuthToken $token, ?GoogleClient $client = null): void
    {
        if ($client === null) {
            $client = new GoogleClient;
            $client->setClientId(config('services.google.client_id'));
            $client->setClientSecret(config('services.google.client_secret'));

            if (app()->isLocal()) {
                $client->setHttpClient(new \GuzzleHttp\Client(['verify' => false]));
            }
        }

        try {
            $client->fetchAccessTokenWithRefreshToken($token->refresh_token);
            $newTokenData = $client->getAccessToken();

            if (isset($newTokenData['error'])) {
                throw new \RuntimeException('Token refresh error: '.($newTokenData['error_description'] ?? $newTokenData['error']));
            }

            $token->update([
                'access_token' => $newTokenData['access_token'],
                'expires_at' => now()->addSeconds($newTokenData['expires_in'] ?? 3600),
                // refresh_token is only updated if Google rotates it
                ...(! empty($newTokenData['refresh_token'])
                    ? ['refresh_token' => $newTokenData['refresh_token']]
                    : []
                ),
            ]);

            Log::info('GoogleSheetsService: token refreshed', ['app_id' => $token->app_id]);
        } catch (\Exception $e) {
            Log::error('GoogleSheetsService: token refresh failed', [
                'app_id' => $token->app_id,
                'error' => $e->getMessage(),
            ]);
            throw new \RuntimeException('Failed to refresh Google token: '.$e->getMessage());
        }
    }

    // ========== Spreadsheet Access Verification ==========

    /**
     * Verify that the App's token has read/write access to the given spreadsheet.
     * Returns false if the spreadsheet doesn't exist or access is denied.
     */
    public function verifyAccess(App $app, string $spreadsheetId): bool
    {
        try {
            $client = $this->clientForApp($app);
            $service = $this->sheetsService($client);
            $service->spreadsheets->get($spreadsheetId);

            return true;
        } catch (\Google\Service\Exception $e) {
            Log::warning('GoogleSheetsService: verifyAccess failed', [
                'app_id' => $app->id,
                'spreadsheet_id' => $spreadsheetId,
                'status' => $e->getCode(),
                'message' => $e->getMessage(),
            ]);

            return false;
        }
    }

    // ========== Tab (Sheet) Management ==========

    /**
     * Ensure a tab with the given name exists in the spreadsheet.
     * If it doesn't exist, creates it.
     * Returns the sheet GID (used for direct URL links).
     */
    public function ensureTabExists(App $app, string $spreadsheetId, string $tabName): int
    {
        $client = $this->clientForApp($app);
        $service = $this->sheetsService($client);
        $spreadsheet = $service->spreadsheets->get($spreadsheetId);

        // Check if tab already exists
        foreach ($spreadsheet->getSheets() as $sheet) {
            if ($sheet->getProperties()->getTitle() === $tabName) {
                return $sheet->getProperties()->getSheetId();
            }
        }

        // Create new tab
        $addSheetRequest = new AddSheetRequest([
            'properties' => new SheetProperties(['title' => $tabName]),
        ]);

        $batchRequest = new BatchUpdateSpreadsheetRequest([
            'requests' => [new SheetsRequest(['addSheet' => $addSheetRequest])],
        ]);

        $response = $service->spreadsheets->batchUpdate($spreadsheetId, $batchRequest);
        $replies = $response->getReplies();

        return $replies[0]->getAddSheet()->getProperties()->getSheetId();
    }

    /**
     * Write the header row (row 1) to a tab.
     * Overwrites whatever is in row 1 — safe to call on initial setup.
     */
    public function writeHeaders(App $app, string $spreadsheetId, string $tabName, array $headers): void
    {
        $client = $this->clientForApp($app);
        $service = $this->sheetsService($client);

        $range = "{$tabName}!A1:".$this->mapper->indexToColumnLetter(count($headers) - 1).'1';
        $valueRange = new ValueRange(['values' => [$headers]]);

        $service->spreadsheets_values->update(
            $spreadsheetId,
            $range,
            $valueRange,
            ['valueInputOption' => 'RAW']
        );
    }

    // ========== Row Index Fetch ==========

    /**
     * Fetch all existing response_id → row index mappings from a tab.
     * Row 1 is assumed to be the header; data starts at row 2.
     *
     * Used by BatchFlushJob to determine whether to update an existing row
     * or append a new one.
     *
     * @return array<string, int> [response_id => 1-based row number]
     */
    public function fetchExistingRowIndex(App $app, string $spreadsheetId, string $tabName): array
    {
        $client = $this->clientForApp($app);
        $service = $this->sheetsService($client);

        try {
            $response = $service->spreadsheets_values->get($spreadsheetId, "{$tabName}!A:A");
            $values = $response->getValues() ?? [];
        } catch (\Google\Service\Exception $e) {
            Log::warning('GoogleSheetsService: fetchExistingRowIndex failed', [
                'spreadsheet_id' => $spreadsheetId,
                'tab' => $tabName,
                'error' => $e->getMessage(),
            ]);

            return [];
        }

        $index = [];
        foreach ($values as $rowNum => $row) {
            if ($rowNum === 0) {
                // Row 1 = header ("Response ID"), skip
                continue;
            }
            $responseId = $row[0] ?? null;
            if ($responseId) {
                $index[$responseId] = $rowNum + 1; // 1-based
            }
        }

        return $index;
    }

    // ========== Batch Flush ==========

    /**
     * Flush a batch of pending row operations to a single tab.
     *
     * @param  array  $rowUpdates  Array of:
     *                             [
     *                             'response_id' => string,
     *                             'operation'   => 'upsert' | 'delete',
     *                             'row_data'    => array|null,  // null for delete
     *                             'tab_type'    => 'root' | 'nested',
     *                             ]
     */
    public function batchFlushRows(
        App $app,
        string $spreadsheetId,
        string $tabName,
        array $rowUpdates
    ): void {
        if (empty($rowUpdates)) {
            return;
        }

        $client = $this->clientForApp($app);
        $service = $this->sheetsService($client);

        // Load current row index to know whether to update or append
        $existingIndex = $this->fetchExistingRowIndex($app, $spreadsheetId, $tabName);

        $updateRanges = []; // For value updates (existing rows)
        $appendRows = []; // For new rows to append
        $deleteRowNums = []; // 1-based row numbers to delete

        foreach ($rowUpdates as $update) {
            $responseId = $update['response_id'];
            $operation = $update['operation'];
            $rowData = $update['row_data'] ?? null;
            $tabType = $update['tab_type'] ?? 'root';

            if ($operation === 'delete') {
                if ($tabType === 'nested') {
                    // For nested tabs, response_id is the parent_response_id.
                    // We want to delete all rows matching it in Column B (Parent Response ID).
                    $nestedDeleteRows = $this->fetchRowNumsByParentId($app, $spreadsheetId, $tabName, $responseId);
                    $deleteRowNums = array_merge($deleteRowNums, $nestedDeleteRows);
                } else {
                    $existingRow = $existingIndex[$responseId] ?? null;
                    if ($existingRow !== null) {
                        $deleteRowNums[] = $existingRow;
                    }
                }

                continue;
            }

            // Upsert
            if ($rowData === null) {
                continue;
            }

            $existingRow = $existingIndex[$responseId] ?? null;

            if ($existingRow !== null) {
                // Update existing row
                $updateRanges[] = [
                    'range' => "{$tabName}!A{$existingRow}",
                    'values' => [$rowData],
                ];
            } else {
                // New row — will be appended
                $appendRows[] = $rowData;
            }
        }

        // Execute value updates (existing rows)
        if (! empty($updateRanges)) {
            $this->batchUpdateValues($service, $spreadsheetId, $updateRanges);
        }

        // Execute appends (new rows)
        if (! empty($appendRows)) {
            $this->appendValues($service, $spreadsheetId, $tabName, $appendRows);
        }

        // Execute deletes (sorted descending to avoid row shift issues)
        if (! empty($deleteRowNums)) {
            $deleteRowNums = array_unique($deleteRowNums);
            rsort($deleteRowNums);
            $this->deleteRows($service, $spreadsheetId, $tabName, $deleteRowNums, $existingIndex);
        }
    }

    /**
     * Fetch all row numbers in a tab where Column B (Parent Response ID) matches the given parent ID.
     * Column B is the second column (index 1).
     *
     * @return int[]
     */
    public function fetchRowNumsByParentId(App $app, string $spreadsheetId, string $tabName, string $parentId): array
    {
        $client = $this->clientForApp($app);
        $service = $this->sheetsService($client);

        try {
            $response = $service->spreadsheets_values->get($spreadsheetId, "{$tabName}!B:B");
            $values = $response->getValues() ?? [];
        } catch (\Google\Service\Exception $e) {
            Log::warning('GoogleSheetsService: fetchRowNumsByParentId failed', [
                'spreadsheet_id' => $spreadsheetId,
                'tab' => $tabName,
                'error' => $e->getMessage(),
            ]);

            return [];
        }

        $rowNums = [];
        foreach ($values as $rowNum => $row) {
            if ($rowNum === 0) {
                continue; // Skip header
            }
            $val = $row[0] ?? null;
            if ($val === $parentId) {
                $rowNums[] = $rowNum + 1; // 1-based row number
            }
        }

        return $rowNums;
    }

    /**
     * Bulk write rows to a tab (used by InitialExportJob & manual re-sync).
     * Clears all data from row 2 onwards and writes fresh rows, guaranteeing
     * an exact 1-to-1 mirror with the Cerdas database without duplicate rows.
     * Row 1 (header) is preserved.
     *
     * @param  array  $rows  Array of value arrays (one per row)
     */
    public function bulkWriteRows(App $app, string $spreadsheetId, string $tabName, array $rows): void
    {
        $client = $this->clientForApp($app);
        $service = $this->sheetsService($client);

        // Clear existing data rows (A2:ZZ10000) so sheet is a clean mirror
        try {
            $clearRequest = new \Google\Service\Sheets\ClearValuesRequest;
            $service->spreadsheets_values->clear($spreadsheetId, "'{$tabName}'!A2:ZZ10000", $clearRequest);
        } catch (\Throwable $e) {
            Log::warning('GoogleSheetsService: clear tab failed', ['tab' => $tabName, 'error' => $e->getMessage()]);
        }

        if (! empty($rows)) {
            $this->appendValues($service, $spreadsheetId, $tabName, $rows);
        }
    }

    // ========== Private API Helpers ==========

    /**
     * Execute a batchUpdate for value ranges (update existing cells).
     */
    private function batchUpdateValues(Sheets $service, string $spreadsheetId, array $updateRanges): void
    {
        $data = array_map(function (array $rangeData) {
            return new ValueRange([
                'range' => $rangeData['range'],
                'values' => $rangeData['values'],
            ]);
        }, $updateRanges);

        $body = new \Google\Service\Sheets\BatchUpdateValuesRequest([
            'valueInputOption' => 'RAW',
            'data' => $data,
        ]);

        $this->executeWithRetry(fn () => $service->spreadsheets_values->batchUpdate($spreadsheetId, $body));
    }

    /**
     * Append rows to the end of a tab (after last non-empty row).
     */
    private function appendValues(Sheets $service, string $spreadsheetId, string $tabName, array $rows): void
    {
        $valueRange = new ValueRange(['values' => $rows]);

        $this->executeWithRetry(fn () => $service->spreadsheets_values->append(
            $spreadsheetId,
            "{$tabName}!A1",
            $valueRange,
            [
                'valueInputOption' => 'RAW',
                'insertDataOption' => 'INSERT_ROWS',
            ]
        ));
    }

    /**
     * Delete specific rows by 1-based row number.
     * Must be called with row numbers in DESCENDING order to avoid index shifting.
     *
     * @param  int[]  $rowNumbers  1-based row numbers, descending
     */
    private function deleteRows(
        Sheets $service,
        string $spreadsheetId,
        string $tabName,
        array $rowNumbers,
        array $existingIndex
    ): void {
        // Get the sheet GID for the tab
        $spreadsheet = $service->spreadsheets->get($spreadsheetId);
        $sheetId = null;

        foreach ($spreadsheet->getSheets() as $sheet) {
            if ($sheet->getProperties()->getTitle() === $tabName) {
                $sheetId = $sheet->getProperties()->getSheetId();
                break;
            }
        }

        if ($sheetId === null) {
            return;
        }

        // Build delete requests (one per row, descending to avoid shift)
        $requests = array_map(function (int $rowNum) use ($sheetId) {
            return new SheetsRequest([
                'deleteDimension' => [
                    'range' => [
                        'sheetId' => $sheetId,
                        'dimension' => 'ROWS',
                        'startIndex' => $rowNum - 1, // 0-based
                        'endIndex' => $rowNum,
                    ],
                ],
            ]);
        }, $rowNumbers);

        $batchRequest = new BatchUpdateSpreadsheetRequest(['requests' => $requests]);

        $this->executeWithRetry(fn () => $service->spreadsheets->batchUpdate($spreadsheetId, $batchRequest));
    }

    /**
     * Execute a callable with exponential backoff on rate limit (429) errors.
     * Max 3 retries with 1s, 2s, 4s delays.
     */
    private function executeWithRetry(callable $fn, int $maxRetries = 3): mixed
    {
        $attempt = 0;

        while (true) {
            try {
                return $fn();
            } catch (\Google\Service\Exception $e) {
                if ($e->getCode() === 429 && $attempt < $maxRetries) {
                    $delay = (2 ** $attempt); // 1s, 2s, 4s
                    Log::warning("GoogleSheetsService: rate limited (429), retrying in {$delay}s", [
                        'attempt' => $attempt + 1,
                    ]);
                    sleep($delay);
                    $attempt++;

                    continue;
                }

                throw $e;
            }
        }
    }
}
