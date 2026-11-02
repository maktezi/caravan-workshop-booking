<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Services\BookingService;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        if (Booking::query()->exists()) {
            return;
        }
        $start = CarbonImmutable::now('Australia/Melbourne')->addDay()->startOfDay()->addHours(9);
        for ($i = 0; $i < 24; $i++) {
            $time = $start->addDays(intdiv($i, 4));
            app(BookingService::class)->save([
                'customer_name' => fake()->name(),
                'customer_email' => fake()->safeEmail(),
                'rego' => sprintf('VIC-%03d', $i + 1),
                'service_bay' => 'Bay '.(($i % 4) + 1),
                'starts_at' => $time->toIso8601String(),
                'ends_at' => $time->addHour()->toIso8601String(),
                'status' => ['pending', 'confirmed', 'cancelled'][$i % 3],
                'notes' => 'Sample workshop appointment.',
            ]);
        }
    }
}
