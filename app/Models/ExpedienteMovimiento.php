<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExpedienteMovimiento extends Model
{
    protected $table = 'expediente_movimientos';

    protected $fillable = [
        'expediente_id',
        'etapa_id',
        'sub_etapa_id',
        'tipo_actor_responsable_id',
        'usuario_responsable_id',
        'creado_por',
        'instruccion',
        'observaciones',
        'respuesta',
        'dias_plazo',
        'fecha_limite',
        'fecha_respuesta',
        'respondido_por',
        'tipo_documento_requerido_id',
        'estado',
        'activo',
    ];

    protected $casts = [
        'fecha_limite'    => 'date',
        'fecha_respuesta' => 'datetime',
        'activo'          => 'boolean',
    ];

    public function expediente(): BelongsTo
    {
        return $this->belongsTo(Expediente::class, 'expediente_id');
    }

    public function etapa(): BelongsTo
    {
        return $this->belongsTo(Etapa::class, 'etapa_id');
    }

    public function subEtapa(): BelongsTo
    {
        return $this->belongsTo(SubEtapa::class, 'sub_etapa_id');
    }

    public function tipoActorResponsable(): BelongsTo
    {
        return $this->belongsTo(TipoActorExpediente::class, 'tipo_actor_responsable_id');
    }

    public function usuarioResponsable(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_responsable_id');
    }

    public function creadoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creado_por');
    }

    public function respondidoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'respondido_por');
    }

    public function documentos(): HasMany
    {
        return $this->hasMany(MovimientoDocumento::class, 'movimiento_id');
    }

    public function tipoDocumentoRequerido(): BelongsTo
    {
        return $this->belongsTo(TipoDocumento::class, 'tipo_documento_requerido_id');
    }

    public function notificaciones(): HasMany
    {
        return $this->hasMany(MovimientoNotificacion::class, 'movimiento_id');
    }

    public function scopePendientes($query)
    {
        return $query->where('estado', 'pendiente');
    }

    public function scopeActivo($query)
    {
        return $query->where('activo', true);
    }

    public function estaVencido(): bool
    {
        return $this->estado === 'pendiente'
            && $this->fecha_limite
            && $this->fecha_limite->isPast();
    }
}
