<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CatalogoAccion extends Model
{
    protected $table = 'catalogo_acciones';

    public $timestamps = false;

    protected $fillable = [
        'nombre',
        'slug',
        'color_hex',
        'activo'
    ];

    // --- RELACIONES ---

    // Para saber en cuántas transiciones (botones) se está usando esta acción
    public function transiciones(): HasMany
    {
        return $this->hasMany(ActividadTransicion::class, 'catalogo_accion_id');
    }

    // --- SCOPES ---
    public function scopeActivo($query)
    {
        return $query->where('activo', 1);
    }
}