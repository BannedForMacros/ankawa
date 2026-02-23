<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExpedienteMovimiento extends Model
{
    protected $table = 'expediente_movimientos';

    const UPDATED_AT = null; // Es un log inmutable, no se actualiza

    protected $fillable = [
        'expediente_id',
        'usuario_id',
        'etapa_origen_id',
        'actividad_origen_id',
        'etapa_destino_id',
        'actividad_destino_id',
        'accion',
        'observacion',
        'activo'
    ];

    public function expediente(): BelongsTo
    {
        return $this->belongsTo(Expediente::class, 'expediente_id');
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }

    public function etapaDestino(): BelongsTo
    {
        return $this->belongsTo(Etapa::class, 'etapa_destino_id');
    }

    public function actividadDestino(): BelongsTo
    {
        return $this->belongsTo(Actividad::class, 'actividad_destino_id');
    }
}