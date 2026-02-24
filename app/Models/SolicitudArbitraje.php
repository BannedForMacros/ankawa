<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\ExpedienteArbSubsanacion;
use App\Models\ExpedienteArb;

class SolicitudArbitraje extends Model
{
    protected $table = 'solicitudes_arbitraje';

    protected $fillable = [
        'servicio_id', 'numero_cargo', 'usuario_id',
        'tipo_persona', 'nombre_demandante', 'documento_demandante',
        'nombre_representante', 'documento_representante', 'domicilio_demandante',
        'email_demandante', 'telefono_demandante',
        'nombre_demandado', 'domicilio_demandado', 'email_demandado', 'telefono_demandado',
        'resumen_controversia', 'pretensiones', 'monto_involucrado',
        'solicita_designacion_director', 'nombre_arbitro_propuesto',
        'email_arbitro_propuesto', 'domicilio_arbitro_propuesto',
        'reglas_aplicables', 'estado', 'activo'
    ];

    public function servicio(): BelongsTo
    {
        return $this->belongsTo(Servicio::class, 'servicio_id');
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }

    public function documentos(): \Illuminate\Database\Eloquent\Relations\MorphMany
    {
        return $this->morphMany(Documento::class, 'modelo', 'modelo_tipo', 'modelo_id');
    }

    public function scopeActivo($query)
    {
        return $query->where('activo', 1);
    }

    public function expediente(): HasOne
    {
        return $this->hasOne(ExpedienteArb::class, 'solicitud_id');
    }

    public function subsanaciones(): HasMany
    {
        return $this->hasMany(ExpedienteArbSubsanacion::class, 'solicitud_id');
    }

    public function tieneSusanacionPendiente(): bool
    {
        return $this->subsanaciones()->where('estado', 'pendiente')->where('activo', true)->exists();
    }

    public function movimientos(): HasMany
    {
        return $this->hasMany(ExpedienteArbMovimiento::class, 'solicitud_id')
                    ->orderBy('created_at', 'asc');
    }
}