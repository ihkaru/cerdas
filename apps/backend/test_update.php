<?php

$json = file_get_contents('/var/www/html/docs/kuesioner_sambora_app_schema.json');
$data = json_decode($json, true);

$app = App\Models\App::find('83231473-77ca-419f-88a3-0f22fd68eabd');

if (! $app) {
    echo "ERROR: App not found!\n";
    exit(1);
}

try {
    DB::beginTransaction();

    // Update App metadata
    $app->update([
        'name' => $data['app']['name'],
        'slug' => $data['app']['slug'],
        'description' => $data['app']['description'] ?? null,
        'mode' => $data['app']['mode'] ?? 'simple',
        'navigation' => $data['navigation'] ?? [],
    ]);

    // Track existing tables for deletion
    $existingTableSlugs = $app->tables->pluck('slug')->toArray();
    $newTableSlugs = array_keys($data['tables']);

    // Update/Create tables
    foreach ($data['tables'] as $slug => $tableData) {
        $table = $app->tables()->where('slug', $slug)->first();

        if ($table) {
            $table->update([
                'name' => $tableData['name'],
                'description' => $tableData['description'] ?? null,
                'source_type' => $tableData['source_type'] ?? 'internal',
                'source_config' => $tableData['source_config'] ?? [],
            ]);
        } else {
            $table = $app->tables()->create([
                'slug' => $slug,
                'name' => $tableData['name'],
                'description' => $tableData['description'] ?? null,
                'source_type' => $tableData['source_type'] ?? 'internal',
                'source_config' => $tableData['source_config'] ?? [],
            ]);
        }

        $version = $table->latestDraftVersion ?? $table->createDraftVersion();
        $version->update([
            'fields' => $tableData['fields'] ?? [],
            'layout' => [
                'type' => 'standard',
                'settings' => $tableData['settings'] ?? [],
                'views' => ($version && is_array($version->layout) && isset($version->layout['views'])) ? $version->layout['views'] : [],
            ],
        ]);
    }

    // Delete removed tables
    $tablesToDelete = array_diff($existingTableSlugs, $newTableSlugs);
    $app->tables()->whereIn('slug', $tablesToDelete)->delete();

    $app->load('tables');

    $existingViewNames = $app->views->pluck('name')->toArray();
    $newViewNames = array_keys($data['views'] ?? []);

    foreach ($data['views'] ?? [] as $viewKey => $viewData) {
        $table = $app->tables->firstWhere('slug', $viewData['table']);
        if (! $table) {
            echo "Table not found for view {$viewKey}: {$viewData['table']}\n";

            continue;
        }

        $view = $app->views()->where('name', $viewKey)->first();

        $viewPayload = [
            'table_id' => $table->id,
            'name' => $viewData['name'] ?? $viewKey,
            'type' => $viewData['type'] ?? 'deck',
            'description' => $viewData['description'] ?? null,
            'config' => $viewData['config'] ?? [],
        ];

        if ($view) {
            $view->update($viewPayload);
        } else {
            $app->views()->create($viewPayload);
        }
    }

    $viewsToDelete = array_diff($existingViewNames, $newViewNames);
    $app->views()->whereIn('name', $viewsToDelete)->delete();

    $viewConfigs = [];
    foreach ($data['views'] ?? [] as $viewKey => $viewData) {
        $table = $app->tables->firstWhere('slug', $viewData['table']);
        $viewConfigs[$viewKey] = array_merge($viewData, [
            'table_id' => $table ? $table->id : null,
        ]);
    }
    $app->update(['view_configs' => $viewConfigs]);

    DB::commit();
    echo "SUCCESS!\n";
} catch (\Throwable $e) {
    DB::rollBack();
    echo 'ERROR: '.$e->getMessage()."\n".$e->getTraceAsString()."\n";
}
