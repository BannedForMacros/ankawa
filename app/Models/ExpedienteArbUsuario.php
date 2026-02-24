<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExpedienteArbUsuario extends Model
{
    protected $table = 'expediente_arb_usuarios';

    protected $fillable = [
        'expediente_id', 'usuario_id', 'rol_en_expediente', 'activo',
    ];

    protected $casts = ['activo' => 'boolean'];

    public function expediente(): BelongsTo
    {
        return $this->belongsTo(ExpedienteArb::class, 'expediente_id');
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }

    public function scopeActivo($query)
    {
        return $query->where('activo', true);
    }
}