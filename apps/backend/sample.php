<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$tableVersionId = 'd17fec6c-43df-4317-8f29-8e5a86ed64f6';
$sample = DB::table('assignments')
    ->where('table_version_id', $tableVersionId)
    ->first();

echo json_encode(json_decode($sample->prelist_data), JSON_PRETTY_PRINT)."\n";
