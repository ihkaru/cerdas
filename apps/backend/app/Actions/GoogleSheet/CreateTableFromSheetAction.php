<?php

namespace App\Actions\GoogleSheet;

use App\Models\App;
use App\Models\Table;
use App\Models\View;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * CreateTableFromSheetAction
 *
 * Encapsulates the transactional creation of a Table, its initial Version,
 * and default View pre-configured with Google Sheet 2-Way Sync.
 */
class CreateTableFromSheetAction
{
    public function __construct(
        private readonly ImportGoogleSheetRowsAction $importRowsAction
    ) {}

    /**
     * Execute the action.
     *
     * @param  App  $app  The parent App
     * @param  string  $spreadsheetId  Google Spreadsheet ID
     * @param  string  $tableName  Desired name of the Table
     * @param  string  $sheetName  Name of the sheet/tab
     * @param  array<int, array{name: string, type?: string, label?: string, original_header?: string, options?: array}>  $columns  Inferred column definitions
     * @param  string  $keyColumn  Name of the primary key field
     * @return array{table: Table, view: View, rows_imported: int}
     */
    public function execute(
        App $app,
        string $spreadsheetId,
        string $tableName,
        string $sheetName,
        array $columns,
        string $keyColumn = '_cerdas_id'
    ): array {
        $result = DB::transaction(function () use ($app, $spreadsheetId, $tableName, $sheetName, $columns, $keyColumn) {
            $spreadsheetUrl = "https://docs.google.com/spreadsheets/d/{$spreadsheetId}/edit";

            // 1. Generate unique slug for Table
            $baseSlug = Str::slug($tableName);
            $slug = $baseSlug ?: 'table';
            $count = 1;
            while (Table::withTrashed()->where('app_id', $app->id)->where('slug', $slug)->exists()) {
                $slug = "{$baseSlug}-{$count}";
                $count++;
            }

            // 2. Format schema fields definition
            $schema = [];
            foreach ($columns as $col) {
                $fieldDef = [
                    'name' => $col['name'],
                    'type' => $col['type'] ?? 'text',
                    'label' => $col['label'] ?? $col['original_header'] ?? $col['name'],
                ];
                if (! empty($col['options']) && in_array($col['type'], ['select', 'radio', 'checkbox'], true)) {
                    $fieldDef['options'] = $col['options'];
                }
                $schema[] = $fieldDef;
            }

            // 3. Create Table
            $table = Table::create([
                'id' => Str::uuid()->toString(),
                'app_id' => $app->id,
                'name' => $tableName.($count > 1 ? " ({$count})" : ''),
                'slug' => $slug,
                'source_type' => 'google_sheets',
                'source_config' => [
                    'google_sheet' => [
                        'spreadsheet_id' => $spreadsheetId,
                        'spreadsheet_url' => $spreadsheetUrl,
                        'sheet_name' => $sheetName,
                        'tabs' => [
                            [
                                'sheet_name' => $sheetName,
                                'sheet_gid' => 0,
                                'type' => 'root',
                                'field_key' => null,
                            ],
                        ],
                        'sync_enabled' => true,
                        'inbound_sync_enabled' => true,
                        'sync_mode' => 'direct_columns',
                        'columns' => array_map(fn ($c) => $c['name'], $columns),
                        'key_column' => $keyColumn,
                        'connected_at' => now()->toISOString(),
                    ],
                ],
            ]);

            // 4. Create Initial Table Version
            $table->versions()->create([
                'id' => Str::uuid()->toString(),
                'version' => 1,
                'fields' => $schema,
                'layout' => null,
                'published_at' => now(),
            ]);

            // 5. Create Default View (Table View)
            $view = View::create([
                'id' => Str::uuid()->toString(),
                'app_id' => $app->id,
                'table_id' => $table->id,
                'name' => $tableName.' View',
                'type' => 'table',
                'description' => 'Default data view for '.$tableName,
                'config' => [
                    'title_column' => $schema[0]['name'] ?? null,
                ],
            ]);

            return [
                'table' => $table,
                'view' => $view,
            ];
        });

        // Pull initial rows into AppRecords & Assignments
        $rowsImported = 0;
        try {
            $rowsImported = $this->importRowsAction->execute(
                $app,
                $result['table'],
                $spreadsheetId,
                $sheetName,
                $columns
            );
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning('CreateTableFromSheetAction: initial row pull warning', [
                'table_id' => $result['table']->id,
                'error' => $e->getMessage(),
            ]);
        }

        return [
            'table' => $result['table'],
            'view' => $result['view'],
            'rows_imported' => $rowsImported,
        ];
    }
}
