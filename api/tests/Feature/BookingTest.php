<?php

use App\Models\Booking;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function workshopBooking(array $overrides = []): array
{
    return array_replace([
        'customer_name' => 'Alex Smith',
        'customer_email' => 'alex@example.com',
        'rego' => 'VIC-123',
        'service_bay' => 'Bay 1',
        'starts_at' => '2026-11-03T09:00:00+11:00',
        'ends_at' => '2026-11-03T10:00:00+11:00',
        'status' => 'pending',
        'notes' => null,
    ], $overrides);
}

it('creates a booking and normalizes offset timestamps to UTC', function () {
    $this->postJson('/api/bookings', workshopBooking())->assertCreated()
        ->assertJsonPath('data.starts_at', '2026-11-02T22:00:00+00:00');
    $this->assertDatabaseHas('bookings', ['rego' => 'VIC-123', 'starts_at' => '2026-11-02 22:00:00']);
});

it('defaults new bookings to pending', function () {
    $data = workshopBooking();
    unset($data['status']);
    $this->postJson('/api/bookings', $data)->assertCreated()->assertJsonPath('data.status', 'pending');
});

it('validates required fields and allowed values', function (string $field, mixed $value) {
    $this->postJson('/api/bookings', workshopBooking([$field => $value]))
        ->assertUnprocessable()->assertJsonValidationErrors($field);
})->with([
    ['customer_name', ''], ['customer_email', 'invalid'], ['rego', ''],
    ['service_bay', 'Bay 5'], ['status', 'draft'],
    ['starts_at', '2026-11-03T09:00:00'], ['ends_at', 'invalid'],
]);

it('rejects end times at or before the start', function (string $end) {
    $this->postJson('/api/bookings', workshopBooking(['ends_at' => $end]))
        ->assertUnprocessable()->assertJsonValidationErrors('ends_at');
})->with(['2026-11-03T09:00:00+11:00', '2026-11-03T08:00:00+11:00']);

it('rejects overlapping active bookings', function (string $existing, string $requested) {
    $this->postJson('/api/bookings', workshopBooking(['status' => $existing]))->assertCreated();
    $this->postJson('/api/bookings', workshopBooking([
        'status' => $requested, 'starts_at' => '2026-11-03T09:30:00+11:00', 'ends_at' => '2026-11-03T10:30:00+11:00',
    ]))->assertUnprocessable()->assertJsonValidationErrors('service_bay');
})->with([['pending', 'pending'], ['pending', 'confirmed'], ['confirmed', 'pending'], ['confirmed', 'confirmed']]);

it('allows adjacent appointments', function () {
    $this->postJson('/api/bookings', workshopBooking())->assertCreated();
    $this->postJson('/api/bookings', workshopBooking([
        'starts_at' => '2026-11-03T10:00:00+11:00', 'ends_at' => '2026-11-03T11:00:00+11:00',
    ]))->assertCreated();
});

it('allows the same interval in a different bay', function () {
    $this->postJson('/api/bookings', workshopBooking())->assertCreated();
    $this->postJson('/api/bookings', workshopBooking(['service_bay' => 'Bay 2']))->assertCreated();
});

it('does not reserve a bay for cancelled appointments', function (string $first, string $second) {
    $this->postJson('/api/bookings', workshopBooking(['status' => $first]))->assertCreated();
    $this->postJson('/api/bookings', workshopBooking(['status' => $second]))->assertCreated();
})->with([['cancelled', 'confirmed'], ['pending', 'cancelled']]);

it('allows an update without conflicting with itself', function () {
    $id = $this->postJson('/api/bookings', workshopBooking())->json('data.id');
    $this->patchJson('/api/bookings/'.$id, ['notes' => 'Inspect brakes'])
        ->assertOk()->assertJsonPath('data.notes', 'Inspect brakes');
});

it('rejects moving a booking to an occupied bay', function () {
    $this->postJson('/api/bookings', workshopBooking())->assertCreated();
    $id = $this->postJson('/api/bookings', workshopBooking(['service_bay' => 'Bay 2']))->json('data.id');
    $this->patchJson('/api/bookings/'.$id, ['service_bay' => 'Bay 1'])
        ->assertUnprocessable()->assertJsonValidationErrors('service_bay');
    $this->assertDatabaseHas('bookings', ['id' => $id, 'service_bay' => 'Bay 2']);
});

it('rejects reactivating a cancelled booking in an occupied slot', function () {
    $this->postJson('/api/bookings', workshopBooking())->assertCreated();
    $id = $this->postJson('/api/bookings', workshopBooking(['status' => 'cancelled']))->json('data.id');
    $this->patchJson('/api/bookings/'.$id, ['status' => 'confirmed'])
        ->assertUnprocessable()->assertJsonValidationErrors('service_bay');
});

it('validates partial date changes against the retained date', function () {
    $id = $this->postJson('/api/bookings', workshopBooking())->json('data.id');
    $this->patchJson('/api/bookings/'.$id, ['ends_at' => '2026-11-03T08:00:00+11:00'])
        ->assertUnprocessable()->assertJsonValidationErrors('ends_at');
});

it('cancels while preserving the record and releases its bay', function () {
    $id = $this->postJson('/api/bookings', workshopBooking())->json('data.id');
    $this->patchJson('/api/bookings/'.$id, ['status' => 'cancelled'])->assertOk();
    $this->assertDatabaseCount('bookings', 1);
    $this->postJson('/api/bookings', workshopBooking())->assertCreated();
});

it('lists ten records per page in deterministic order and filters status', function () {
    $this->seed();
    $this->getJson('/api/bookings')->assertOk()->assertJsonCount(10, 'data')->assertJsonPath('meta.total', 24);
    $this->getJson('/api/bookings?page=3')->assertOk()->assertJsonCount(4, 'data');
    $response = $this->getJson('/api/bookings?status=confirmed')->assertOk()->assertJsonCount(8, 'data');
    expect(collect($response->json('data'))->pluck('status')->unique()->all())->toBe(['confirmed']);
    $expected = Booking::query()->orderBy('starts_at')->orderBy('id')->limit(10)->pluck('id')->all();
    expect(collect($this->getJson('/api/bookings')->json('data'))->pluck('id')->all())->toBe($expected);
});

it('rejects invalid list filters', function (string $query) {
    $this->getJson('/api/bookings?'.$query)->assertUnprocessable();
})->with(['page=0', 'page=nope', 'status=draft']);

it('shows booking details and returns JSON for missing records', function () {
    $id = $this->postJson('/api/bookings', workshopBooking())->json('data.id');
    $this->getJson('/api/bookings/'.$id)->assertOk()->assertJsonPath('data.id', $id);
    $this->getJson('/api/bookings/99999')->assertNotFound();
});

it('permanently deletes a booking', function () {
    $id = $this->postJson('/api/bookings', workshopBooking())->json('data.id');
    $this->deleteJson('/api/bookings/'.$id)->assertNoContent();
    $this->assertDatabaseMissing('bookings', ['id' => $id]);
});
