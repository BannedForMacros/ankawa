<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Rol extends Model
{
    protected $table = 'roles'; // Forzamos el nombre de la tabla en español

    protected $fillable = [
        'nombre',
        'descripcion',
        'activo'
    ];

    // Usuarios que tienen este rol
    public function usuarios(): HasMany
    {
        return $this->hasMany(User::class, 'rol_id');
    }

    // Relación Muchos a Muchos con la tabla pivote 'rol_permiso'
    public function permisos(): BelongsToMany
    {
        return $this->belongsToMany(Permiso::class, 'rol_permiso', 'rol_id', 'permiso_id')
                    ->withPivot('activo') // Trae también la columna activo de la tabla pivote
                    ->withTimestamps();
    }

    // Scope para traer solo roles activos
    public function scopeActivo($query)
    {
        return $query->where('activo', 1);
    }
}