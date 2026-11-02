<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServiceBay extends Model
{
    public const NAMES = ['Bay 1', 'Bay 2', 'Bay 3', 'Bay 4'];

    public $timestamps = false;

    protected $fillable = ['name'];
}
