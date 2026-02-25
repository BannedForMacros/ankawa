<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    // AÑADIMOS LOS CAMPOS DE IDENTIDAD
    protected $fillable = [
        'name',
        'email',
        'password',
        'rol_id',
        'tipo_persona',     // NUEVO
        'numero_documento', // NUEVO (DNI o RUC)
        'telefono',         // NUEVO
        'direccion',        // NUEVO
        'activo',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
        ];
    }

    public function rol(): BelongsTo
    {
        return $this->belongsTo(Rol::class, 'rol_id');
    }

    public function scopeActivo($query)
    {
        return $query->where('activo', 1);
    }

    public function puedeEn(string $moduloSlug, string $accion = 'ver'): bool
    {
        if (!$this->rol || $this->rol->activo == 0) {
            return false;
        }

        $permiso = RolModuloPermiso::whereHas('modulo', fn($q) => $q->where('slug', $moduloSlug))
            ->where('rol_id', $this->rol_id)
            ->first();

        return $permiso?->$accion ?? false;
    }
}