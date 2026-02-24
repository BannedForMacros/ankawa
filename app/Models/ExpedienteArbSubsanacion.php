<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class ExpedienteArbSubsanacion extends Model
{
    protected $table = 'expediente_arb_subsanaciones';

    protected $fillable = [
        'expediente_id', 'solicitud_id', 'actividad_id',
        'registrado_por', 'observacion',
        'plazo_dias', 'fecha_limite', 'estado',
        'subsanado_por', 'fecha_subsanacion', 'respuesta', 'activo',
    ];

    protected $casts = [
        'fecha_limite'      => 'date',
        'fecha_subsanacion' => 'datetime',
        'activo'            => 'boolean',
    ];

    public function expediente(): BelongsTo
    {
        return $this->belongsTo(ExpedienteArb::class, 'expediente_id');
    }

    public function solicitud(): BelongsTo
    {
        return $this->belongsTo(SolicitudArbitraje::class, 'solicitud_id');
    }

    public function actividad(): BelongsTo
    {
        return $this->belongsTo(Actividad::class, 'actividad_id');
    }

    public function registradoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'registrado_por');
    }

    public function subsanadoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'subsanado_por');
    }

    // Documentos adjuntos a la respuesta de subsanación
    public function documentos(): MorphMany
    {
        return $this->morphMany(Documento::class, 'modelo', 'modelo_tipo', 'modelo_id');
    }

    public function bloqueaFlujo(): bool
    {
        return $this->estado === 'pendiente' && $this->activo;
    }

    public function scopeActivo($query)
    {
        return $query->where('activo', true);
    }

    public function scopePendientes($query)
    {
        return $query->where('estado', 'pendiente');
    }
}