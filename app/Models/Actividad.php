<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Actividad extends Model
{
    protected $table = 'actividades';

    protected $fillable = [
        'etapa_id',
        'nombre',
        'descripcion',
        'tipo',
        'es_obligatorio',
        'dias_plazo',
        'orden',
        'activo'
    ];

    public function etapa(): BelongsTo
    {
        return $this->belongsTo(Etapa::class, 'etapa_id');
    }

    public function scopeActivo($query)
    {
        return $query->where('activo', 1);
    }
}