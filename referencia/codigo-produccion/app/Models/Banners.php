<?php

namespace App\Models;

use Eloquent as Model;

class Banners extends Model
{

    public $table = 'banners';
    
    const CREATED_AT = 'created_at';
    const UPDATED_AT = 'updated_at';



    public $fillable = [
        'orden',
        'name',
        'type',
        'image'
    ];


    protected $casts = [
        'id' => 'integer',
    ];


    public static $rules = [
        
    ];


}
