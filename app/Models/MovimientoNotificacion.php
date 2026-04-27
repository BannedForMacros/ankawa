<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MovimientoNotificacion extends Model
{
    protected $table = 'movimiento_notificaciones';

    public const ESTADO_PENDIENTE = 'pendiente';
    public const ESTADO_ENVIADO   = 'enviado';
    public const ESTADO_FALLIDO   = 'fallido';

    public $timestamps = false;

    protected $fillable = [
        'movimiento_id',
        'actor_id',
        'email_destino',
        'nombre_destino',
        'asunto',
        'estado_envio',
        'numero_cedula',
        'enviado_at',
        'created_at',
    ];

    protected $casts = [
        'enviado_at' => 'datetime',
        'created_at' => 'datetime',
    ];

    public function movimiento(): BelongsTo
    {
        return $this->belongsTo(ExpedienteMovimiento::class, 'movimiento_id');
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(ExpedienteActor::class, 'actor_id');
    }
}
