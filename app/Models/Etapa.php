<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Etapa extends Model
{
    protected $table = 'etapas';

    protected $fillable = [
        'servicio_id',
        'nombre',
        'descripcion',
        'orden',
        'activo',
        'requiere_conformidad',
    ];

    protected $casts = [
        'requiere_conformidad' => 'boolean',
    ];

    public function servicio(): BelongsTo
    {
        return $this->belongsTo(Servicio::class, 'servicio_id');
    }

    public function scopeActivo($query)
    {
        return $query->where('activo', 1);
    }
}
