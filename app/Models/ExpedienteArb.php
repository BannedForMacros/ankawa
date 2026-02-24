<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class ExpedienteArb extends Model
{
    protected $table = 'expedientes_arb';

    protected $fillable = [
        'solicitud_id', 'servicio_id', 'numero_expediente',
        'etapa_actual_id', 'actividad_actual_id',
        'estado', 'tiene_subsanacion',
        'fecha_inicio', 'fecha_cierre', 'activo',
    ];

    protected $casts = [
        'fecha_inicio'       => 'date',
        'fecha_cierre'       => 'date',
        'tiene_subsanacion'  => 'boolean',
        'activo'             => 'boolean',
    ];

    // ── Relaciones ──

    public function solicitud(): BelongsTo
    {
        return $this->belongsTo(SolicitudArbitraje::class, 'solicitud_id');
    }

    public function servicio(): BelongsTo
    {
        return $this->belongsTo(Servicio::class, 'servicio_id');
    }

    public function etapaActual(): BelongsTo
    {
        return $this->belongsTo(Etapa::class, 'etapa_actual_id');
    }

    public function actividadActual(): BelongsTo
    {
        return $this->belongsTo(Actividad::class, 'actividad_actual_id');
    }

    public function usuarios(): HasMany
    {
        return $this->hasMany(ExpedienteArbUsuario::class, 'expediente_id');
    }

    public function arbitros(): HasMany
    {
        return $this->hasMany(ExpedienteArbArbitro::class, 'expediente_id');
    }

    public function plazos(): HasMany
    {
        return $this->hasMany(ExpedienteArbPlazo::class, 'expediente_id');
    }

    public function subsanaciones(): HasMany
    {
        return $this->hasMany(ExpedienteArbSubsanacion::class, 'expediente_id');
    }

    public function notificaciones(): HasMany
    {
        return $this->hasMany(ExpedienteArbNotificacion::class, 'expediente_id');
    }

    public function movimientos(): HasMany
    {
        return $this->hasMany(ExpedienteArbMovimiento::class, 'expediente_id')
                    ->orderByDesc('created_at');
    }

    public function documentos(): MorphMany
    {
        return $this->morphMany(Documento::class, 'modelo', 'modelo_tipo', 'modelo_id');
    }

    // ── Helpers ──

    public function estaBloqueado(): bool
    {
        return $this->tiene_subsanacion;
    }

    public function plazoActual(): ?ExpedienteArbPlazo
    {
        return $this->plazos()
            ->where('actividad_id', $this->actividad_actual_id)
            ->where('estado', 'pendiente')
            ->first();
    }

    public function scopeActivo($query)
    {
        return $query->where('activo', true);
    }
}