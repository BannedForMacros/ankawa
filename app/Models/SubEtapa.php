<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SubEtapa extends Model
{
    protected $table = 'sub_etapas';

    protected $fillable = [
        'etapa_id',
        'nombre',
        'descripcion',
        'orden',
        'activo',
    ];

    public function etapa(): BelongsTo
    {
        return $this->belongsTo(Etapa::class, 'etapa_id');
    }

    public function movimientos(): HasMany
    {
        return $this->hasMany(ExpedienteMovimiento::class, 'sub_etapa_id');
    }

    public function scopeActivo($query)
    {
        return $query->where('activo', 1);
    }
}
