<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TramitesServiciosItem extends Model
{
    protected $table = "tramites_servicios_items";
    protected $primaryKey = "id";

    const CREATED_AT = "created_at";
    const UPDATED_AT = "updated_at";

    protected $fillable = [
        'tramite_id',
        'title',
        'texto',
        'icon',
        'link',
        'order'
    ];

    public function items(): BelongsTo
    {
        return $this->belongsTo(\App\Models\TramitesServicios::class, 'tramite_id');
    }
    public function notas() : HasMany
    {
        return $this->hasMany(\App\Models\TramitesNotas::class, 'item_id');
    }
}
