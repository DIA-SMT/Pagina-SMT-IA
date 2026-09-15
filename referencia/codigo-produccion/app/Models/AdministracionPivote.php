<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdministracionPivote extends Model
{
    public $table = 'administraciones_pivote';
    
    const CREATED_AT = 'created_at';
    const UPDATED_AT = 'updated_at';



    public $fillable = [
        'area_id',
        'related_id',
        'orden'
    ];

  
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
