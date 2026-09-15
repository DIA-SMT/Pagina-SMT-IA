<?php

namespace App\Models;

use Eloquent as Model;

class GaleriaProducto extends Model
{

    public $table = 'galerias_productos';

    public $fillable = [
        'id',
        'producto_id',
        'emprendimiento_id',
        'imagen',
        'orden'
    ];

    public $timestamps = false;
  
    protected $casts = [
        'id' => 'integer',
    ];

    /**
     * Validation rules
     *
     * @var array
     */
    public static $rules = [
        
    ];
    
}
