<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MovimientoExtensionPlazo extends Model
{
    protected $table = 'movimiento_extensiones_plazo';
    public $timestamps = false;

    protected $fillable = [
        'movimiento_id',
        'dias_plazo_anterior',
        'dias_plazo_nuevo',
        'fecha_limite_anterior',
        'fecha_limite_nueva',
        'tipo_dias',
        'extendido_por',
        'estado_anterior',
        'motivo',
        'created_at',
    ];

    protected $casts = [
        'fecha_limite_anterior' => 'date',
        'fecha_limite_nueva'    => 'date',
        'created_at'            => 'datetime',
    ];

    public function movimiento(): BelongsTo
    {
        return $this->belongsTo(ExpedienteMovimiento::class, 'movimiento_id');
    }

    public function extendidoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'extendido_por');
    }
}
