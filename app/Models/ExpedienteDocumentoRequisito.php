<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExpedienteDocumentoRequisito extends Model
{
    protected $table = 'expediente_documentos_requisito';

    protected $fillable = [
        'expediente_id',
        'requisito_id',
        'movimiento_id',
        'nombre_original',
        'ruta_archivo',
        'peso_bytes',
        'activo',
    ];

    public function expediente(): BelongsTo
    {
        return $this->belongsTo(Expediente::class, 'expediente_id');
    }

    public function requisito(): BelongsTo
    {
        return $this->belongsTo(ActividadRequisitoDocumento::class, 'requisito_id');
    }

    public function movimiento(): BelongsTo
    {
        return $this->belongsTo(ExpedienteMovimiento::class, 'movimiento_id');
    }

    // Solo la versión activa (la más reciente, no reemplazada)
    public function scopeActivo($query)
    {
        return $query->where('activo', true);
    }
}
