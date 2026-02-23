<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Permiso extends Model
{
    protected $table = 'permisos';

    protected $fillable = [
        'modulo_id',
        'nombre',
        'slug',
        'activo'
    ];

    // A qué módulo pertenece este permiso
    public function modulo(): BelongsTo
    {
        return $this->belongsTo(Modulo::class, 'modulo_id');
    }

    // Qué roles tienen asignado este permiso
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Rol::class, 'rol_permiso', 'permiso_id', 'rol_id')
                    ->withPivot('activo')
                    ->withTimestamps();
    }

    public function scopeActivo($query)
    {
        return $query->where('activo', 1);
    }
}