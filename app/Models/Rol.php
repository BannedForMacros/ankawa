<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Rol extends Model
{
    protected $table = 'roles';

    // Slugs estables del sistema (referencia desde código)
    public const SLUG_USUARIO          = 'usuario';
    public const SLUG_ADMINISTRADOR_TI = 'administrador_ti';

    protected $fillable = [
        'nombre', 'slug', 'descripcion', 'activo',
        'puede_designar_gestor', 'puede_ver_todos_expedientes',
    ];

    protected $casts = [
        'puede_designar_gestor'        => 'boolean',
        'puede_ver_todos_expedientes'  => 'boolean',
    ];

    public function usuarios(): HasMany
    {
        return $this->hasMany(User::class, 'rol_id');
    }

    public function moduloPermisos(): HasMany
    {
        return $this->hasMany(RolModuloPermiso::class, 'rol_id');
    }

    public function scopeActivo($query)
    {
        return $query->where('activo', 1);
    }
}