<?php

namespace App\Models;

use App\Services\CorrelativoService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Facades\DB;

class Cargo extends Model
{
    protected $table = 'cargos';

    protected $fillable = [
        'numero_cargo',
        'tipo_evento_cargo_id',
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

    public function tipoEvento(): BelongsTo
    {
        return $this->belongsTo(TipoEventoCargo::class, 'tipo_evento_cargo_id');
    }

    /**
     * Crea un cargo vinculado polimórficamente al modelo dado.
     *
     * El tipo de evento se busca por código en `tipos_evento_cargo`:
     *   - Si no existe → excepción (configuración inconsistente).
     *   - Si está inactivo o `genera_cargo=false` → retorna null
     *     (la operación se completa sin emitir cargo; configurable por admin).
     *
     * El número correlativo del cargo es POR SERVICIO (igual que EXP, CEDULA): cada servicio
     * tiene su propia secuencia (ARB-0001, JPRD-0001, OTROS-0001) y el código del servicio
     * puede aparecer en el formato vía el token {SERVICIO}.
     *
     * El servicio se infiere automáticamente del `$cargable`:
     *   - SolicitudArbitraje / SolicitudJPRD / SolicitudOtros → servicio_id directo.
     *   - ExpedienteMovimiento → vía $movimiento->expediente->servicio_id.
     *   - Si no se puede inferir y no se pasa $servicioId, se usa correlativo global.
     *
     * El formato del número (CARGO-2026-0001, CARGO-ARB-2026-0001, etc.) es configurable
     * desde Configuración → Nomenclatura de Correlativos.
     */
    public static function crear(
        string $codigoEvento,
        Model $cargable,
        ?int $userId,
        ?int $servicioId = null,
    ): ?static {
        $tipoEvento = TipoEventoCargo::where('codigo', $codigoEvento)->first();

        if (!$tipoEvento) {
            throw new \RuntimeException(
                "TipoEventoCargo con código '{$codigoEvento}' no existe en la base de datos. " .
                "Configúrelo en Configuración → Tipos de Cargo."
            );
        }

        if (!$tipoEvento->activo || !$tipoEvento->genera_cargo) {
            return null;
        }

        $tipoCorrelativoCargo = TipoCorrelativo::where('codigo', 'CARGO')->first();
        if (!$tipoCorrelativoCargo) {
            throw new \RuntimeException(
                "TipoCorrelativo con código 'CARGO' no existe. " .
                "Verifique Configuración → Nomenclatura de Correlativos."
            );
        }

        // Inferir servicio_id desde el cargable cuando el caller no lo pasa explícitamente.
        if ($servicioId === null) {
            if (isset($cargable->servicio_id)) {
                $servicioId = $cargable->servicio_id;
            } elseif ($cargable instanceof ExpedienteMovimiento) {
                $cargable->loadMissing('expediente');
                $servicioId = $cargable->expediente?->servicio_id;
            }
        }

        return DB::transaction(function () use ($tipoEvento, $tipoCorrelativoCargo, $cargable, $userId, $servicioId) {
            $numeroCargo = app(CorrelativoService::class)
                ->generarNumero($servicioId, $tipoCorrelativoCargo->id);

            return static::create([
                'numero_cargo'         => $numeroCargo,
                'tipo_evento_cargo_id' => $tipoEvento->id,
                'cargable_type'        => get_class($cargable),
                'cargable_id'          => $cargable->id,
                'generado_por_id'      => $userId,
            ]);
        });
    }
}
