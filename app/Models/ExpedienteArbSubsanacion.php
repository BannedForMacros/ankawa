<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExpedienteArbSubsanacion extends Model
{
    protected $table = 'expediente_arb_subsanaciones';

    protected $fillable = [
        'expediente_id',
        'solicitud_id',
        'actividad_id',
        'registrado_por',
        'observacion',
        'plazo_dias',
        'fecha_limite',
        'estado',
        'subsanado_por',
        'fecha_subsanacion',
        'respuesta',
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
