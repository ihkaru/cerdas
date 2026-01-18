<?php
// public/debug_schema.php

use App\Models\AppSchema;
use Illuminate\Contracts\Console\Kernel;

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

header('Content-Type: application/json');

$slug = 'perf-schema-100';
$schema = AppSchema::where('slug', $slug)->with('latestPublishedVersion')->first();

if (!$schema) {
    echo json_encode(['error' => 'Schema not found']);
    exit;
}

$version = $schema->latestPublishedVersion;
$rawSchema = $version->getAttributes()['schema']; // Get raw DB value
$castedSchema = $version->schema; // Get casted value

echo json_encode([
    'id' => $schema->id,
    'slug' => $schema->slug,
    'raw_schema_type' => gettype($rawSchema),
    'casted_schema_type' => gettype($castedSchema),
    'casted_schema' => $castedSchema,
    'raw_schema_preview' => substr($rawSchema, 0, 100) . '...',
]);
