<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Documento extends Model
{
    protected $table = 'documentos';

    // Laravel gestiona created_at y updated_at automáticamente, no van en el fillable
    protected $fillable = [
        'modelo_tipo',
        'modelo_id',
        'etapa_id',
        'tipo_documento',
        'ruta_archivo',
        'nombre_original',
        'peso_bytes',
        'activo'
    ];

    // Magia Polimórfica: Permite que el documento pertenezca a una Solicitud o a un Expediente
    public function modelo(): MorphTo
    {
        return $this->morphTo(__FUNCTION__, 'modelo_tipo', 'modelo_id');
    }

    // Para agrupar los documentos en la vista por carpetas
    public function etapa(): BelongsTo
    {
        return $this->belongsTo(Etapa::class, 'etapa_id');
    }

    public function scopeActivo($query)
    {
        return $query->where('activo', 1);
    }
}