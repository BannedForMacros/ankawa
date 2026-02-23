<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Servicio extends Model
{
    protected $table = 'servicios';

    protected $fillable = [
        'nombre',
        'descripcion',
        'activo'
    ];

    public function etapas(): HasMany
    {
        return $this->hasMany(Etapa::class, 'servicio_id')->orderBy('orden');
    }

    public function scopeActivo($query)
    {
        return $query->where('activo', 1);
    }
}