<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$apps = \App\Models\App::all();
echo "--- AVAILABLE APPS ---\n";
foreach ($apps as $a) {
    echo "ID: {$a->id} | Name: {$a->name} | Slug: {$a->slug}\n";
}

echo "\n--- FORM 3 INFO ---\n";
$f3 = \App\Models\Form::find(3);
if ($f3) {
    echo "Form 3 currently in App ID: {$f3->app_id}\n";
} else {
    echo "Form 3 NOT FOUND\n";
}
