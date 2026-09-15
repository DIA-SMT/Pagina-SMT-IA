<?php

namespace App\Models;

use Eloquent as Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EmprendimientoCabe extends Model
{

    public $table = 'tbl_emprendimiento_cabe';

    public $primaryKey = 'id_emprendimiento';

    public $fillable = [
        'id_emprendimiento',
        'id_emprendedor',
        'id_feria',
        'finicio',
        'anti',
        'nombre_empre',
        'estado'
    ];

    public $timestamps = false;

    protected $casts = [
        'id_emprendedor' => 'integer',
    ];

    /**
     * Validation rules
     *
     * @var array
     */
    public static $rules = [];

    public function emprendedor(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Emprendedor::class, 'id_emprendedor');
    }

    public function feria(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Feria::class, 'id_feria');
    }

    public function adicional(): BelongsTo
    {
        return $this->belongsTo(\App\Models\FeriaCompletar::class, 'id_feria');
    }

    public function logo()
    {
        return $this->hasOne(EmprendimientoTele::class, 'id_emprendimiento', 'id_emprendimiento');
    }

    public function detalle()
    {
        return $this->hasMany(\App\Models\EmprendimientoDeta::class, 'id_emprendimiento');
    }

    public function productos()
    {
        return $this->hasManyThrough(
            Producto::class,
            DetaProducto::class,
            'id_emprendimiento', // Foreign key en `DetaProducto`
            'id_producto',       // Foreign key en `Producto`
            'id_emprendimiento', // Local key en `EmprendimientoCabe`
            'id_producto'        // Local key en `DetaProducto`
        );
    }
}
