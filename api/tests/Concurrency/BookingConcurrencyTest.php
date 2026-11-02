<?php

use App\Models\Booking;
use App\Models\ServiceBay;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

pest()->extend(TestCase::class);

it('serializes competing creates through the same MySQL bay lock', function () {
    if (DB::getDriverName() !== 'mysql' || ! str_ends_with(DB::connection()->getDatabaseName(), '_test')) {
        throw new RuntimeException('Use a dedicated MySQL database whose name ends in _test.');
    }
    Artisan::call('migrate:fresh', ['--force' => true]);
    $directory = sys_get_temp_dir().'/caravan-race-'.bin2hex(random_bytes(8));
    mkdir($directory, 0700);
    $configuration = $directory.'/database.json';
    file_put_contents($configuration, json_encode(config('database.connections.mysql'), JSON_THROW_ON_ERROR));
    chmod($configuration, 0600);
    $processes = [];
    $streams = [];
    DB::beginTransaction();
    try {
        ServiceBay::query()->where('name', 'Bay 1')->lockForUpdate()->firstOrFail();
        for ($i = 0; $i < 2; $i++) {
            $process = proc_open(
                [PHP_BINARY, base_path('tests/Support/competing-booking.php'), $configuration, $directory.'/ready-'.$i],
                [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']],
                $pipes,
                base_path(),
            );
            if (! is_resource($process)) {
                throw new RuntimeException('Unable to start booking worker.');
            }
            fclose($pipes[0]);
            stream_set_blocking($pipes[1], false);
            stream_set_blocking($pipes[2], false);
            $processes[] = $process;
            $streams[] = $pipes;
        }
        $deadline = microtime(true) + 10;
        while (! file_exists($directory.'/ready-0') || ! file_exists($directory.'/ready-1')) {
            if (microtime(true) > $deadline) {
                throw new RuntimeException('Workers failed to reach the shared lock.');
            }
            usleep(10000);
        }
        // Both independent connections remain blocked by the parent-held bay lock.
        usleep(300000);
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
        expect($running)->toBeFalse('Workers must finish after releasing the bay lock.');
        $results = [];
        foreach ($streams as $pipes) {
            expect(stream_get_contents($pipes[2]))->toBe('');
            $results[] = stream_get_contents($pipes[1]);
        }
        sort($results);
        expect($results)->toBe(['conflict', 'created']);
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
            fclose($pipes[1]);
            fclose($pipes[2]);
        }
        foreach (glob($directory.'/*') as $file) {
            unlink($file);
        }
        rmdir($directory);
    }
});
