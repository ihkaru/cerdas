<?php

use App\Models\AppSchemaVersion;
use Illuminate\Contracts\Console\Kernel;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

echo "Fixing Double Encoded Schemas...\n";

$versions = AppSchemaVersion::all();

foreach ($versions as $v) {
    $schema = $v->schema;

    // Check if schema is a string (Double Encoded)
    if (is_string($schema)) {
        echo "Fixing ID {$v->id} ... ";
        // Laravel's cast already decoded once, so if it's still string, it was double encoded.
        // We decode it to get the array.
        $decoded = json_decode($schema, true);

        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            // It was indeed a valid JSON string inside.
            // We save it back as the array. Laravel will handle single encoding.
            $v->schema = $decoded;
            $v->save();
            echo "FIXED (Decoded)\n";
        } else {
            echo "SKIPPED (Not valid JSON or not double encoded)\n";
        }
    } else {
        // It's already an array/object.
        // Check if it's triple encoded?
        // No, if it's array, it's good.
        echo "ID {$v->id} is OK (".gettype($schema).")\n";
    }
}

echo "Done.\n";
