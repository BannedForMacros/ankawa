<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Etapa extends Model
{
    protected $table = 'etapas';

    protected $fillable = [
        'servicio_id',
        'nombre',
        'descripcion',
        'orden',
        'activo'
    ];

    public function servicio(): BelongsTo
    {
        return $this->belongsTo(Servicio::class, 'servicio_id');
    }

    public function actividades(): HasMany
    {
        return $this->hasMany(Actividad::class, 'etapa_id')->orderBy('orden');
    }

    public function scopeActivo($query)
    {
        return $query->where('activo', 1);
    }
}