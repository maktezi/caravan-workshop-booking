<?php

use App\Models\Booking;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

it('serializes simultaneous SQLite booking requests', function (string $scenario) {
    $directory = sys_get_temp_dir().'/workshop-sqlite-'.bin2hex(random_bytes(8));
    mkdir($directory, 0700);
    $database = $directory.'/bookings.sqlite';
    touch($database);
    $originalDefault = config('database.default');
    $originalSqlite = config('database.connections.sqlite');
    $configuration = array_replace($originalSqlite, ['database' => $database, 'url' => null]);
    $processes = [];
    $streams = [];
    try {
        config(['database.default' => 'sqlite', 'database.connections.sqlite' => $configuration]);
        DB::purge('sqlite');
        Artisan::call('migrate', ['--force' => true]);
        $payload = [
            'customer_name' => 'Concurrent customer', 'customer_email' => 'race@example.com',
            'rego' => 'RACE', 'service_bay' => 'Bay 1', 'status' => 'confirmed',
            'starts_at' => '2030-11-03T00:00:00Z', 'ends_at' => '2030-11-03T01:00:00Z',
        ];
        $requests = [];
        foreach ([0, 1] as $index) {
            $updating = $scenario === 'update/update' || ($scenario === 'create/update' && $index === 1);
            if ($updating) {
                $booking = Booking::query()->create(array_replace($payload, ['status' => 'cancelled']));
                $requests[] = ['method' => 'PATCH', 'path' => '/api/bookings/'.$booking->id, 'data' => ['status' => 'confirmed']];
            } else {
                $requests[] = ['method' => 'POST', 'path' => '/api/bookings', 'data' => $payload];
            }
        }
        $configFile = $directory.'/connection.json';
        file_put_contents($configFile, json_encode($configuration, JSON_THROW_ON_ERROR));
        DB::beginTransaction();
        foreach ($requests as $index => $request) {
            $process = proc_open([
                PHP_BINARY, base_path('tests/Support/sqlite-booking-request.php'),
                $configFile, $directory.'/ready-'.$index, json_encode($request, JSON_THROW_ON_ERROR),
            ], [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes, base_path());
            if (! is_resource($process)) {
                throw new RuntimeException('Unable to start SQLite worker.');
            }
            fclose($pipes[0]);
            stream_set_blocking($pipes[1], false);
            stream_set_blocking($pipes[2], false);
            $processes[] = $process;
            $streams[] = $pipes;
        }
        $deadline = microtime(true) + 4;
        while (! file_exists($directory.'/ready-0') || ! file_exists($directory.'/ready-1')) {
            if (microtime(true) > $deadline) {
                throw new RuntimeException('Workers did not reach their transactions.');
            }
            usleep(10000);
        }
        usleep(200000);
        foreach ($processes as $process) {
            expect(proc_get_status($process)['running'])->toBeTrue();
        }
        DB::commit();
        $deadline = microtime(true) + 10;
        do {
            $running = false;
            foreach ($processes as $process) {
                $running = proc_get_status($process)['running'] || $running;
            }
            if ($running) {
                usleep(10000);
            }
        } while ($running && microtime(true) < $deadline);
        expect($running)->toBeFalse('Both requests must finish after releasing the writer.');
        $statuses = [];
        foreach ($streams as $pipes) {
            expect(stream_get_contents($pipes[2]))->toBe('');
            $result = json_decode(stream_get_contents($pipes[1]), true, flags: JSON_THROW_ON_ERROR);
            $statuses[] = $result['status'];
            if ($result['status'] === 422) {
                expect($result['body']['errors'])->toHaveKey('service_bay');
            }
        }
        sort($statuses);
        expect($statuses[0])->toBeIn([200, 201]);
        expect($statuses[1])->toBe(422);
        expect(Booking::query()->whereIn('status', ['pending', 'confirmed'])->count())->toBe(1);
    } finally {
        if (DB::transactionLevel()) {
            DB::rollBack();
        }
        foreach ($processes as $process) {
            if (proc_get_status($process)['running']) {
                proc_terminate($process);
            }
            proc_close($process);
        }
        foreach ($streams as $pipes) {
            if (is_resource($pipes[1])) {
                fclose($pipes[1]);
            }
            if (is_resource($pipes[2])) {
                fclose($pipes[2]);
            }
        }
        DB::disconnect('sqlite');
        config(['database.default' => $originalDefault, 'database.connections.sqlite' => $originalSqlite]);
        DB::purge('sqlite');
        foreach (glob($directory.'/*') as $file) {
            unlink($file);
        }
        rmdir($directory);
    }
})->with(['create/create', 'create/update', 'update/update']);
