<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Log de cada vez que un traslado automático efectivamente se disparó.
 * Un disparo se identifica por (config × actor que respondió) — únicamente una vez por par.
 * Linkea al movimiento generado para trazabilidad.
 */
class MovimientoTrasladoAutoDisparo extends Model
{
    protected $table = 'movimiento_traslados_auto_disparos';

    public $timestamps = false; // solo triggered_at

    protected $fillable = [
        'traslado_auto_id',
        'triggered_by_actor_id',
        'movimiento_generado_id',
        'triggered_at',
    ];

    protected $casts = [
        'triggered_at' => 'datetime',
    ];

    public function trasladoAuto(): BelongsTo
    {
        return $this->belongsTo(MovimientoTrasladoAuto::class, 'traslado_auto_id');
    }

    public function actorDisparador(): BelongsTo
    {
        return $this->belongsTo(ExpedienteActor::class, 'triggered_by_actor_id');
    }

    public function movimientoGenerado(): BelongsTo
    {
        return $this->belongsTo(ExpedienteMovimiento::class, 'movimiento_generado_id');
    }
}
