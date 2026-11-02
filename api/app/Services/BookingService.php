<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\ServiceBay;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class BookingService
{
    public function save(array $attributes, ?Booking $booking = null): Booking
    {
        return DB::transaction(function () use ($attributes, $booking): Booking {
            // Lock the booking first so partial updates merge against its latest values.
            $current = $booking ? Booking::query()->lockForUpdate()->findOrFail($booking->id) : new Booking;
            $data = array_merge($current->only($current->getFillable()), $attributes);
            $data['status'] ??= 'pending';
            $start = CarbonImmutable::parse($data['starts_at'])->utc();
            $end = CarbonImmutable::parse($data['ends_at'])->utc();
            if ($end->lessThanOrEqualTo($start)) {
                throw ValidationException::withMessages(['ends_at' => 'The end time must be later than the start time.']);
            }
            // Destination locks serialize even competing creates into a previously empty bay.
            ServiceBay::query()->where('name', $data['service_bay'])->lockForUpdate()->firstOrFail();
            if ($data['status'] !== 'cancelled') {
                // A locking read sees committed changes after waiting under MySQL REPEATABLE READ.
                $conflict = Booking::query()->where('service_bay', $data['service_bay'])
                    ->whereIn('status', ['pending', 'confirmed'])
                    ->when($current->exists, fn ($query) => $query->whereKeyNot($current->id))
                    ->where('starts_at', '<', $end)->where('ends_at', '>', $start)
                    ->lockForUpdate()->first();
                if ($conflict) {
                    throw ValidationException::withMessages(['service_bay' => 'This bay already has a booking during the selected time.']);
                }
            }
            $data['starts_at'] = $start;
            $data['ends_at'] = $end;
            $current->fill($data)->save();

            return $current;
        }, attempts: 5);
    }

    public function delete(Booking $booking): void
    {
        DB::transaction(function () use ($booking): void {
            $current = Booking::query()->lockForUpdate()->findOrFail($booking->id);
            ServiceBay::query()->where('name', $current->service_bay)->lockForUpdate()->firstOrFail();
            $current->delete();
        }, attempts: 5);
    }
}
