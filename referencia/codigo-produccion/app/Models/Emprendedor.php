<?php

namespace App\Models;

use Eloquent as Model;

class Emprendedor extends Model
{

    public $table = 'tbl_emprendedor';

    public $primaryKey = 'id_emprendedor';

    public $fillable = [
        'id_emprendedor',
        'dni',
        'apellido',
        'nombre',
        'telefono',
        'domicilio',
        'email',
        'instagram',
        'facebook'
    ];

    public $timestamps = false;
  
    protected $casts = [
        'id_emprendedor' => 'integer',
    ];

    /**
     * Validation rules
     *
     * @var array
     */
    public static $rules = [
        
    ];
    
}
