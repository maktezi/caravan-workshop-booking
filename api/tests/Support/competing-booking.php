<?php

use App\Services\BookingService;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
$config = json_decode(file_get_contents($argv[1]), true, flags: JSON_THROW_ON_ERROR);
config(['database.default' => 'mysql', 'database.connections.mysql' => $config]);
DB::purge('mysql');
DB::connection()->getPdo();
file_put_contents($argv[2], 'ready');
try {
    app(BookingService::class)->save([
        'customer_name' => 'Concurrent request', 'customer_email' => 'test@example.com',
        'rego' => 'RACE', 'service_bay' => 'Bay 1',
        'starts_at' => '2026-11-03T00:00:00Z', 'ends_at' => '2026-11-03T01:00:00Z',
    ]);
    echo 'created';
} catch (ValidationException $exception) {
    if (! isset($exception->errors()['service_bay'])) {
        throw $exception;
    }
    echo 'conflict';
}
