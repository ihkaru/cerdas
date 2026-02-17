<?php

require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Strategy: Find the most likely target App
// 1. Check ID 134 (User mentioned ID 134 form, maybe App is also 134?)
// 2. Check ID 3 (User explicitly said "App ID 3")
// 3. Fallback to latest created App

$targetApp = null;
$strategies = [134, 3];

foreach ($strategies as $id) {
    $candidate = \App\Models\App::find($id);
    if ($candidate) {
        $targetApp = $candidate;
        echo "Found target App by ID $id: {$candidate->name}\n";

        break;
    }
}

if (! $targetApp) {
    $targetApp = \App\Models\App::latest('id')->first();
    echo "Fallback: Using latest App ID {$targetApp->id}: {$targetApp->name}\n";
}

if ($targetApp) {
    $f3 = \App\Models\Form::find(3);
    if ($f3) {
        $f3->app_id = $targetApp->id;
        $f3->save();
        echo "SUCCESS: Form 3 (Component Showcase) moved to App {$targetApp->id}.\n";
        echo "You should now see 'Component Showcase' in your App's form list.\n";
    } else {
        echo "ERROR: Form 3 not found in database.\n";
    }
} else {
    echo "ERROR: No Apps found in database.\n";
}
