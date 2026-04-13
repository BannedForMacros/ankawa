<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MovimientoResponsable extends Model
{
    protected $table = 'movimiento_responsables';

    protected $fillable = [
        'movimiento_id',
        'expediente_actor_id',
        'tipo_actor_id',
        'dias_plazo',
        'tipo_dias',
        'fecha_limite',
        'estado',
        'respuesta',
        'respondido_por',
        'fecha_respuesta',
    ];

    protected $casts = [
        'fecha_limite'    => 'date',
        'fecha_respuesta' => 'datetime',
    ];

    public function movimiento(): BelongsTo
    {
        return $this->belongsTo(ExpedienteMovimiento::class, 'movimiento_id');
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(ExpedienteActor::class, 'expediente_actor_id');
    }

    public function tipoActor(): BelongsTo
    {
        return $this->belongsTo(TipoActorExpediente::class, 'tipo_actor_id');
    }

    public function respondidoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'respondido_por');
    }
}
