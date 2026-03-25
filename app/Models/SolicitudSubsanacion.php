<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SolicitudSubsanacion extends Model
{
    protected $table = 'solicitud_subsanaciones';

    protected $fillable = [
        'solicitud_id',
        'registrado_por',
        'observacion',
        'plazo_dias',
        'fecha_limite',
        'estado',
        'respuesta',
        'subsanado_por',
        'fecha_subsanacion',
        'activo',
    ];

    protected $casts = [
        'fecha_limite'      => 'date',
        'fecha_subsanacion' => 'datetime',
        'activo'            => 'boolean',
    ];

    public function solicitud(): BelongsTo
    {
        return $this->belongsTo(SolicitudArbitraje::class, 'solicitud_id');
    }

    public function registradoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'registrado_por');
    }

    public function subsanadoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'subsanado_por');
    }
}
