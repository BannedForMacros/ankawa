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
     * Genera el siguiente número de cargo usando la sequence de PostgreSQL.
     * La sequence es global (no por servicio): CARGO-2026-0001, 0002, 0003...
     */
    public static function generarNumero(): string
    {
        $seq = DB::selectOne("SELECT nextval('cargo_seq') AS val")->val;
        return 'CARGO-' . now()->year . '-' . str_pad($seq, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Crea un registro de cargo vinculado polimórficamente al modelo dado.
     */
    public static function crear(string $tipo, Model $cargable, ?int $userId): static
    {
        return DB::transaction(function () use ($tipo, $cargable, $userId) {
            return static::create([
                'numero_cargo'    => static::generarNumero(),
                'tipo'            => $tipo,
                'cargable_type'   => get_class($cargable),
                'cargable_id'     => $cargable->id,
                'generado_por_id' => $userId,
            ]);
        });
    }
}
