<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TramitesServicios extends Model
{
    protected $table = "tramites_servicios";
    protected $primaryKey = "id";

    const CREATED_AT = "created_at";
    const UPDATED_AT = "updated_at";

    protected $fillable = [
        'icon',
        'title',
        'texto',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(\App\Models\TramitesServiciosItem::class, 'tramite_id');
    }
    public function notas() : HasMany
    {
        return $this->hasMany(\App\Models\TramitesNotas::class, 'tramite_id');
    }
}
