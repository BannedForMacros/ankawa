<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

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
        'activo',
    ];

    public function etapa(): BelongsTo
    {
        return $this->belongsTo(Etapa::class, 'etapa_id');
    }

    // Roles que pueden actuar en esta actividad
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Rol::class, 'actividad_roles', 'actividad_id', 'rol_id')
                    ->withTimestamps();
    }

    // ¿El usuario actual puede actuar en esta actividad?
    public function puedeActuar(int $rolId): bool
    {
        return $this->roles->pluck('id')->contains($rolId);
    }

    public function scopeActivo($query)
    {
        return $query->where('activo', 1);
    }
}