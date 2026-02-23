<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'rol_id', // Añadido
        'activo', // Añadido
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    // --- RELACIONES ---

    public function rol(): BelongsTo
    {
        return $this->belongsTo(Rol::class, 'rol_id');
    }

    // --- SCOPES (Para buscar fácilmente usuarios activos) ---
    public function scopeActivo($query)
    {
        return $query->where('activo', 1);
    }

    // --- FUNCIONES INTELIGENTES PARA EL FRONTEND/MIDDLEWARE ---

    // Verifica si el usuario tiene un permiso específico (Ej: auth()->user()->tienePermiso('expedientes.crear'))
    public function tienePermiso($permisoSlug): bool
    {
        if (!$this->rol || $this->rol->activo == 0) {
            return false;
        }

        return $this->rol->permisos()
                    ->where('slug', $permisoSlug)
                    ->where('permisos.activo', 1)
                    ->exists();
    }
}