<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

$admin = \App\Models\AdminAccount::first();

$request = \Illuminate\Http\Request::create('/api/v1/pos-notifications', 'GET');
$request->setUserResolver(function() use ($admin) { return $admin; });

$response = $kernel->handle($request);
echo "Status: " . $response->getStatusCode() . "\n";
echo "Content: " . $response->getContent() . "\n";
