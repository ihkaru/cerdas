<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$tableVersionId = 'd17fec6c-43df-4317-8f29-8e5a86ed64f6';

$total = DB::table('assignments')->where('table_version_id', $tableVersionId)->count();
$uniqueIdsbr = DB::table('assignments')
    ->where('table_version_id', $tableVersionId)
    ->selectRaw("COUNT(DISTINCT JSON_UNQUOTE(JSON_EXTRACT(prelist_data, '$.idsbr'))) as uniq")
    ->first()->uniq;

echo "Total records: $total\n";
echo "Unique idsbr: $uniqueIdsbr\n";

$uniqueMD5 = DB::table('assignments')
    ->where('table_version_id', $tableVersionId)
    ->selectRaw('COUNT(DISTINCT MD5(prelist_data)) as uniq')
    ->first()->uniq;

echo "Unique exact matches (MD5): $uniqueMD5\n";

// Show first 5 duplicate idsbr
$dupIdsbr = DB::table('assignments')
    ->where('table_version_id', $tableVersionId)
    ->selectRaw("JSON_UNQUOTE(JSON_EXTRACT(prelist_data, '$.idsbr')) as idsbr, count(*) as c")
    ->groupBy(DB::raw("JSON_UNQUOTE(JSON_EXTRACT(prelist_data, '$.idsbr'))"))
    ->havingRaw('count(*) > 1')
    ->limit(5)
    ->get();

echo "Duplicate idsbr samples:\n";
print_r($dupIdsbr->toArray());
