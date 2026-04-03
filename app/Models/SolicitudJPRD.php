<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SolicitudJPRD extends Model
{
    protected $table = 'solicitudes_jprd';

    protected $fillable = [
        'numero_cargo',
        'servicio_id',
        'nombre_solicitante',
        'tipo_documento_solicitante',
        'documento_solicitante',
        'emails_solicitante',
        'nombre_entidad',
        'ruc_entidad',
        'telefono_entidad',
        'emails_entidad',
        'nombre_contratista',
        'ruc_contratista',
        'telefono_contratista',
        'emails_contratista',
        'descripcion',
        'estado',
        'expediente_id',
        'usuario_id',
    ];

    protected $casts = [
        'emails_solicitante'  => 'array',
        'emails_entidad'      => 'array',
        'emails_contratista'  => 'array',
    ];

    public function servicio()
    {
        return $this->belongsTo(Servicio::class);
    }

    public function expediente()
    {
        return $this->belongsTo(Expediente::class);
    }

    public function documentos()
    {
        return $this->morphMany(Documento::class, 'modelo');
    }
}
