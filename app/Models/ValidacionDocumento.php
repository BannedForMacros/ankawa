<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ValidacionDocumento extends Model
{
    protected $table = 'validaciones_documento';

    protected $fillable = [
        'tipo',
        'numero',
        'digito_verificador',
        'resultado',
        'respuesta_completa',
        'ip',
        'user_agent',
        'contexto',
        'solicitable_type',
        'solicitable_id',
        'email_sesion',
    ];

    protected $casts = [
        'respuesta_completa' => 'array',
    ];

    public function solicitable(): MorphTo
    {
        return $this->morphTo();
    }
}
