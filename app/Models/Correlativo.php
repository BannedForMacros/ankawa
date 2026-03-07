<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Correlativo extends Model
{
    protected $table = 'correlativos';

    public $timestamps = false;

    protected $fillable = [
        'tipo_correlativo_id',
        'servicio_id',
        'codigo_servicio',
        'anio',
        'ultimo_numero',
        'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
    ];

    public function tipoCorrelativo(): BelongsTo
    {
        return $this->belongsTo(TipoCorrelativo::class, 'tipo_correlativo_id');
    }

    public function servicio(): BelongsTo
    {
        return $this->belongsTo(Servicio::class, 'servicio_id');
    }

    public function scopeActivo($query)
    {
        return $query->where('activo', true);
    }
}
