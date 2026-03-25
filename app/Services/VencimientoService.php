<?php

namespace App\Services;

use App\Models\ExpedienteMovimiento;
use App\Models\ExpedienteHistorial;

class VencimientoService
{
    /**
     * Marcar como vencidos todos los movimientos pendientes cuya fecha_limite ya pasó.
     * Pensado para ejecutarse desde un comando schedulado (daily).
     */
    public function procesarVencimientos(): int
    {
        $vencidos = ExpedienteMovimiento::where('estado', 'pendiente')
            ->where('activo', true)
            ->whereNotNull('fecha_limite')
            ->where('fecha_limite', '<', now()->toDateString())
            ->get();

        foreach ($vencidos as $movimiento) {
            $movimiento->update(['estado' => 'vencido']);

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
            ->where('estado', 'pendiente')
            ->where('activo', true)
            ->get();

        $porVencer = $pendientes->filter(fn($m) =>
            $m->fecha_limite && $m->fecha_limite->diffInDays(now()) <= 2 && $m->fecha_limite->isFuture()
        );

        $vencidos = ExpedienteMovimiento::where('expediente_id', $expedienteId)
            ->where('estado', 'vencido')
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
