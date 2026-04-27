<?php

namespace App\Services;

use App\Models\Correlativo;
use App\Models\TipoCorrelativo;
use Illuminate\Support\Facades\DB;

class CorrelativoService
{
    /**
     * Genera y reserva el siguiente número correlativo para un servicio dado.
     *
     * Formato resultante: {prefijo} {NNN}-{YYYY}-{CODIGO_SERVICIO}[-{SUFIJO_CENTRO}]
     * Ejemplo: Exp. N° 001-2026-ARB-CARD ANKAWA
     *
     * Usa SELECT FOR UPDATE dentro de una transacción para garantizar
     * unicidad en escenarios de alta concurrencia.
     *
     * @param  int|null $servicioId          ID del servicio (null = correlativo global)
     * @param  int      $tipoCorrelativoId   ID del tipo de correlativo
     * @return string                        Número formateado
     */
    public function generarNumero(?int $servicioId, int $tipoCorrelativoId): string
    {
        return DB::transaction(function () use ($servicioId, $tipoCorrelativoId) {
            $anio = now()->year;
            $tipo = TipoCorrelativo::findOrFail($tipoCorrelativoId);

            // SELECT FOR UPDATE: bloquea la fila hasta que commit/rollback
            $query = Correlativo::where('tipo_correlativo_id', $tipoCorrelativoId)
                ->where('anio', $anio);

            if ($servicioId !== null) {
                $query->where('servicio_id', $servicioId);
            } else {
                $query->whereNull('servicio_id');
            }

            $correlativo = $query->lockForUpdate()->first();

            if (!$correlativo) {
                // 1) Heredar codigo_servicio del año anterior del MISMO tipo+servicio
                $prevQuery = Correlativo::where('tipo_correlativo_id', $tipoCorrelativoId)
                    ->orderByDesc('anio');

                if ($servicioId !== null) {
                    $prevQuery->where('servicio_id', $servicioId);
                } else {
                    $prevQuery->whereNull('servicio_id');
                }

                $prevCorrelativo = $prevQuery->first();

                // 2) Si nunca se ha emitido este tipo para este servicio (ej. primer CARGO de arbitraje),
                //    heredar el codigo_servicio de CUALQUIER correlativo previo del mismo servicio
                //    (porque "ARB", "JPRD", etc. son códigos del servicio, no del tipo).
                if (!$prevCorrelativo && $servicioId !== null) {
                    $prevCorrelativo = Correlativo::where('servicio_id', $servicioId)
                        ->orderByDesc('anio')
                        ->first();
                }

                $codigoServicio = $prevCorrelativo?->codigo_servicio ?? 'GEN';

                $correlativo = Correlativo::create([
                    'tipo_correlativo_id' => $tipoCorrelativoId,
                    'servicio_id'         => $servicioId,
                    'codigo_servicio'     => $codigoServicio,
                    'anio'                => $anio,
                    'ultimo_numero'       => 0,
                    'activo'              => true,
                ]);
            }

            $correlativo->increment('ultimo_numero');
            $correlativo->refresh();

            return $this->formatear($correlativo, $tipo);
        });
    }

    /**
     * Formatea el número de correlativo según el patrón configurado en `tipos_correlativo.formato`.
     *
     * Tokens soportados:
     *   {PREFIJO}    → tipo_correlativo.prefijo (ej. "Exp. N°", "CARGO")
     *   {ANIO}       → año del correlativo (ej. "2026")
     *   {SERVICIO}   → correlativo.codigo_servicio (ej. "ARB", "JPRD"); en correlativos
     *                  globales (servicio_id NULL) usa el código heredado o "GEN"
     *   {CENTRO}     → config('app.sufijo_centro', 'CARD ANKAWA')
     *   {NUMERO}     → ultimo_numero sin padding
     *   {NUMERO:N}   → ultimo_numero con padding a N dígitos (ej. {NUMERO:4} → "0001")
     *
     * Si el patrón no está definido, cae a un default conservador para no romper.
     */
    private function formatear(Correlativo $correlativo, TipoCorrelativo $tipo): string
    {
        $patron = $tipo->formato ?: '{PREFIJO} {NUMERO:3}-{ANIO}-{SERVICIO}';

        // Resolver primero {NUMERO:N} y {NUMERO} (con padding configurable).
        $resuelto = preg_replace_callback(
            '/\{NUMERO(?::(\d+))?\}/',
            function ($m) use ($correlativo) {
                $padding = isset($m[1]) ? (int) $m[1] : 0;
                return $padding > 0
                    ? str_pad((string) $correlativo->ultimo_numero, $padding, '0', STR_PAD_LEFT)
                    : (string) $correlativo->ultimo_numero;
            },
            $patron
        );

        return strtr($resuelto, [
            '{PREFIJO}'  => trim($tipo->prefijo ?? ''),
            '{ANIO}'     => (string) $correlativo->anio,
            '{SERVICIO}' => (string) $correlativo->codigo_servicio,
            '{CENTRO}'   => config('app.sufijo_centro', 'CARD ANKAWA'),
        ]);
    }
}
