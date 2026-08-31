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
        private readonly CreateTableFromSheetAction $createTableAction
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
     *     columns: array,
     *     key_column?: string|null
     * } $data
     * @return array{app: App, table: \App\Models\Table, view: \App\Models\View}
     */
    public function execute(User $user, array $data): array
    {
        return DB::transaction(function () use ($user, $data) {
            $appName = trim($data['name']);
            $tableName = trim((string) ($data['table_name'] ?? $appName));
            $sheetName = (string) ($data['sheet_name'] ?? 'Sheet1');
            $keyColumn = (string) ($data['key_column'] ?? '_cerdas_id');
            $spreadsheetId = $data['spreadsheet_id'];

            // 1. Generate unique slug for App
            $baseSlug = Str::slug($appName);
            $slug = $baseSlug ?: 'app';
            $counter = 1;
            while (App::withTrashed()->where('slug', $slug)->exists()) {
                $slug = "{$baseSlug}-".$counter++;
            }

            // 2. Create App
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

            // 3. Reassign OAuth Token if created under temporary temp_app_id
            if (! empty($data['temp_app_id'])) {
                GoogleOAuthToken::where('app_id', $data['temp_app_id'])
                    ->update(['app_id' => $app->id]);
            }

            // 4. Create primary Table and View via CreateTableFromSheetAction
            $tableResult = $this->createTableAction->execute(
                $app,
                $spreadsheetId,
                $tableName,
                $sheetName,
                $data['columns'],
                $keyColumn
            );

            return [
                'app' => $app,
                'table' => $tableResult['table'],
                'view' => $tableResult['view'],
            ];
        });
    }
}
