<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\TipoActorExpediente;

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

    // Tipos de actor que pueden actuar en esta actividad
    public function tiposActor(): BelongsToMany
    {
        return $this->belongsToMany(TipoActorExpediente::class, 'actividad_tipos_actor', 'actividad_id', 'tipo_actor_id')
                    ->withTimestamps();
    }

    // --- ¡AQUÍ ESTÁ LO QUE FALTABA! ---
    // Las transiciones (botones) que nacen desde esta actividad
    public function transiciones(): HasMany
    {
        return $this->hasMany(ActividadTransicion::class, 'actividad_origen_id')->orderBy('orden');
    }

    // Slots de documentos requeridos en esta actividad
    public function requisitosDocumento(): HasMany
    {
        return $this->hasMany(ActividadRequisitoDocumento::class, 'actividad_id')
                    ->where('activo', true)
                    ->orderBy('orden');
    }

    // ¿El tipo de actor dado puede actuar en esta actividad?
    public function puedeActuar(int $tipoActorId): bool
    {
        return $this->tiposActor->pluck('id')->contains($tipoActorId);
    }

    public function scopeActivo($query)
    {
        return $query->where('activo', 1);
    }
}