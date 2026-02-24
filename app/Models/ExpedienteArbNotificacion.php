<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExpedienteArbNotificacion extends Model
{
    protected $table = 'expediente_arb_notificaciones';

    const UPDATED_AT = null; // Log inmutable

    protected $fillable = [
        'expediente_id', 'solicitud_id', 'actividad_id',
        'enviado_por', 'destinatario_nombre', 'destinatario_email',
        'asunto', 'tipo', 'estado_envio', 'error_detalle', 'activo',
    ];

    protected $casts = ['activo' => 'boolean'];

    public function expediente(): BelongsTo
    {
        return $this->belongsTo(ExpedienteArb::class, 'expediente_id');
    }

    public function solicitud(): BelongsTo
    {
        return $this->belongsTo(SolicitudArbitraje::class, 'solicitud_id');
    }

    public function actividad(): BelongsTo
    {
        return $this->belongsTo(Actividad::class, 'actividad_id');
    }

    public function enviadoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'enviado_por');
    }

    public function scopeActivo($query)
    {
        return $query->where('activo', true);
    }

    public function scopeFallidos($query)
    {
        return $query->where('estado_envio', 'fallido');
    }
}