<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExpedienteActor extends Model
{
    protected $table = 'expediente_actores';

    protected $fillable = [
        'expediente_id',
        'usuario_id',
        'tipo_actor_id',
        'activo'
    ];

    // --- RELACIONES ---

    public function expediente(): BelongsTo
    {
        return $this->belongsTo(Expediente::class, 'expediente_id');
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }

    public function tipoActor(): BelongsTo
    {
        return $this->belongsTo(TipoActorExpediente::class, 'tipo_actor_id');
    }
}