<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;


class Coordenadas extends Model
{
    protected $table = "coordenadas";
    protected $primaryId = "id";

    const CREATED_AT = "created_at";
    const UPDATED_AT = "updated_at";

    protected $fillable = [
        'latitud',
        'longitud',
        'id_zona'
    ];

    public function zona() : BelongsTo
    {
        return $this->belongsTo(\App\Models\Zonas::class, 'id_zona');
    }

}
