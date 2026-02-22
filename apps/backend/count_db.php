<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$sbr = \App\Models\Table::find('aed967b7-3ad4-4861-9107-254745be048f');
echo "Table: {$sbr->name}\n";
$versions = \App\Models\TableVersion::where('table_id', $sbr->id)->get();
foreach ($versions as $v) {
    $count = \App\Models\Assignment::where('table_version_id', $v->id)->count();
    echo "Version: {$v->version} (ID: {$v->id}), Assignments: {$count}\n";
}

// Check for duplicated prelist_data in general
$totalWithSameName = DB::table('assignments')
    ->whereIn('table_version_id', $versions->pluck('id'))
    ->selectRaw("JSON_UNQUOTE(JSON_EXTRACT(prelist_data, '$.name')) as p_name, COUNT(*) as cnt")
    ->groupBy('p_name')
    ->having('cnt', '>', 1)
    ->limit(5)
    ->get();
echo "Sample duplicated names across versions:\n";
print_r($totalWithSameName->pluck('cnt', 'p_name')->toArray());
