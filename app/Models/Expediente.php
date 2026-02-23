<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Expediente extends Model
{
    protected $table = 'expedientes';

    protected $fillable = [
        'solicitud_id',
        'servicio_id',
        'numero_expediente',
        'etapa_actual_id',
        'actividad_actual_id',
        'fecha_inicio',
        'activo'
    ];

    public function solicitud(): BelongsTo
    {
        return $this->belongsTo(SolicitudArbitraje::class, 'solicitud_id');
    }

    public function etapaActual(): BelongsTo
    {
        return $this->belongsTo(Etapa::class, 'etapa_actual_id');
    }

    public function actividadActual(): BelongsTo
    {
        return $this->belongsTo(Actividad::class, 'actividad_actual_id');
    }

    public function accesos(): HasMany
    {
        return $this->hasMany(ExpedienteUsuario::class, 'expediente_id');
    }

    public function movimientos(): HasMany
    {
        return $this->hasMany(ExpedienteMovimiento::class, 'expediente_id')->orderBy('created_at', 'desc');
    }

    // RELACIÓN POLIMÓRFICA: Trae los documentos agregados directamente al expediente
    public function documentos(): MorphMany
    {
        return $this->morphMany(Documento::class, 'modelo', 'modelo_tipo', 'modelo_id');
    }

    public function scopeActivo($query)
    {
        return $query->where('activo', 1);
    }
}