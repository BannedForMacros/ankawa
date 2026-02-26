<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;


class ExpedienteArbMovimiento extends Model
{
    protected $table = 'expediente_arb_movimientos';

    const UPDATED_AT = null; // Log inmutable

    protected $fillable = [
        'expediente_id', 'usuario_id',
        'etapa_origen_id', 'actividad_origen_id',
        'etapa_destino_id', 'actividad_destino_id',
        'accion', 'observacion', 'activo',
    ];

    protected $casts = ['activo' => 'boolean'];

    public function expediente(): BelongsTo
    {
        return $this->belongsTo(ExpedienteArb::class, 'expediente_id');
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }

    public function etapaOrigen(): BelongsTo
    {
        return $this->belongsTo(Etapa::class, 'etapa_origen_id');
    }

    public function actividadOrigen(): BelongsTo
    {
        return $this->belongsTo(Actividad::class, 'actividad_origen_id');
    }

    public function etapaDestino(): BelongsTo
    {
        return $this->belongsTo(Etapa::class, 'etapa_destino_id');
    }

    public function actividadDestino(): BelongsTo
    {
        return $this->belongsTo(Actividad::class, 'actividad_destino_id');
    }

    public function solicitud(): BelongsTo
    {
        return $this->belongsTo(SolicitudArbitraje::class, 'solicitud_id');
    }
    public function registradoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'registrado_por');
    }


}
