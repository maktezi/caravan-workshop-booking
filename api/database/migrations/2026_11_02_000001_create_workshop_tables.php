<?php

use App\Models\ServiceBay;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_bays', function (Blueprint $table): void {
            $table->id();
            $table->string('name', 20)->unique();
        });
        // Stable lock rows must exist even when sample data has not been seeded.
        DB::table('service_bays')->insert(array_map(fn (string $name): array => ['name' => $name], ServiceBay::NAMES));
        Schema::create('bookings', function (Blueprint $table): void {
            $table->id();
            $table->string('customer_name');
            $table->string('customer_email');
            $table->string('rego', 50);
            $table->string('service_bay', 20);
            $table->dateTime('starts_at');
            $table->dateTime('ends_at');
            $table->string('status', 20)->default('pending');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->foreign('service_bay')->references('name')->on('service_bays');
            $table->index(['service_bay', 'status', 'starts_at', 'ends_at'], 'booking_availability');
            $table->index(['status', 'starts_at', 'id']);
            $table->index(['starts_at', 'id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
        Schema::dropIfExists('service_bays');
    }
};
