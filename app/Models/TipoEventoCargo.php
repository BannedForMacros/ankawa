<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TipoEventoCargo extends Model
{
    protected $table = 'tipos_evento_cargo';

    protected $fillable = [
        'codigo',
        'nombre',
        'descripcion',
        'genera_cargo',
        'activo',
    ];

    protected $casts = [
        'genera_cargo' => 'boolean',
        'activo'       => 'boolean',
    ];

    public function cargos(): HasMany
    {
        return $this->hasMany(Cargo::class, 'tipo_evento_cargo_id');
    }

    public function scopeActivo($query)
    {
        return $query->where('activo', true);
    }
}
