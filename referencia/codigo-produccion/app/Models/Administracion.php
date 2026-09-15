<?php

namespace App\Models;


use Eloquent as Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Administracion extends Model
{

    public $table = 'administraciones';
    
    const CREATED_AT = 'created_at';
    const UPDATED_AT = 'updated_at';

    public $fillable = [
        'area_id',
        'foto',
        'domicilio',
        'telefono',
        'email',
        'nombre',
        'dependencia_id',
        'archivo',
        'descripcion'
    ];
    protected $casts = [
        'id' => 'integer',
    ];

    public static $rules = [
        
    ];
    public function area() : BelongsTo 
    {
        return $this->BelongsTo(\App\Models\AreasGobiernos::class, 'area_id');
    }
    
}
