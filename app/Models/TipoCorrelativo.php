<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TipoCorrelativo extends Model
{
    protected $table = 'tipos_correlativo';

    public $timestamps = false;

    protected $fillable = [
        'nombre',
        'codigo',
        'prefijo',
        'formato',
        'aplica_sufijo_centro',
        'activo',
    ];

    protected $casts = [
        'aplica_sufijo_centro' => 'boolean',
        'activo'               => 'boolean',
    ];

    public function correlativos(): HasMany
    {
        return $this->hasMany(Correlativo::class, 'tipo_correlativo_id');
    }

    public function scopeActivo($query)
    {
        return $query->where('activo', true);
    }
}
