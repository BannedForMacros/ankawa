<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class SolicitudJPRD extends Model
{
    protected $table = 'solicitudes_jprd';

    protected $fillable = [
        'numero_cargo',
        'servicio_id',
        'rol_solicitante',
        'nombre_solicitante',
        'tipo_documento_solicitante',
        'documento_solicitante',
        'emails_solicitante',
        'nombre_entidad',
        'ruc_entidad',
        'telefono_entidad',
        'emails_entidad',
        'tipo_persona_entidad',
        'subtipo_entidad',
        'representante_entidad_dni',
        'representante_entidad_nombre',
        'nombre_contratista',
        'ruc_contratista',
        'telefono_contratista',
        'emails_contratista',
        'tipo_persona_contratista',
        'subtipo_contratista',
        'representante_contratista_dni',
        'representante_contratista_nombre',
        'empresas_entidad',
        'empresas_contratista',
        'observacion',
        'tiene_peticion_previa',
        'acepta_reglamento_card',
        'estado',
        'expediente_id',
        'usuario_id',
        'tipo_documento_id',
    ];

    protected $casts = [
        'emails_solicitante'     => 'array',
        'emails_entidad'         => 'array',
        'emails_contratista'     => 'array',
        'empresas_entidad'       => 'array',
        'empresas_contratista'   => 'array',
        'tiene_peticion_previa'  => 'boolean',
        'acepta_reglamento_card' => 'boolean',
    ];

    public function servicio()
    {
        return $this->belongsTo(Servicio::class);
    }

    public function expediente(): MorphOne
    {
        return $this->morphOne(Expediente::class, 'solicitud', 'solicitud_type', 'solicitud_id');
    }

    public function documentos()
    {
        return $this->morphMany(Documento::class, 'modelo');
    }
}
