<?php

namespace App\Http\Requests;

class UpdateBookingRequest extends StoreBookingRequest
{
    public function rules(): array
    {
        return array_map(fn (array $rules): array => in_array('sometimes', $rules, true) ? $rules : ['sometimes', ...$rules], parent::rules());
    }
}
