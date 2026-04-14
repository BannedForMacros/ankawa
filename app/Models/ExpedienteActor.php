<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

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
        'designado_por_id',
        'activo',
        'credenciales_enviadas',
        'acceso_mesa_partes',
        'acceso_expediente_electronico',
    ];

    protected $casts = [
        'es_gestor'                     => 'boolean',
        'credenciales_enviadas'         => 'boolean',
        'acceso_mesa_partes'            => 'boolean',
        'acceso_expediente_electronico' => 'boolean',
    ];

    public function expediente(): BelongsTo
    {
        return $this->belongsTo(Expediente::class, 'expediente_id');
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }

    public function designadoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'designado_por_id');
    }

    public function tipoActor(): BelongsTo
    {
        return $this->belongsTo(TipoActorExpediente::class, 'tipo_actor_id');
    }

    public function emailsAdicionales(): HasMany
    {
        return $this->hasMany(ExpedienteActorEmail::class, 'expediente_actor_id')
            ->where('activo', 1)
            ->orderBy('orden');
    }

    /**
     * Todos los emails del actor: el principal + los adicionales.
     * Para actores internos, el email principal es usuario->email.
     * Para actores externos, es email_externo.
     */
    public function todosLosEmails(): array
    {
        $emails = [];

        // Email principal
        if ($this->usuario?->email) {
            $emails[] = $this->usuario->email;
        } elseif ($this->email_externo) {
            $emails[] = $this->email_externo;
        }

        // Emails adicionales
        foreach ($this->emailsAdicionales as $extra) {
            if ($extra->email && !in_array($extra->email, $emails)) {
                $emails[] = $extra->email;
            }
        }
        return $emails;
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
