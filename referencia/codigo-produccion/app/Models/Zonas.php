<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Zonas extends Model
{
    protected $table = "zonas";
    protected $primaryId = "id";

    const CREATED_AT = "created_at";
    const UPDATED_AT = "updated_at";

    protected $fillable = [
        'nombre',
        'color'
    ];

    public function coordenadas(): HasMany
    {
        return $this->hasMany(\App\Models\Coordenadas::class, 'id_zona');
    }

    public function zonaBarrios(): HasMany
    {
        return $this->hasMany(\App\Models\Barrios::class, 'id_zona');
    }
}
