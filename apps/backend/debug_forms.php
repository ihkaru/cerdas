<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "User 3 Name: " . \App\Models\User::find(3)->name . "\n";
echo "User 3 Apps count: " . \App\Models\User::find(3)->apps()->count() . "\n";
echo "User 3 Forms count via Apps: " . \App\Models\Form::whereIn('app_id', \App\Models\User::find(3)->apps()->pluck('apps.id'))->count() . "\n";
echo "Apps JSON: " . \App\Models\User::find(3)->apps->toJson() . "\n";

echo "\n--- All Forms ---\n";
\App\Models\Form::all()->each(function ($f) {
    echo "ID: {$f->id} | Name: {$f->name} | App ID: {$f->app_id}\n";
});
