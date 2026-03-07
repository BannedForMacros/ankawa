<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ActividadRequisitoDocumento extends Model
{
    protected $table = 'actividad_requisitos_documento';

    protected $fillable = [
        'actividad_id',
        'tipo_documento_id',
        'nombre',
        'descripcion',
        'es_obligatorio',
        'orden',
        'activo',
    ];

    public function actividad(): BelongsTo
    {
        return $this->belongsTo(Actividad::class, 'actividad_id');
    }

    public function tipoDocumento(): BelongsTo
    {
        return $this->belongsTo(TipoDocumento::class, 'tipo_documento_id');
    }

    // Todos los archivos que se han subido para este slot en cualquier expediente
    public function documentosExpediente(): HasMany
    {
        return $this->hasMany(ExpedienteDocumentoRequisito::class, 'requisito_id');
    }

    public function scopeActivo($query)
    {
        return $query->where('activo', true);
    }
}
