<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;


class BarriosNotas extends Model
{
    protected $table = "barrios_notas";
    protected $primaryId = "id";

    const CREATED_AT = "created_at";
    const UPDATED_AT = "updated_at";

    protected $fillable = [
        'titulo',
        'bajada',
        'imagen',
        'texto',
        'estado',
        'id_barrio'
    ];

    public function barrio() : BelongsTo
    {
        return $this->belongsTo(\App\Models\Barrios::class, 'id_barrio');
    }

}
