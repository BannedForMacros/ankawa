<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExpedienteActorAceptacion extends Model
{
    public $timestamps = false;

    protected $table = 'expediente_actor_aceptaciones';

    protected $fillable = [
        'expediente_actor_id',
        'expediente_id',
        'tipo',
        'ip_address',
        'user_agent',
        'portal_email',
        'created_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];
}
