<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExpedienteHistorial extends Model
{
    protected $table = 'expediente_historial';

    public $timestamps = false;

    protected $fillable = [
        'expediente_id',
        'usuario_id',
        'tipo_evento',
        'descripcion',
        'datos_extra',
        'created_at',
    ];

    protected $casts = [
        'datos_extra' => 'array',
        'created_at'  => 'datetime',
    ];

    public function expediente(): BelongsTo
    {
        return $this->belongsTo(Expediente::class, 'expediente_id');
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }
}
