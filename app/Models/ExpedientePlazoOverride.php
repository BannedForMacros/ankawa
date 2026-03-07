<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExpedientePlazoOverride extends Model
{
    protected $table = 'expediente_plazos_override';

    protected $fillable = [
        'expediente_id',
        'actividad_id',
        'dias_plazo',
        'motivo',
        'usuario_id',
        'activo',
    ];

    public function expediente(): BelongsTo
    {
        return $this->belongsTo(Expediente::class, 'expediente_id');
    }

    public function actividad(): BelongsTo
    {
        return $this->belongsTo(Actividad::class, 'actividad_id');
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }
}
