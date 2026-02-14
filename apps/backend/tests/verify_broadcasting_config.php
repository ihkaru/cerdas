<?php

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "Checking Broadcasting Config...\n";

// 1. Check ENV
$connection = config('broadcasting.default');
echo "Default Connection: {$connection}\n";

if ($connection !== 'reverb') {
    echo "WARNING: Default connection is not reverb.\n";
}

// 2. Check Reverb Config
$reverb = config('broadcasting.connections.reverb');
echo 'Reverb Host: '.$reverb['options']['host']."\n";
echo 'Reverb Port: '.$reverb['options']['port']."\n";

if (empty($reverb['app_id']) || empty($reverb['key']) || empty($reverb['secret'])) {
    echo "ERROR: Reverb credentials missing.\n";
    exit(1);
}

// 3. Check Notification Class
$notification = new \App\Notifications\OrganizationInviteNotification('Org', 'Inviter');
if (! $notification instanceof \Illuminate\Contracts\Broadcasting\ShouldBroadcast) {
    echo "ERROR: OrganizationInviteNotification does not implement ShouldBroadcast.\n";
    exit(1);
}

$broadcastData = $notification->toBroadcast(new \App\Models\User);
echo 'Broadcast Data Title: '.$broadcastData->data['title']."\n";

echo "Broadcasting Config Verified.\n";
