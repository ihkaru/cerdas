<?php

use App\Http\Controllers\Api\NotificationController;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "Bootstrapped Laravel.\n";

// 1. Create User
$user = User::factory()->create();
echo "Created User: {$user->email}\n";

// 2. Create Organization
$org = Organization::create([
    'name' => 'Notification Test Org',
    'code' => 'NOTIF-'.uniqid(),
    'creator_id' => $user->id,
]);
echo "Created Org: {$org->name}\n";

// 3. Trigger Notification manually
$user->notify(new \App\Notifications\OrganizationInviteNotification($org->name, 'Tester'));
echo "Notification sent.\n";

// 4. Verify Database
$count = $user->notifications()->count();
echo "Notification count in DB: {$count}\n";

if ($count !== 1) {
    echo "ERROR: Notification not found in DB.\n";
    exit(1);
}

// 5. Verify API Controller
$controller = new NotificationController;
$request = Request::create('/api/notifications', 'GET');
$request->setUserResolver(fn () => $user);

$response = $controller->index($request);
$data = $response->getData(true);

echo 'API Response Count: '.count($data['data'])."\n";
echo 'API Unread Count: '.$data['unread_count']."\n";

if ($data['unread_count'] !== 1) {
    echo "ERROR: API unread count mismatch.\n";
    exit(1);
}

// 6. Mark as Read
$notifId = $data['data'][0]['id'];
$requestRead = Request::create("/api/notifications/{$notifId}/read", 'POST');
$requestRead->setUserResolver(fn () => $user);

$responseRead = $controller->markAsRead($requestRead, $notifId);
$dataRead = $responseRead->getData(true);

echo 'Mark Read Response: '.$dataRead['message']."\n";
echo 'New Unread Count: '.$dataRead['unread_count']."\n";

if ($dataRead['unread_count'] !== 0) {
    echo "ERROR: Mark as read failed.\n";
    exit(1);
}

// Cleanup
$user->notifications()->delete();
$org->delete();
$user->delete();
echo "Cleanup done.\n";
