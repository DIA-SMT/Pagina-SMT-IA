<?php

namespace App\Models;

use Eloquent as Model;

class FeriaCompletar extends Model
{

    public $table = 'feria_completar';

    public $primaryKey = 'id';

    public $fillable = [
        'adicional',
        'id_feria',
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
