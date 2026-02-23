<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Modulo extends Model
{
    protected $table = 'modulos';

    protected $fillable = [
        'nombre',
        'slug',
        'icono',
        'ruta',
        'parent_id',
        'orden',
        'activo'
    ];

    // Los permisos que pertenecen a este módulo (Ej: Crear, Ver, Editar)
    public function permisos(): HasMany
    {
        return $this->hasMany(Permiso::class, 'modulo_id');
    }

    // --- RECURSIVIDAD PARA MENÚS ---

    // Para obtener el módulo "padre" (si es un submenú)
    public function padre(): BelongsTo
    {
        return $this->belongsTo(Modulo::class, 'parent_id');
    }

    // Para obtener los "submódulos" (si es un menú principal)
    public function submodulos(): HasMany
    {
        return $this->hasMany(Modulo::class, 'parent_id')->orderBy('orden', 'asc');
    }

    public function scopeActivo($query)
    {
        return $query->where('activo', 1);
    }
}