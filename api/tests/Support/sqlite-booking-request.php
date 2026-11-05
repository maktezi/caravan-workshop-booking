<?php

use Illuminate\Contracts\Http\Kernel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();
$configuration = json_decode(file_get_contents($argv[1]), true, flags: JSON_THROW_ON_ERROR);
config(['database.default' => 'sqlite', 'database.connections.sqlite' => $configuration]);
DB::purge('sqlite');
DB::connection()->getPdo();
$input = json_decode($argv[3], true, flags: JSON_THROW_ON_ERROR);
// Signal immediately before BEGIN, while the parent still holds SQLite's writer.
DB::connection()->beforeStartingTransaction(function () use ($argv): void {
    file_put_contents($argv[2], 'ready');
});
$request = Request::create($input['path'], $input['method'], server: [
    'CONTENT_TYPE' => 'application/json', 'HTTP_ACCEPT' => 'application/json',
], content: json_encode($input['data'], JSON_THROW_ON_ERROR));
$response = $kernel->handle($request);
echo json_encode(['status' => $response->getStatusCode(), 'body' => json_decode($response->getContent(), true)], JSON_THROW_ON_ERROR);
$kernel->terminate($request, $response);
