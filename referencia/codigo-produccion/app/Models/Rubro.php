<?php

namespace App\Models;

use Eloquent as Model;

class Rubro extends Model
{

    public $table = 'tbl_rubro';

    public $primaryKey = 'id_rubro';

    public $fillable = [
        'id_rubro',
        'rubro',
        'estado'
    ];

    public $timestamps = false;
  
    protected $casts = [
        'id_rubro' => 'integer',
    ];

    /**
     * Validation rules
     *
     * @var array
     */
    public static $rules = [
        
    ];
    
}
