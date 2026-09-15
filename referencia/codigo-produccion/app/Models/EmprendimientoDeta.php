<?php

namespace App\Models;

use Eloquent as Model;

class EmprendimientoDeta extends Model
{

    public $table = 'tbl_emprendimiento_deta';

    public $primaryKey = 'id_detalle';

    public $fillable = [
        'id_detalle',
        'id_emprendimiento',
        'id_rubro',
    ];

    public $timestamps = false;
  
    protected $casts = [
        'id_detalle' => 'integer',
    ];

    /**
     * Validation rules
     *
     * @var array
     */
    public static $rules = [
        
    ];
    
}
