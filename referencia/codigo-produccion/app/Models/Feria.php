<?php

namespace App\Models;

use Eloquent as Model;

class Feria extends Model
{

    public $table = 'tbl_ferias';

    public $primaryKey = 'id_feria';

    public $fillable = [
        'id_feria',
        'feria',
    ];

    public $timestamps = false;
  
    protected $casts = [
        'id_feria' => 'integer',
    ];

    /**
     * Validation rules
     *
     * @var array
     */
    public static $rules = [
        
    ];
    
}
