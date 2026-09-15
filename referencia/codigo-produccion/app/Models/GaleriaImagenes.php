<?php

namespace App\Models;

use Eloquent as Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GaleriaImagenes extends Model
{
    
    protected $table = "galerias_fotos";
    
    const CREATED_AT = 'created_at';
    const UPDATED_AT = 'updated_at';

    protected $fillable = [
        "galeria_id",
        "foto",
    ];

    public function GaleriaImagenes() : BelongsTo
    {
        return $this->belongsTo(\App\Models\Galerias::class, 'galeria_id');
    }
 
}
