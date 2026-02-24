<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExpedienteArbArbitro extends Model
{
    protected $table = 'expediente_arb_arbitros';

    protected $fillable = [
        'expediente_id', 'usuario_id',
        'nombre_arbitro', 'email_arbitro',
        'tipo_designacion', 'designado_por',
        'fecha_designacion', 'estado_aceptacion',
        'fecha_respuesta', 'motivo_rechazo', 'activo',
    ];

    protected $casts = [
        'fecha_designacion' => 'date',
        'fecha_respuesta'   => 'datetime',
        'activo'            => 'boolean',
    ];

    public function expediente(): BelongsTo
    {
        return $this->belongsTo(ExpedienteArb::class, 'expediente_id');
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }

    public function designadoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'designado_por');
    }

    public function haAceptado(): bool
    {
        return $this->estado_aceptacion === 'aceptado';
    }

    public function scopeActivo($query)
    {
        return $query->where('activo', true);
    }

    public function scopeAceptados($query)
    {
        return $query->where('estado_aceptacion', 'aceptado');
    }
}