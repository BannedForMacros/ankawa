<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RolModuloPermiso extends Model
{
    protected $table = 'rol_modulo_permiso';

    protected $fillable = [
        'rol_id',
        'modulo_id',
        'ver',
        'crear',
        'editar',
        'eliminar'
    ];

    protected $casts = [
        'ver'      => 'boolean',
        'crear'    => 'boolean',
        'editar'   => 'boolean',
        'eliminar' => 'boolean',
    ];

    public function rol(): BelongsTo
    {
        return $this->belongsTo(Rol::class, 'rol_id');
    }

    public function modulo(): BelongsTo
    {
        return $this->belongsTo(Modulo::class, 'modulo_id');
    }
}