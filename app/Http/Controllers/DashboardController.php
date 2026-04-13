<?php

namespace App\Http\Controllers;

use App\Models\Expediente;
use App\Models\ExpedienteActor;
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

        $misActorIds = ExpedienteActor::where('usuario_id', $user->id)->pluck('id');

        $esResponsableClause = function ($q) use ($user, $misActorIds) {
            $q->where('usuario_responsable_id', $user->id);
            if ($misActorIds->isNotEmpty()) {
                $q->orWhereHas('responsables', fn($q2) =>
                    $q2->whereIn('expediente_actor_id', $misActorIds)
                       ->where('estado', 'pendiente')
                );
            }
        };

        $misPendientes = ExpedienteMovimiento::where('estado', 'pendiente')
            ->where('activo', true)
            ->where($esResponsableClause)
            ->count();

        $porVencer = ExpedienteMovimiento::where('estado', 'pendiente')
            ->where('activo', true)
            ->whereNotNull('fecha_limite')
            ->whereBetween('fecha_limite', [now()->toDateString(), now()->addDays(3)->toDateString()])
            ->where($esResponsableClause)
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
