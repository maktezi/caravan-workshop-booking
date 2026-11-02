<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BookingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'customer_name' => $this->customer_name,
            'customer_email' => $this->customer_email,
            'rego' => $this->rego,
            'service_bay' => $this->service_bay,
            'starts_at' => $this->starts_at->utc()->toIso8601String(),
            'ends_at' => $this->ends_at->utc()->toIso8601String(),
            'status' => $this->status,
            'notes' => $this->notes,
            'created_at' => $this->created_at->utc()->toIso8601String(),
            'updated_at' => $this->updated_at->utc()->toIso8601String(),
        ];
    }
}
