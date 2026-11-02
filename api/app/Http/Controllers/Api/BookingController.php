<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\StoreBookingRequest;
use App\Http\Requests\UpdateBookingRequest;
use App\Http\Resources\BookingResource;
use App\Models\Booking;
use App\Services\BookingService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

class BookingController
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $filters = $request->validate(['page' => ['sometimes', 'integer', 'min:1'], 'status' => ['sometimes', Rule::in(Booking::STATUSES)]]);

        return BookingResource::collection(Booking::query()
            ->when(isset($filters['status']), fn ($query) => $query->where('status', $filters['status']))
            ->orderBy('starts_at')->orderBy('id')->paginate(10)->withQueryString());
    }

    public function show(Booking $booking): BookingResource
    {
        return new BookingResource($booking);
    }

    public function store(StoreBookingRequest $request, BookingService $service): BookingResource
    {
        return new BookingResource($service->save($request->validated()));
    }

    public function update(UpdateBookingRequest $request, Booking $booking, BookingService $service): BookingResource
    {
        return new BookingResource($service->save($request->validated(), $booking));
    }

    public function destroy(Booking $booking, BookingService $service): Response
    {
        $service->delete($booking);

        return response()->noContent();
    }
}
