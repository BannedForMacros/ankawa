<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExpedienteMovimiento extends Model
{
    protected $table = 'expediente_movimientos';

    public $timestamps = false; // Como usamos CURRENT_TIMESTAMP en pgsql para fecha_movimiento
    protected $guarded = [];
    protected $fillable = [
        'expediente_id',
        'actividad_origen_id',
        'transicion_id',
        'actividad_destino_id',
        'usuario_id',
        'observaciones',
        'fecha_movimiento'
    ];

    public function expediente(): BelongsTo
    {
        return $this->belongsTo(Expediente::class, 'expediente_id');
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }

    public function actividadDestino(): BelongsTo
    {
        return $this->belongsTo(Actividad::class, 'actividad_destino_id');
    }

    public function actividadOrigen(): BelongsTo
    {
        return $this->belongsTo(Actividad::class, 'actividad_origen_id');
    }

    // Documentos adjuntos al movimiento (anexos sueltos)
    public function documentos(): HasMany
    {
        return $this->hasMany(Documento::class, 'modelo_id')
                    ->where('modelo_tipo', self::class)
                    ->where('activo', 1);
    }

    // Documentos de slot (requisitos) subidos en este movimiento
    public function requisitosDocumento(): HasMany
    {
        return $this->hasMany(ExpedienteDocumentoRequisito::class, 'movimiento_id');
    }
}