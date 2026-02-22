<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$tableVersionId = 'd17fec6c-43df-4317-8f29-8e5a86ed64f6';

echo "Finding IDs to keep...\n";
$keepIds = DB::table('assignments')
    ->selectRaw('MIN(id) as min_id')
    ->where('table_version_id', $tableVersionId)
    ->groupByRaw('MD5(prelist_data)')
    ->pluck('min_id');

echo 'Keeping '.count($keepIds)." unique records.\n";

$chunks = array_chunk($keepIds->toArray(), 1000);
$deletedTotal = 0;

$allIds = DB::table('assignments')->where('table_version_id', $tableVersionId)->pluck('id')->toArray();
$deleteIds = array_diff($allIds, $keepIds->toArray());

echo 'Deleting '.count($deleteIds)." duplicate records...\n";

foreach (array_chunk($deleteIds, 1000) as $chunk) {
    $deletedTotal += DB::table('assignments')->whereIn('id', $chunk)->delete();
}

echo "Successfully deleted $deletedTotal duplicate assignments.\n";
