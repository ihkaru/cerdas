<?php

namespace App\Actions\GoogleSheet;

use App\Models\App;
use App\Models\Table;
use App\Models\View;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * BatchCreateTablesFromSheetAction
 *
 * Encapsulates the transactional creation of multiple Tables, initial Versions,
 * and default Views from multiple selected Google Spreadsheet tabs.
 *
 * Adheres to Interface-First, Hexagonal Architecture, and Single Responsibility Principle (SRP).
 */
class BatchCreateTablesFromSheetAction
{
    public function __construct(
        private readonly ImportGoogleSheetRowsAction $importRowsAction
    ) {}

    /**
     * Execute batch creation of multiple Tables from multiple sheet tabs.
     *
     * @param  App  $app  The parent App
     * @param  string  $spreadsheetId  Google Spreadsheet ID
     * @param  array<int, array{
     *     sheet_name: string,
     *     table_name: string,
     *     columns: array<int, array{name: string, type?: string, label?: string, original_header?: string, options?: array}>,
     *     key_column?: string|null
     * }>  $tabConfigs
     * @return array{
     *     tables: array<int, Table>,
     *     views: array<int, View>,
     *     results: array<int, array{table_id: string, table_name: string, sheet_name: string, view_id: string, rows_imported: int}>
     * }
     */
    public function execute(App $app, string $spreadsheetId, array $tabConfigs): array
    {
        $spreadsheetUrl = "https://docs.google.com/spreadsheets/d/{$spreadsheetId}/edit";

        $createdEntries = DB::transaction(function () use ($app, $spreadsheetId, $spreadsheetUrl, $tabConfigs) {
            $entries = [];

            foreach ($tabConfigs as $tabConfig) {
                $sheetName = trim((string) ($tabConfig['sheet_name'] ?? 'Sheet1'));
                $tableName = trim((string) ($tabConfig['table_name'] ?? $sheetName));
                $columns = $tabConfig['columns'] ?? [];
                $keyColumn = (string) ($tabConfig['key_column'] ?? '_cerdas_id');

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

                $entries[] = [
                    'table' => $table,
                    'view' => $view,
                    'sheet_name' => $sheetName,
                    'columns' => $columns,
                ];
            }

            return $entries;
        });

        // Pull initial rows for all tables (outside transaction to avoid long locks)
        $tables = [];
        $views = [];
        $results = [];

        foreach ($createdEntries as $entry) {
            /** @var Table $table */
            $table = $entry['table'];
            /** @var View $view */
            $view = $entry['view'];
            $sheetName = $entry['sheet_name'];
            $columns = $entry['columns'];

            $rowsImported = 0;
            try {
                $rowsImported = $this->importRowsAction->execute(
                    $app,
                    $table,
                    $spreadsheetId,
                    $sheetName,
                    $columns
                );
            } catch (\Exception $e) {
                Log::warning('BatchCreateTablesFromSheetAction: row pull warning for table '.$table->name, [
                    'table_id' => $table->id,
                    'error' => $e->getMessage(),
                ]);
            }

            $tables[] = $table;
            $views[] = $view;
            $results[] = [
                'table_id' => $table->id,
                'table_name' => $table->name,
                'sheet_name' => $sheetName,
                'view_id' => $view->id,
                'rows_imported' => $rowsImported,
            ];
        }

        return [
            'tables' => $tables,
            'views' => $views,
            'results' => $results,
        ];
    }
}
