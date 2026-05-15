<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class AuditoriaPortal extends Model
{
    protected $table = 'auditoria_portal';

    public $timestamps = false;

    protected $fillable = [
        'evento',
        'email_sesion',
        'dni_sesion',
        'user_id',
        'ip',
        'user_agent',
        'metadata',
        'cargable_type',
        'cargable_id',
        'created_at',
    ];

    protected $casts = [
        'metadata'   => 'array',
        'created_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function ($model) {
            if (empty($model->created_at)) {
                $model->created_at = now();
            }
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function cargable(): MorphTo
    {
        return $this->morphTo();
    }
}
