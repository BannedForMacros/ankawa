<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TipoActorExpediente extends Model
{
    protected $table = 'tipos_actor_expediente';

    // Como en nuestro script SQL no le pusimos created_at ni updated_at a este catálogo base:
    public $timestamps = false;

    protected $fillable = [
        'nombre',
        'slug',
        'activo'
    ];

    // --- RELACIONES ---

    // Para saber en cuántos expedientes está participando este tipo de actor
    public function actoresExpediente(): HasMany
    {
        return $this->hasMany(ExpedienteActor::class, 'tipo_actor_id');
    }

    // Para saber qué transiciones configuran designar este rol
    public function transicionesQueLoDesignan(): HasMany
    {
        return $this->hasMany(ActividadTransicion::class, 'designa_tipo_actor_id');
    }

    // --- SCOPES ---
    public function scopeActivo($query)
    {
        return $query->where('activo', 1);
    }
}