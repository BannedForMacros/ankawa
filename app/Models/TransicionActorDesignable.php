<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TransicionActorDesignable extends Model
{
    protected $table = 'transicion_actores_designables';

    protected $fillable = [
        'transicion_id',
        'tipo_actor_id',
        'es_obligatorio',
    ];

    public function transicion(): BelongsTo
    {
        return $this->belongsTo(ActividadTransicion::class, 'transicion_id');
    }

    public function tipoActor(): BelongsTo
    {
        return $this->belongsTo(TipoActorExpediente::class, 'tipo_actor_id');
    }
}
