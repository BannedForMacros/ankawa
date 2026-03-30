<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Servicio extends Model
{
    protected $table = 'servicios';

    protected $fillable = [
        'nombre',
        'descripcion',
        'activo',
        'plazo_subsanacion_dias',
        'plazo_apersonamiento_dias',
    ];

    protected $casts = [
        'plazo_subsanacion_dias'    => 'integer',
        'plazo_apersonamiento_dias' => 'integer',
    ];

    public function etapas(): HasMany
    {
        return $this->hasMany(Etapa::class, 'servicio_id')->orderBy('orden');
    }

    public function tiposActor(): BelongsToMany
    {
        return $this->belongsToMany(
            TipoActorExpediente::class,
            'servicio_tipos_actor',
            'servicio_id',
            'tipo_actor_id'
        )->withPivot('es_automatico', 'rol_auto_slug', 'orden', 'activo')
         ->orderByPivot('orden');
    }

    public function tiposDocumento(): BelongsToMany
    {
        return $this->belongsToMany(
            TipoDocumento::class,
            'servicio_tipo_documento',
            'servicio_id',
            'tipo_documento_id'
        );
    }

    public function scopeActivo($query)
    {
        return $query->where('activo', 1);
    }
}