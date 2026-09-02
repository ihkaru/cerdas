<?php

namespace App\Actions\GoogleSheet;

use App\Models\App;
use App\Models\GoogleOAuthToken;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * CreateAppFromSheetAction
 *
 * Encapsulates the transactional creation of an App and its primary Table
 * directly from an inspected Google Sheet.
 */
class CreateAppFromSheetAction
{
    public function __construct(
        private readonly CreateTableFromSheetAction $createTableAction,
        private readonly BatchCreateTablesFromSheetAction $batchCreateTablesAction
    ) {}

    /**
     * Execute the action.
     *
     * @param  User  $user  The authenticated user creating the app
     * @param  array{
     *     name: string,
     *     description?: string|null,
     *     mode?: string|null,
     *     start_date?: string|null,
     *     end_date?: string|null,
     *     expired_behavior?: string|null,
     *     temp_app_id?: string|null,
     *     spreadsheet_id: string,
     *     table_name?: string|null,
     *     sheet_name?: string|null,
     *     columns?: array,
     *     key_column?: string|null,
     *     tabs?: array
     * } $data
     * @return array{app: App, table: \App\Models\Table|null, view: \App\Models\View|null, tables?: array, results?: array}
     */
    public function execute(User $user, array $data): array
    {
        $appName = trim($data['name']);
        $spreadsheetId = $data['spreadsheet_id'];

        // 1. Generate unique slug for App
        $baseSlug = Str::slug($appName);
        $slug = $baseSlug ?: 'app';
        $counter = 1;
        while (App::withTrashed()->where('slug', $slug)->exists()) {
            $slug = "{$baseSlug}-".$counter++;
        }

        // 2. Create App & Reassign token within transaction
        $app = DB::transaction(function () use ($user, $data, $appName, $slug) {
            $app = App::create([
                'id' => Str::uuid()->toString(),
                'name' => $appName,
                'slug' => $slug,
                'description' => $data['description'] ?? null,
                'mode' => $data['mode'] ?? 'simple',
                'created_by' => $user->id,
                'start_date' => $data['start_date'] ?? null,
                'end_date' => $data['end_date'] ?? null,
                'expired_behavior' => $data['expired_behavior'] ?? 'read_only',
            ]);

            // Reassign OAuth Token if created under temporary temp_app_id
            if (! empty($data['temp_app_id'])) {
                GoogleOAuthToken::where('app_id', $data['temp_app_id'])
                    ->update(['app_id' => $app->id]);
            }

            return $app;
        });

        // 3. Create Tables: Multi-Tab Batch mode or Single-Tab mode
        if (! empty($data['tabs']) && is_array($data['tabs'])) {
            $batchResult = $this->batchCreateTablesAction->execute($app, $spreadsheetId, $data['tabs']);

            return [
                'app' => $app,
                'table' => $batchResult['tables'][0] ?? null,
                'view' => $batchResult['views'][0] ?? null,
                'tables' => $batchResult['tables'],
                'views' => $batchResult['views'],
                'results' => $batchResult['results'],
            ];
        }

        // Single-tab fallback
        $tableName = trim((string) ($data['table_name'] ?? $appName));
        $sheetName = (string) ($data['sheet_name'] ?? 'Sheet1');
        $keyColumn = (string) ($data['key_column'] ?? '_cerdas_id');
        $columns = $data['columns'] ?? [];

        $tableResult = $this->createTableAction->execute(
            $app,
            $spreadsheetId,
            $tableName,
            $sheetName,
            $columns,
            $keyColumn
        );

        return [
            'app' => $app,
            'table' => $tableResult['table'],
            'view' => $tableResult['view'],
            'tables' => [$tableResult['table']],
            'views' => [$tableResult['view']],
            'results' => [
                [
                    'table_id' => $tableResult['table']->id,
                    'table_name' => $tableResult['table']->name,
                    'sheet_name' => $sheetName,
                    'view_id' => $tableResult['view']->id,
                    'rows_imported' => $tableResult['rows_imported'] ?? 0,
                ],
            ],
        ];
    }
}
