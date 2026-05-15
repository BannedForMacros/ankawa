<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Configuración de un traslado automático asociado a un (movimiento × tipo_documento).
 *
 * Cuando un responsable entrega ese tipo de documento, el sistema dispara una notificación
 * (y opcionalmente un nuevo requerimiento) sin intervención del secretario.
 *
 *  - disparadores_actor_ids: subconjunto de los responsables del tipo cuyo response gatilla la cascada.
 *    Vacío = todos disparan.
 *  - destinatarios_actor_ids: actores del expediente que reciben la notificación al dispararse.
 *  - requerimiento_auto_config (si genera_requerimiento_auto=true): config para crear un nuevo
 *    movimiento de tipo requerimiento como continuación.
 */
class MovimientoTrasladoAuto extends Model
{
    protected $table = 'movimiento_traslados_auto';

    protected $fillable = [
        'movimiento_id',
        'tipo_documento_id',
        'sumilla',
        'disparadores_actor_ids',
        'destinatarios_actor_ids',
        'genera_requerimiento_auto',
        'requerimiento_auto_config',
        'activo',
    ];

    protected $casts = [
        'disparadores_actor_ids'    => 'array',
        'destinatarios_actor_ids'   => 'array',
        'genera_requerimiento_auto' => 'boolean',
        'requerimiento_auto_config' => 'array',
        'activo'                    => 'boolean',
    ];

    public function movimiento(): BelongsTo
    {
        return $this->belongsTo(ExpedienteMovimiento::class, 'movimiento_id');
    }

    public function tipoDocumento(): BelongsTo
    {
        return $this->belongsTo(TipoDocumento::class, 'tipo_documento_id');
    }

    public function disparos(): HasMany
    {
        return $this->hasMany(MovimientoTrasladoAutoDisparo::class, 'traslado_auto_id');
    }
}
