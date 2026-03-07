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
                // Heredar codigo_servicio del año anterior para el mismo tipo+servicio
                $prevQuery = Correlativo::where('tipo_correlativo_id', $tipoCorrelativoId)
                    ->orderByDesc('anio');

                if ($servicioId !== null) {
                    $prevQuery->where('servicio_id', $servicioId);
                } else {
                    $prevQuery->whereNull('servicio_id');
                }

                $prevCorrelativo = $prevQuery->first();
                $codigoServicio  = $prevCorrelativo?->codigo_servicio ?? 'GEN';

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
     * Formatea el número de correlativo según el tipo.
     */
    private function formatear(Correlativo $correlativo, TipoCorrelativo $tipo): string
    {
        $numero       = str_pad($correlativo->ultimo_numero, 3, '0', STR_PAD_LEFT);
        $sufijoCentro = config('app.sufijo_centro', 'CARD ANKAWA');

        $partes = [
            $numero,
            $correlativo->anio,
            $correlativo->codigo_servicio,
        ];

        if ($tipo->aplica_sufijo_centro) {
            $partes[] = $sufijoCentro;
        }

        $cuerpo  = implode('-', $partes);
        $prefijo = trim($tipo->prefijo);

        return $prefijo ? "{$prefijo} {$cuerpo}" : $cuerpo;
    }
}
