<?php

namespace App\Models;

use Eloquent as Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdministracionEstructura extends Model
{

    public $table = 'administracion_estructura';
    
    const CREATED_AT = 'created_at';
    const UPDATED_AT = 'updated_at';



    public $fillable = [
        'administracion_id',
        'titulo',
        'nombre',
        'email',
        'telefono',
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

    public function administracion() : BelongsTo 
    {
        return $this->BelongsTo(\App\Models\Administracion::class, 'administracion_id');    
    }
    
}
