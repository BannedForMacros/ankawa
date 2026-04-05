<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExpedienteActorEmail extends Model
{
    protected $table = 'expediente_actor_emails';

    protected $fillable = [
        'expediente_actor_id',
        'email',
        'label',
        'orden',
        'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
    ];

    public function actor(): BelongsTo
    {
        return $this->belongsTo(ExpedienteActor::class, 'expediente_actor_id');
    }

    public function scopeActivo($query)
    {
        return $query->where('activo', 1);
    }
}
