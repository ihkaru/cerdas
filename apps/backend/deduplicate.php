<?php

ini_set('memory_limit', '512M');
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$tableVersionId = 'd17fec6c-43df-4317-8f29-8e5a86ed64f6';

echo "Fetching assignments in chunks...\n";

$seen = [];
$deleteIds = [];

DB::table('assignments')
    ->where('table_version_id', $tableVersionId)
    ->orderBy('id', 'asc')
    ->chunk(5000, function ($assignments) use (&$seen, &$deleteIds) {
        foreach ($assignments as $a) {
            $key = clone $a;
            unset($key->id, $key->status, $key->synced_at, $key->created_at, $key->updated_at, $key->external_id);
            $hash = md5(json_encode((array) $key)); // Hash everything except metadata

            // Try explicit fields first to be safer
            $extKey = $a->external_id;
            if (!$extKey) {
                // Try to extract idsbr
                preg_match('/"idsbr"\s*:\s*"?(\w+)"?/', $a->prelist_data, $matches);
                if (isset($matches[1])) {
                    $extKey = 'idsbr-'.$matches[1];
                }
            }

            $finalKey = $extKey ?: $hash;

            if (isset($seen[$finalKey])) {
                $deleteIds[] = $a->id;
            } else {
                $seen[$finalKey] = true;
            }
        }
        echo 'Processed chunk. Delete collected so far: '.count($deleteIds)."\n";
    });

echo 'Total to delete: '.count($deleteIds)."\n";

$chunks = array_chunk($deleteIds, 1000);
foreach ($chunks as $chunk) {
    DB::table('assignments')->whereIn('id', $chunk)->delete();
    echo 'Deleted chunk of '.count($chunk)."\n";
}

echo 'Done. Total deleted: '.count($deleteIds)."\n";
