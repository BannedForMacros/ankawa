<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Rol extends Model
{
    protected $table = 'roles';

    protected $fillable = ['nombre', 'descripcion', 'activo'];

    // ── CONSTANTE DE ROL (Evita hardcodear números perdidos en los controladores) ──
    public const ROL_CLIENTE = 6;

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