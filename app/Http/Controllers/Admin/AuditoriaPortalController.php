<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditoriaPortal;
use App\Models\Cargo;
use App\Models\ValidacionDocumento;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AuditoriaPortalController extends Controller
{
    public function index(Request $request)
    {
        $email   = trim((string) $request->query('email', ''));
        $dni     = trim((string) $request->query('dni', ''));
        $cargo   = trim((string) $request->query('cargo', ''));
        $evento  = trim((string) $request->query('evento', ''));
        $desde   = $request->query('desde');
        $hasta   = $request->query('hasta');

        $query = AuditoriaPortal::query()->orderByDesc('created_at');

        if ($email !== '') {
            $query->where('email_sesion', 'ilike', "%{$email}%");
        }
        if ($dni !== '') {
            $query->where('dni_sesion', $dni);
        }
        if ($evento !== '') {
            $query->where('evento', $evento);
        }
        if ($desde) {
            $query->where('created_at', '>=', $desde . ' 00:00:00');
        }
        if ($hasta) {
            $query->where('created_at', '<=', $hasta . ' 23:59:59');
        }

        // Filtro por número de cargo: requiere mapeo via tabla cargos -> cargable
        if ($cargo !== '') {
            $cargoModel = Cargo::where('numero_cargo', $cargo)->first();
            if ($cargoModel) {
                $query->where(function ($q) use ($cargoModel) {
                    $q->where(function ($q2) use ($cargoModel) {
                        $q2->where('cargable_type', $cargoModel->cargable_type)
                           ->where('cargable_id', $cargoModel->cargable_id);
                    });
                });
            } else {
                $query->whereRaw('1=0'); // cargo inexistente → sin resultados
            }
        }

        $eventos = $query->limit(500)->get()->map(fn($a) => [
            'id'            => $a->id,
            'evento'        => $a->evento,
            'email_sesion'  => $a->email_sesion,
            'dni_sesion'    => $a->dni_sesion,
            'user_id'       => $a->user_id,
            'ip'            => $a->ip,
            'user_agent'    => $a->user_agent ? mb_substr($a->user_agent, 0, 200) : null,
            'metadata'      => $a->metadata,
            'cargable_type' => $a->cargable_type,
            'cargable_id'   => $a->cargable_id,
            'created_at'    => $a->created_at?->format('d/m/Y H:i:s'),
        ]);

        $eventosDisponibles = AuditoriaPortal::query()
            ->select('evento')
            ->distinct()
            ->orderBy('evento')
            ->pluck('evento')
            ->toArray();

        return Inertia::render('Admin/Auditoria/HistorialPortal', [
            'eventos'            => $eventos,
            'eventosDisponibles' => $eventosDisponibles,
            'filtros'            => compact('email', 'dni', 'cargo', 'evento', 'desde', 'hasta'),
        ]);
    }

    public function porCargo(string $numeroCargo)
    {
        $cargo = Cargo::where('numero_cargo', $numeroCargo)->firstOrFail();

        $eventos = AuditoriaPortal::where('cargable_type', $cargo->cargable_type)
            ->where('cargable_id', $cargo->cargable_id)
            ->orderBy('created_at')
            ->get();

        $validaciones = ValidacionDocumento::where('solicitable_type', $cargo->cargable_type)
            ->where('solicitable_id', $cargo->cargable_id)
            ->orderBy('created_at')
            ->get();

        return response()->json([
            'cargo' => [
                'numero_cargo'      => $cargo->numero_cargo,
                'ip_origen'         => $cargo->ip_origen,
                'user_agent_origen' => $cargo->user_agent_origen ? mb_substr($cargo->user_agent_origen, 0, 200) : null,
                'email_solicitante' => $cargo->email_solicitante,
                'dni_solicitante'   => $cargo->dni_solicitante,
                'created_at'        => $cargo->created_at?->format('d/m/Y H:i:s'),
            ],
            'eventos'      => $eventos,
            'validaciones' => $validaciones,
        ]);
    }
}
