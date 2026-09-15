<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Barrios extends Model
{
    protected $table = "barrios";
    protected $primaryId = "id";

    const CREATED_AT = "created_at";
    const UPDATED_AT = "updated_at";

    protected $fillable = [
        'nombre',
        'id_zona'
    ];

    public function barriosZonas() : BelongsTo
    {
        return $this->belongsTo(\App\Models\Zonas::class,'id_zona');
    }

    public function barriosNotas(): HasMany
    {
        return $this->hasMany(\App\Models\BarriosNotas::class, 'id_barrio');
    }
}
