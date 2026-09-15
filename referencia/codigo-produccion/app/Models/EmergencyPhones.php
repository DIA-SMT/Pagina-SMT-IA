<?php

namespace App\Models;

use Eloquent as Model;


class EmergencyPhones extends Model
{

    public $table = 'emergency_phones';
    
    const CREATED_AT = 'created_at';
    const UPDATED_AT = 'updated_at';

    public $fillable = [
        'name',
        'phone'
    ];
    protected $casts = [
        'id' => 'integer',
    ];

    public static $rules = [
        
    ];
}
