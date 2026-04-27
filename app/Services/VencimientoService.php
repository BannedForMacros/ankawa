<?php

namespace App\Services;

use App\Models\ExpedienteMovimiento;
use App\Models\ExpedienteHistorial;
use App\Models\MovimientoResponsable;

class VencimientoService
{
    /**
     * Marcar como vencidos todos los movimientos pendientes cuya fecha_limite ya pasó.
     * Pensado para ejecutarse desde un comando schedulado (daily).
     */
    public function procesarVencimientos(): int
    {
        // Vencer también las filas pivot individuales (responsables con plazo propio).
        // Esto cubre el caso en que un responsable tiene fecha_limite distinta a la del padre.
        MovimientoResponsable::where('estado', ExpedienteMovimiento::ESTADO_PENDIENTE)
            ->whereNotNull('fecha_limite')
            ->where('fecha_limite', '<', now()->toDateString())
            ->update(['estado' => ExpedienteMovimiento::ESTADO_VENCIDO]);

        $vencidos = ExpedienteMovimiento::where('estado', ExpedienteMovimiento::ESTADO_PENDIENTE)
            ->where('activo', true)
            ->whereNotNull('fecha_limite')
            ->where('fecha_limite', '<', now()->toDateString())
            ->get();

        foreach ($vencidos as $movimiento) {
            $movimiento->update(['estado' => ExpedienteMovimiento::ESTADO_VENCIDO]);

            ExpedienteHistorial::create([
                'expediente_id' => $movimiento->expediente_id,
                'usuario_id'    => $movimiento->creado_por,
                'tipo_evento'   => 'movimiento_vencido',
                'descripcion'   => "Movimiento vencido por plazo: {$movimiento->instruccion}",
                'datos_extra'   => [
                    'movimiento_id' => $movimiento->id,
                    'fecha_limite'  => $movimiento->fecha_limite->toDateString(),
                ],
                'created_at'    => now(),
            ]);
        }

        return $vencidos->count();
    }

    /**
     * Resumen de plazos para un expediente.
     */
    public function resumen(int $expedienteId): array
    {
        $pendientes = ExpedienteMovimiento::where('expediente_id', $expedienteId)
            ->where('estado', ExpedienteMovimiento::ESTADO_PENDIENTE)
            ->where('activo', true)
            ->get();

        $porVencer = $pendientes->filter(fn($m) =>
            $m->fecha_limite && $m->fecha_limite->diffInDays(now()) <= 2 && $m->fecha_limite->isFuture()
        );

        $vencidos = ExpedienteMovimiento::where('expediente_id', $expedienteId)
            ->where('estado', ExpedienteMovimiento::ESTADO_VENCIDO)
            ->where('activo', true)
            ->count();

        return [
            'pendientes'       => $pendientes->count(),
            'por_vencer'       => $porVencer->count(),
            'vencidos'         => $vencidos,
            'proximo_vencer'   => $pendientes->whereNotNull('fecha_limite')
                                    ->sortBy('fecha_limite')
                                    ->first()?->fecha_limite?->format('d/m/Y'),
        ];
    }
}
