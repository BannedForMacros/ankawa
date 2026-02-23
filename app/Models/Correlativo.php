<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Correlativo extends Model
{
    protected $table = 'correlativos';

    // ← Esta línea soluciona el error
    public $timestamps = false;

    protected $fillable = [
        'tipo',
        'anio',
        'ultimo_numero',
        'activo',
    ];

    public function scopeActivo($query)
    {
        return $query->where('activo', 1);
    }
}