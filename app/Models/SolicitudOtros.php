<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class SolicitudOtros extends Model
{
    protected $table = 'solicitudes_otros';

    protected $fillable = [
        'servicio_id',
        'tipo_documento_id',
        'nombre_remitente',
        'email_remitente',
        'descripcion',
        'observacion',
        'numero_cargo',
    ];

    public function servicio(): BelongsTo
    {
        return $this->belongsTo(Servicio::class);
    }

    public function tipoDocumento(): BelongsTo
    {
        return $this->belongsTo(TipoDocumento::class);
    }

    public function cargo(): MorphOne
    {
        return $this->morphOne(Cargo::class, 'cargable');
    }
}
