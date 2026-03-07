<?php

namespace App\Http\Controllers;

use App\Models\Expediente;
use App\Models\ExpedienteInstancia;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $user  = auth()->user();
        $rolId = $user->rol_id;

        // ── Expedientes donde el rol del usuario puede actuar ──
        // Usamos leftJoin con expediente_instancias para ordenar en DB sin N+1
        $pendientes = Expediente::query()
            ->with(['solicitud', 'servicio', 'etapaActual', 'actividadActual'])
            ->whereHas('actividadActual.roles', fn($q) => $q->where('roles.id', $rolId))
            ->where('expedientes.estado', '!=', 'cerrado')
            ->leftJoinSub(
                ExpedienteInstancia::select('expediente_id', 'fecha_vencimiento')
                    ->where('activa', true),
                'inst',
                'inst.expediente_id',
                '=',
                'expedientes.id'
            )
            ->orderByRaw('CASE WHEN inst.fecha_vencimiento IS NULL THEN 1 ELSE 0 END')
            ->orderBy('inst.fecha_vencimiento', 'asc')
            ->select('expedientes.*', 'inst.fecha_vencimiento as instancia_vencimiento')
            ->get()
            ->map(function ($exp) {
                $diasRestantes = null;
                $vencimiento   = $exp->instancia_vencimiento;

                if ($vencimiento) {
                    $diasRestantes = (int) now()->diffInDays($vencimiento, false);
                }

                $urgencia = 'sin_plazo';
                if ($diasRestantes !== null) {
                    if ($diasRestantes < 0)      $urgencia = 'vencido';
                    elseif ($diasRestantes <= 3)  $urgencia = 'proximo';
                    else                          $urgencia = 'ok';
                }

                return [
                    'id'                => $exp->id,
                    'numero_expediente' => $exp->numero_expediente
                        ?? $exp->solicitud?->numero_cargo
                        ?? 'EXP-' . $exp->id,
                    'servicio'          => $exp->servicio?->nombre,
                    'etapa'             => $exp->etapaActual?->nombre,
                    'actividad'         => $exp->actividadActual?->nombre,
                    'demandante'        => $exp->solicitud?->nombre_demandante,
                    'demandado'         => $exp->solicitud?->nombre_demandado,
                    'estado'            => $exp->estado,
                    'created_at'        => $exp->created_at->format('d/m/Y'),
                    'fecha_vencimiento' => $vencimiento
                        ? \Carbon\Carbon::parse($vencimiento)->format('d/m/Y')
                        : null,
                    'dias_restantes'    => $diasRestantes,
                    'urgencia'          => $urgencia,
                ];
            });

        // ── Stats globales ──
        $totalEnCurso = Expediente::where('estado', '!=', 'cerrado')->count();
        $misVencidos  = $pendientes->where('urgencia', 'vencido')->count();
        $misProximos  = $pendientes->where('urgencia', 'proximo')->count();

        return Inertia::render('Dashboard', [
            'pendientes' => $pendientes->values(),
            'stats'      => [
                'mi_cola'     => $pendientes->count(),
                'vencidos'    => $misVencidos,
                'proximos'    => $misProximos,
                'total_curso' => $totalEnCurso,
            ],
        ]);
    }
}
