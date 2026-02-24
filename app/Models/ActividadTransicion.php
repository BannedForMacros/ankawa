<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ActividadTransicion extends Model
{
    protected $table = 'actividad_transiciones';

    protected $fillable = [
        'actividad_origen_id',
        'catalogo_accion_id',
        'etiqueta_boton',
        'actividad_destino_id',
        'designa_tipo_actor_id',
        'requiere_documento',
        'permite_documento',
        'requiere_observacion',
        'orden',
        'activo'
    ];

    // --- RELACIONES ---

    public function actividadOrigen(): BelongsTo
    {
        return $this->belongsTo(Actividad::class, 'actividad_origen_id');
    }

    public function actividadDestino(): BelongsTo
    {
        return $this->belongsTo(Actividad::class, 'actividad_destino_id');
    }

    public function accionCatalogo(): BelongsTo
    {
        return $this->belongsTo(CatalogoAccion::class, 'catalogo_accion_id');
    }

    public function tipoActorDesignado(): BelongsTo
    {
        return $this->belongsTo(TipoActorExpediente::class, 'designa_tipo_actor_id');
    }

    public function notificaciones(): HasMany
    {
        return $this->hasMany(TransicionNotificacion::class, 'transicion_id');
    }
}