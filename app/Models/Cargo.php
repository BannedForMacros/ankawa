<?php

namespace App\Models;

use App\Services\CorrelativoService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Http\Request;
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
        'ip_origen',
        'user_agent_origen',
        'email_solicitante',
        'dni_solicitante',
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
     * El número correlativo del cargo es GLOBAL (un solo contador para todos los servicios).
     * El parámetro $servicioId existe por compatibilidad histórica pero se ignora — internamente
     * se fuerza a NULL para usar la fila global del correlativo (codigo_servicio='GEN').
     *
     * Formato resultante: CARGO-GEN-2026-001 (configurable en Configuración → Nomenclatura).
     */
    public static function crear(
        string $codigoEvento,
        Model $cargable,
        ?int $userId,
        ?int $servicioId = null,
        ?Request $request = null,
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

        // CARGO es un correlativo GLOBAL (único contador para todos los servicios).
        // Forzamos servicio_id = NULL para que CorrelativoService use la fila global
        // (codigo_servicio='GEN') y se emitan números del tipo "CARGO-GEN-2026-001"
        // sin importar el servicio del cargable. El parámetro $servicioId se ignora.
        $servicioId = null;

        // Metadata de trazabilidad: IP, UA, email/dni de la sesión del portal si aplica
        $ipOrigen     = $request?->ip();
        $uaOrigen     = $request?->userAgent();
        $emailSolic   = session('portal_email');
        $dniSolic     = session('portal_dni');

        return DB::transaction(function () use ($tipoEvento, $tipoCorrelativoCargo, $cargable, $userId, $servicioId, $ipOrigen, $uaOrigen, $emailSolic, $dniSolic) {
            $numeroCargo = app(CorrelativoService::class)
                ->generarNumero($servicioId, $tipoCorrelativoCargo->id);

            return static::create([
                'numero_cargo'         => $numeroCargo,
                'tipo_evento_cargo_id' => $tipoEvento->id,
                'cargable_type'        => get_class($cargable),
                'cargable_id'          => $cargable->id,
                'generado_por_id'      => $userId,
                'ip_origen'            => $ipOrigen,
                'user_agent_origen'    => $uaOrigen,
                'email_solicitante'    => $emailSolic,
                'dni_solicitante'      => $dniSolic,
            ]);
        });
    }
}
