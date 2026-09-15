<?php

namespace App\Models;

use Eloquent as Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Galerias extends Model
{
    public $table = "galerias";
    
    const CREATED_AT = 'created_at';
    const UPDATED_AT = 'updated_at';

    public $fillable = [
        "name",
    ];

    public function GaleriaImagenes() : HasMany
    {
        return $this->hasMany(\App\Models\GaleriaImagenes::class, 'galeria_id');
    }
 
}
