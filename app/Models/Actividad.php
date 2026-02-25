<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany; // <-- Asegúrate de que esto esté importado

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

    // --- ¡AQUÍ ESTÁ LO QUE FALTABA! ---
    // Las transiciones (botones) que nacen desde esta actividad
    public function transiciones(): HasMany
    {
        return $this->hasMany(ActividadTransicion::class, 'actividad_origen_id')->orderBy('orden');
    }
    // ----------------------------------

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