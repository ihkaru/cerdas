<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Table;

$table = Table::where('slug', 'rtlh-form')->first();
if (!$table) {
    echo "Table not found\n";
    exit;
}

$version = $table->latestPublishedVersion();
if (!$version) {
    echo "No published version found\n";
    // Check for draft
    $version = $table->versions()->orderByDesc('version')->first();
    echo "Using latest version (Draft?): " . ($version->published_at ? 'Yes' : 'No') . "\n";
}

echo "Field details for table: " . $table->name . "\n";
foreach ($version->fields as $field) {
    echo sprintf("- %s (%s): %s\n", $field['name'], $field['type'], $field['label']);
}
