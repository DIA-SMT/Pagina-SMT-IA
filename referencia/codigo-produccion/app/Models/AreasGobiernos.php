<?php

namespace App\Models;

use Eloquent as Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class AreasGobiernos extends Model
{

    public $table = 'areas_gobiernos';
    
    const CREATED_AT = 'created_at';
    const UPDATED_AT = 'updated_at';



    public $fillable = [
        'id',
        'area',
    ];

   
    public function administracion(): HasMany
    {
        return $this->HasMany(\App\Models\Administracion::class, 'area_id');
    }
    public function administracionPivote(): BelongsToMany
    {
        return $this->belongsToMany(self::class, 'administraciones_pivote', 'area_id', 'related_id');
    }
}
