<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TipoDocumento extends Model
{
    protected $table = 'tipo_documentos';

    protected $fillable = [
        'nombre',
        'slug',
        'descripcion',
        'aplica_para',
        'activo',
    ];

    public function documentos(): HasMany
    {
        return $this->hasMany(Documento::class, 'tipo_documento_id');
    }

    public function transiciones(): HasMany
    {
        return $this->hasMany(ActividadTransicion::class, 'tipo_documento_id');
    }

    public function scopeActivo($query)
    {
        return $query->where('activo', true);
    }
}
