<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MovimientoDocumento extends Model
{
    protected $table = 'movimiento_documentos';

    protected $fillable = [
        'movimiento_id',
        'tipo_documento_id',
        'subido_por',
        'nombre_original',
        'ruta_archivo',
        'peso_bytes',
        'momento',
        'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
    ];

    public function movimiento(): BelongsTo
    {
        return $this->belongsTo(ExpedienteMovimiento::class, 'movimiento_id');
    }

    public function tipoDocumento(): BelongsTo
    {
        return $this->belongsTo(TipoDocumento::class, 'tipo_documento_id');
    }

    public function subidoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'subido_por');
    }
}
