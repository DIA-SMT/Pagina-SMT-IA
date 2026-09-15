<?php

namespace App\Models;

use Eloquent as Model;

class DetaProducto extends Model
{

    public $table = 'tbl_deta_producto';

    public $primaryKey = 'id_detalle_produ';

    public $fillable = [
        'id_detalle_produ',
        'id_emprendimiento',
        'id_producto'
    ];

    public $timestamps = false;
  
    protected $casts = [
        'id_detalle_produ' => 'integer',
    ];

    /**
     * Validation rules
     *
     * @var array
     */
    public static $rules = [
        
    ];
    
}
