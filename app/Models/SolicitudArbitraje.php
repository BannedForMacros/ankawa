<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphOne;
class SolicitudArbitraje extends Model
{
    protected $table = 'solicitudes_arbitraje';

    protected $casts = [
        'empresas_consorcio_demandante' => 'array',
        'empresas_consorcio_demandado'  => 'array',
    ];

    protected $fillable = [
        'servicio_id', 'numero_cargo', 'usuario_id',
        'tipo_persona', 'tipo_documento', 'nombre_demandante', 'documento_demandante',
        'nombre_representante', 'documento_representante', 'domicilio_demandante',
        'email_demandante', 'telefono_demandante',
        'tipo_persona_demandado', 'tipo_documento_demandado',
        'nombre_demandado', 'documento_demandado', 'domicilio_demandado', 'email_demandado', 'telefono_demandado',
        'resumen_controversia', 'pretensiones', 'monto_involucrado',
        'monto_controversias', 'suma_monto_pretensiones_determinadas', 'pretensiones_indeterminadas',
        'solicita_designacion_director', 'solicita_designacion_director_demandado', 'nombre_arbitro_propuesto',
        'documento_arbitro_propuesto', 'email_arbitro_propuesto', 'domicilio_arbitro_propuesto',
        'reglas_aplicables', 'estado', 'activo',
        'resultado_revision', 'fecha_revision', 'revisado_por', 'motivo_no_conformidad',
        'subtipo_juridico_demandante', 'subtipo_juridico_demandado',
        'empresas_consorcio_demandante', 'empresas_consorcio_demandado',
        'nombre_representante_demandado', 'documento_representante_demandado',
        'acepta_reglamento_card', 'precision_reglas', 'tiene_medida_cautelar',
        'tipo_documento_id',
        'factura_ruc', 'factura_razon_social',
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

    public function expediente(): MorphOne
    {
        return $this->morphOne(Expediente::class, 'solicitud', 'solicitud_type', 'solicitud_id');
    }

    public function subsanaciones(): HasMany
    {
        return $this->hasMany(SolicitudSubsanacion::class, 'solicitud_id');
    }

    public function tieneSubsanacionPendiente(): bool
    {
        return $this->subsanaciones()->where('estado', 'pendiente')->where('activo', true)->exists();
    }
}