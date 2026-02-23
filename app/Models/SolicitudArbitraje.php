<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphMany;

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

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }

    public function expediente(): HasOne
    {
        return $this->hasOne(Expediente::class, 'solicitud_id');
    }

    // RELACIÓN POLIMÓRFICA: Trae los documentos asociados a esta solicitud
    public function documentos(): MorphMany
    {
        return $this->morphMany(Documento::class, 'modelo', 'modelo_tipo', 'modelo_id');
    }

    public function scopeActivo($query)
    {
        return $query->where('activo', 1);
    }
}