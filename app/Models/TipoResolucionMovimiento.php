<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class TipoResolucionMovimiento extends Model
{
    protected $table = 'tipos_resolucion_movimiento';
    protected $fillable = ['nombre', 'descripcion', 'color', 'requiere_nota', 'activo'];
    protected $casts = ['requiere_nota' => 'boolean', 'activo' => 'boolean'];
}
