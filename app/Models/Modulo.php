<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Modulo extends Model
{
    protected $table = 'modules'; // OJO: la tabla real se llama modules

    protected $fillable = [
        'nombre',
        'slug',
        'icono',
        'ruta',
        'parent_id',
        'orden',
        'activo'
    ];

    public function padre(): BelongsTo
    {
        return $this->belongsTo(Modulo::class, 'parent_id');
    }

    public function submodulos(): HasMany
    {
        return $this->hasMany(Modulo::class, 'parent_id')->orderBy('orden');
    }

    public function rolPermisos(): HasMany
    {
        return $this->hasMany(RolModuloPermiso::class, 'modulo_id');
    }

    public function scopeActivo($query)
    {
        return $query->where('activo', 1);
    }
}