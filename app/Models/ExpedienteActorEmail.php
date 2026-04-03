<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExpedienteActorEmail extends Model
{
    public $timestamps = false;

    protected $table = 'expediente_actor_emails';

    protected $fillable = [
        'expediente_actor_id',
        'email',
        'label',
        'orden',
    ];

    public function actor(): BelongsTo
    {
        return $this->belongsTo(ExpedienteActor::class, 'expediente_actor_id');
    }
}
