<?php

namespace App\Models;

use Eloquent as Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Producto extends Model
{

    public $table = 'tbl_producto';

    public $primaryKey = 'id_producto';

    public $fillable = [
        'id_producto',
        'id_rubro',
        'producto',
        'estado'
    ];

    public $timestamps = false;

    protected $casts = [
        'id_producto' => 'integer',
    ];

    /**
     * Validation rules
     *
     * @var array
     */
    public static $rules = [];

    public function galeria()
    {
        return $this->hasMany(GaleriaProducto::class, 'producto_id', 'id_producto');
    }
}
