<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class TipoActorExpediente extends Model
{
    protected $table = 'tipos_actor_expediente';

    // Slugs inmutables del sistema (definidos por reglas de negocio, no por configuración del admin)
    public const SLUG_DEMANDANTE = 'demandante';
    public const SLUG_DEMANDADO  = 'demandado';

    public const SLUGS_INMUTABLES = [
        self::SLUG_DEMANDANTE,
        self::SLUG_DEMANDADO,
    ];

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

    // Servicios donde este tipo de actor está configurado
    public function servicios(): BelongsToMany
    {
        return $this->belongsToMany(
            Servicio::class,
            'servicio_tipos_actor',
            'tipo_actor_id',
            'servicio_id'
        )->withPivot('es_automatico', 'rol_auto_slug', 'orden', 'activo', 'permite_externo');
    }

    // --- SCOPES ---
    public function scopeActivo($query)
    {
        return $query->where('activo', 1);
    }
}