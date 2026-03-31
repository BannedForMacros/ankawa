<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class TipoDocumento extends Model
{
    protected $table = 'tipo_documentos';

    protected $fillable = [
        'nombre',
        'slug',
        'descripcion',
        'aplica_para',
        'formatos_permitidos',
        'tamanio_maximo_mb',
        'activo',
    ];

    public function documentos(): HasMany
    {
        return $this->hasMany(Documento::class, 'tipo_documento_id');
    }

    public function servicios(): BelongsToMany
    {
        return $this->belongsToMany(
            Servicio::class,
            'servicio_tipo_documento',
            'tipo_documento_id',
            'servicio_id'
        )->withPivot('es_para_solicitud');
    }

    public function tiposActor(): BelongsToMany
    {
        return $this->belongsToMany(
            TipoActorExpediente::class,
            'tipo_actor_tipo_documento',
            'tipo_documento_id',
            'tipo_actor_id'
        )->withPivot('puede_subir', 'puede_ver');
    }

    public function scopeActivo($query)
    {
        return $query->where('activo', true);
    }
}
