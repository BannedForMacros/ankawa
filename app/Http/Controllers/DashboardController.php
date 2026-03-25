<?php

namespace App\Http\Controllers;

use App\Models\Expediente;
use App\Models\ExpedienteMovimiento;
use App\Models\SolicitudArbitraje;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $puedeVerTodos = $user->rol?->puede_ver_todos_expedientes ?? false;

        // Contadores generales
        if ($puedeVerTodos) {
            $totalExpedientes    = Expediente::where('estado', 'activo')->count();
            $solicitudesPendientes = SolicitudArbitraje::where('estado', 'pendiente')
                ->whereDoesntHave('expediente')->count();
        } else {
            $totalExpedientes = Expediente::where('estado', 'activo')
                ->whereHas('actores', fn($q) => $q->where('usuario_id', $user->id)->where('activo', 1))
                ->count();
            $solicitudesPendientes = 0;
        }

        // Movimientos pendientes del usuario
        $misPendientes = ExpedienteMovimiento::where('usuario_responsable_id', $user->id)
            ->where('estado', 'pendiente')
            ->where('activo', true)
            ->count();

        // Movimientos por vencer (próximos 3 días)
        $porVencer = ExpedienteMovimiento::where('usuario_responsable_id', $user->id)
            ->where('estado', 'pendiente')
            ->where('activo', true)
            ->whereNotNull('fecha_limite')
            ->whereBetween('fecha_limite', [now()->toDateString(), now()->addDays(3)->toDateString()])
            ->count();

        return Inertia::render('Dashboard', [
            'stats' => [
                'expedientes_activos'     => $totalExpedientes,
                'solicitudes_pendientes'  => $solicitudesPendientes,
                'mis_pendientes'          => $misPendientes,
                'por_vencer'              => $porVencer,
            ],
        ]);
    }
}
