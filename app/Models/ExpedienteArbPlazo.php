<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExpedienteArbPlazo extends Model
{
    protected $table = 'expediente_arb_plazos';

    protected $fillable = [
        'expediente_id', 'actividad_id',
        'fecha_inicio', 'fecha_vencimiento', 'dias_plazo',
        'estado', 'fecha_completado',
        'extendido_por', 'motivo_extension', 'activo',
    ];

    protected $casts = [
        'fecha_inicio'      => 'date',
        'fecha_vencimiento' => 'date',
        'fecha_completado'  => 'datetime',
        'activo'            => 'boolean',
    ];

    public function expediente(): BelongsTo
    {
        return $this->belongsTo(ExpedienteArb::class, 'expediente_id');
    }

    public function actividad(): BelongsTo
    {
        return $this->belongsTo(Actividad::class, 'actividad_id');
    }

    public function extendidoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'extendido_por');
    }

    public function estaVencido(): bool
    {
        return $this->estado === 'pendiente'
            && $this->fecha_vencimiento->isPast();
    }

    public function diasRestantes(): int
    {
        return max(0, (int) now()->diffInDays($this->fecha_vencimiento, false));
    }

    public function scopeActivo($query)
    {
        return $query->where('activo', true);
    }

    public function scopeVencidos($query)
    {
        return $query->where('estado', 'pendiente')
                     ->where('fecha_vencimiento', '<', now()->toDateString());
    }
}