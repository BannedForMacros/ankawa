<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Facades\DB;

class Cargo extends Model
{
    protected $table = 'cargos';

    protected $fillable = [
        'numero_cargo',
        'seq',
        'tipo',
        'cargable_type',
        'cargable_id',
        'generado_por_id',
    ];

    public function cargable(): MorphTo
    {
        return $this->morphTo();
    }

    public function generadoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'generado_por_id');
    }

    /**
     * Crea un registro de cargo vinculado polimórficamente al modelo dado.
     *
     * Obtiene el nextval UNA SOLA VEZ y lo pasa explícitamente a ambos campos
     * (numero_cargo y seq) para evitar que el DEFAULT de la columna seq llame
     * a nextval() una segunda vez, lo que generaba saltos en la numeración.
     */
    public static function crear(string $tipo, Model $cargable, ?int $userId): static
    {
        return DB::transaction(function () use ($tipo, $cargable, $userId) {
            $seq = DB::selectOne("SELECT nextval('cargo_seq') AS val")->val;
            return static::create([
                'numero_cargo'    => 'CARGO-' . now()->year . '-' . str_pad($seq, 4, '0', STR_PAD_LEFT),
                'seq'             => $seq,
                'tipo'            => $tipo,
                'cargable_type'   => get_class($cargable),
                'cargable_id'     => $cargable->id,
                'generado_por_id' => $userId,
            ]);
        });
    }
}
