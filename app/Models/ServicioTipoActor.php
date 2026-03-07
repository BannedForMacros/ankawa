<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ServicioTipoActor extends Model
{
    protected $table = 'servicio_tipos_actor';

    protected $fillable = [
        'servicio_id',
        'tipo_actor_id',
        'es_automatico',
        'rol_auto_slug',
        'orden',
        'activo',
    ];

    protected $casts = [
        'es_automatico' => 'boolean',
    ];

    public function servicio(): BelongsTo
    {
        return $this->belongsTo(Servicio::class, 'servicio_id');
    }

    public function tipoActor(): BelongsTo
    {
        return $this->belongsTo(TipoActorExpediente::class, 'tipo_actor_id');
    }
}
