<?php

namespace App\Services;

use App\Models\Actividad;
use App\Models\Expediente;
use App\Models\ExpedienteInstancia;
use App\Models\ExpedienteMovimiento;
use App\Models\ExpedientePlazoOverride;
use Carbon\Carbon;

class PlazoService
{
    /**
     * Días de plazo efectivos para la actividad en el expediente dado.
     * Prioridad: override activo → días por defecto de la actividad.
     */
    public function obtenerDias(Expediente $expediente, Actividad $actividad): ?int
    {
        $override = ExpedientePlazoOverride::where('expediente_id', $expediente->id)
            ->where('actividad_id', $actividad->id)
            ->where('activo', 1)
            ->value('dias_plazo');

        return $override ?? $actividad->dias_plazo;
    }

    /**
     * Fecha en que el expediente entró a su actividad actual.
     * Fuente primaria: expediente_instancias.fecha_inicio.
     * Fallback: último movimiento → fecha creación del expediente.
     */
    public function fechaEntradaActividad(Expediente $expediente): Carbon
    {
        $instancia = ExpedienteInstancia::where('expediente_id', $expediente->id)
            ->where('actividad_id', $expediente->actividad_actual_id)
            ->where('activa', true)
            ->first();

        if ($instancia) {
            return Carbon::parse($instancia->fecha_inicio);
        }

        // Fallback para expedientes sin instancia registrada
        $movimiento = ExpedienteMovimiento::where('expediente_id', $expediente->id)
            ->where('actividad_destino_id', $expediente->actividad_actual_id)
            ->orderByDesc('fecha_movimiento')
            ->first();

        return Carbon::parse($movimiento?->fecha_movimiento ?? $expediente->created_at);
    }

    /**
     * Fecha de vencimiento de la actividad actual.
     * Fuente primaria: instancia.fecha_vencimiento (pre-calculada).
     * Fallback: calcula desde fecha_entrada + dias_plazo.
     */
    public function calcularVencimiento(Expediente $expediente): ?Carbon
    {
        $instancia = ExpedienteInstancia::where('expediente_id', $expediente->id)
            ->where('actividad_id', $expediente->actividad_actual_id)
            ->where('activa', true)
            ->first();

        if ($instancia?->fecha_vencimiento) {
            return Carbon::parse($instancia->fecha_vencimiento);
        }

        // Fallback: calcular dinámicamente
        $actividad = $expediente->actividadActual;
        if (!$actividad) {
            return null;
        }

        $dias = $this->obtenerDias($expediente, $actividad);
        if (!$dias) {
            return null;
        }

        return $this->fechaEntradaActividad($expediente)->addDays($dias);
    }

    /**
     * ¿La actividad actual del expediente ha vencido?
     */
    public function estaVencido(Expediente $expediente): bool
    {
        $vencimiento = $this->calcularVencimiento($expediente);

        return $vencimiento !== null && $vencimiento->isPast();
    }

    /**
     * Días restantes (negativos si ya venció). Null si no hay plazo configurado.
     */
    public function diasRestantes(Expediente $expediente): ?int
    {
        $vencimiento = $this->calcularVencimiento($expediente);
        if (!$vencimiento) {
            return null;
        }

        return (int) now()->diffInDays($vencimiento, false);
    }

    /**
     * Crea la instancia para una actividad destino al ejecutar un movimiento.
     * Cierra la instancia activa previa del expediente.
     */
    public function avanzarInstancia(Expediente $expediente, Actividad $actividadDestino, int $movimientoId): ExpedienteInstancia
    {
        // Cerrar instancia activa anterior
        ExpedienteInstancia::where('expediente_id', $expediente->id)
            ->where('activa', true)
            ->update(['activa' => false, 'fecha_fin' => now()]);

        $dias             = $this->obtenerDias($expediente, $actividadDestino);
        $fechaVencimiento = $dias ? now()->addDays($dias) : null;

        return ExpedienteInstancia::create([
            'expediente_id'     => $expediente->id,
            'actividad_id'      => $actividadDestino->id,
            'movimiento_id'     => $movimientoId,
            'fecha_inicio'      => now(),
            'fecha_vencimiento' => $fechaVencimiento,
            'activa'            => true,
        ]);
    }

    /**
     * Recalcula y actualiza fecha_vencimiento de la instancia activa.
     * Llamado cuando se establece o elimina un override de plazo.
     */
    public function sincronizarInstancia(Expediente $expediente): void
    {
        $instancia = ExpedienteInstancia::where('expediente_id', $expediente->id)
            ->where('activa', true)
            ->first();

        if (!$instancia) {
            return;
        }

        $actividad = $expediente->actividadActual;
        $dias      = $actividad ? $this->obtenerDias($expediente, $actividad) : null;

        $instancia->update([
            'fecha_vencimiento' => $dias
                ? Carbon::parse($instancia->fecha_inicio)->addDays($dias)
                : null,
        ]);
    }

    /**
     * Resumen completo del plazo para el frontend.
     */
    public function resumen(Expediente $expediente): array
    {
        $actividad   = $expediente->actividadActual;
        $instancia   = ExpedienteInstancia::where('expediente_id', $expediente->id)
            ->where('activa', true)
            ->first();
        $vencimiento = $this->calcularVencimiento($expediente);
        $override    = $actividad
            ? ExpedientePlazoOverride::where('expediente_id', $expediente->id)
                ->where('actividad_id', $actividad->id)
                ->where('activo', 1)
                ->first()
            : null;

        return [
            'dias'            => $actividad ? $this->obtenerDias($expediente, $actividad) : null,
            'dias_default'    => $actividad?->dias_plazo,
            'vencimiento'     => $vencimiento?->toDateTimeString(),
            'dias_restantes'  => $this->diasRestantes($expediente),
            'vencido'         => $this->estaVencido($expediente),
            'tiene_override'  => $override !== null,
            'override_dias'   => $override?->dias_plazo,
            'override_motivo' => $override?->motivo,
            'fecha_inicio'    => $instancia?->fecha_inicio?->toDateTimeString(),
        ];
    }
}
