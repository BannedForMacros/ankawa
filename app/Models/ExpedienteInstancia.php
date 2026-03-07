<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExpedienteInstancia extends Model
{
    protected $table = 'expediente_instancias';

    protected $fillable = [
        'expediente_id',
        'actividad_id',
        'movimiento_id',
        'fecha_inicio',
        'fecha_vencimiento',
        'fecha_fin',
        'activa',
    ];

    protected $casts = [
        'activa'            => 'boolean',
        'fecha_inicio'      => 'datetime',
        'fecha_vencimiento' => 'datetime',
        'fecha_fin'         => 'datetime',
    ];

    public function expediente(): BelongsTo
    {
        return $this->belongsTo(Expediente::class, 'expediente_id');
    }

    public function actividad(): BelongsTo
    {
        return $this->belongsTo(Actividad::class, 'actividad_id');
    }

    public function movimiento(): BelongsTo
    {
        return $this->belongsTo(ExpedienteMovimiento::class, 'movimiento_id');
    }

    public function scopeActiva($query)
    {
        return $query->where('activa', true);
    }
}
