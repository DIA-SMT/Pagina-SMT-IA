<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TramitesNotas extends Model
{
    protected $table = "tramites_items_notas";
    protected $primaryId = "id";

    const CREATED_AT = "created_at";
    const UPDATED_AT = "updated_at";

    protected $fillable = [
        'tramite_id',
        'item_id',
        'title',
        'image',
        'excerpt',
        'body'
    ];

    public function items() : BelongsTo
    {
        return $this->belongsTo(\App\Models\TramitesServiciosItem::class, 'item_id');
    }
    public function tramite() : BelongsTo
    {
        return $this->belongsTo(\App\Models\TramitesServicios::class, 'tramite_id');
    }
}
