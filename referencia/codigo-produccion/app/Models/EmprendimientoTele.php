<?php

namespace App\Models;

use Eloquent as Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmprendimientoTele extends Model
{
    
    protected $table = "emprendimiento_tele";
    
    const CREATED_AT = 'created_at';
    const UPDATED_AT = 'updated_at';

    protected $fillable = [
        "id",
        "id_emprendimiento",
        "logo"
    ];
 
}
