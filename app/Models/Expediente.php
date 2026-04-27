<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Expediente extends Model
{
    protected $table = 'expedientes';

    public const ESTADO_ACTIVO     = 'activo';
    public const ESTADO_SUSPENDIDO = 'suspendido';
    public const ESTADO_CONCLUIDO  = 'concluido';

    public const ESTADOS = [
        self::ESTADO_ACTIVO,
        self::ESTADO_SUSPENDIDO,
        self::ESTADO_CONCLUIDO,
    ];

    protected $fillable = [
        'solicitud_type',
        'solicitud_id',
        'servicio_id',
        'numero_expediente',
        'etapa_actual_id',
        'estado',
    ];

    public function solicitud()
    {
        return $this->morphTo('solicitud', 'solicitud_type', 'solicitud_id');
    }

    public function servicio(): BelongsTo
    {
        return $this->belongsTo(Servicio::class, 'servicio_id');
    }

    public function etapaActual(): BelongsTo
    {
        return $this->belongsTo(Etapa::class, 'etapa_actual_id');
    }

    public function actores(): HasMany
    {
        return $this->hasMany(ExpedienteActor::class, 'expediente_id');
    }

    public function actoresActivos(): HasMany
    {
        return $this->hasMany(ExpedienteActor::class, 'expediente_id')->where('activo', 1);
    }

    public function gestor(): HasOne
    {
        return $this->hasOne(ExpedienteActor::class, 'expediente_id')
                    ->where('es_gestor', true)
                    ->where('activo', 1);
    }

    public function movimientos(): HasMany
    {
        return $this->hasMany(ExpedienteMovimiento::class, 'expediente_id');
    }

    public function movimientosPendientes(): HasMany
    {
        return $this->hasMany(ExpedienteMovimiento::class, 'expediente_id')
                    ->where('estado', 'pendiente')
                    ->where('activo', true);
    }

    public function historial(): HasMany
    {
        return $this->hasMany(ExpedienteHistorial::class, 'expediente_id');
    }

    public function scopeActivo($query)
    {
        return $query->where('estado', 'activo');
    }
}
