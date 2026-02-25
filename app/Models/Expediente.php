<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Expediente extends Model
{
    protected $table = 'expedientes';

    protected $fillable = [
        'solicitud_id',
        'servicio_id',
        'numero_expediente',
        'etapa_actual_id',
        'actividad_actual_id',
        'estado'
    ];

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

    public function actores(): HasMany
    {
        return $this->hasMany(ExpedienteActor::class, 'expediente_id');
    }

    public function movimientos(): HasMany
    {
        return $this->hasMany(ExpedienteMovimiento::class, 'expediente_id')->orderByDesc('created_at');
    }
}