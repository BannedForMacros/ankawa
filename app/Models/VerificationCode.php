<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VerificationCode extends Model
{
    protected $fillable = [
        'email',
        'codigo',
        'expires_at',
        'usado',
        'ip_solicitud',
        'user_agent_solicitud',
        'ip_validacion',
        'user_agent_validacion',
        'intentos_fallidos',
        'validado_at',
        'numero_documento',
    ];

    protected $casts = [
        'expires_at'  => 'datetime',
        'validado_at' => 'datetime',
        'usado'       => 'boolean',
    ];

    public function esValido(): bool
    {
        return !$this->usado && $this->expires_at->isFuture();
    }
}