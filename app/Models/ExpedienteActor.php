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
        'nombre_externo',
        'email_externo',
        'es_gestor',
        'activo',
        'credenciales_enviadas',
    ];

    protected $casts = [
        'es_gestor'             => 'boolean',
        'credenciales_enviadas' => 'boolean',
    ];

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

    public function scopeActivo($query)
    {
        return $query->where('activo', 1);
    }

    public function scopeGestores($query)
    {
        return $query->where('es_gestor', true)->where('activo', 1);
    }
}
