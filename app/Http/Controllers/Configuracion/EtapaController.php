<?php

namespace App\Http\Controllers\Configuracion;

use App\Http\Controllers\Controller;
use App\Models\Etapa;
use App\Models\Actividad;
use App\Models\Servicio;
use App\Models\Rol;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EtapaController extends Controller
{
    public function index(Request $request)
    {
        $servicios = Servicio::where('activo', 1)
            ->orderBy('nombre')
            ->with(['etapas' => function ($q) {
                $q->orderBy('orden')
                  ->with(['actividades' => function ($q2) {
                      $q2->orderBy('orden')->with('roles');
                  }]);
            }])
            ->get();

        $roles = Rol::where('activo', 1)->orderBy('nombre')->get(['id', 'nombre']);

        return Inertia::render('Configuracion/Etapas/Index', [
            'servicios' => $servicios,
            'roles'     => $roles,
        ]);
    }

    // ── ETAPAS ──

    public function storeEtapa(Request $request)
    {
        $request->validate([
            'servicio_id' => 'required|exists:servicios,id',
            'nombre'      => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'orden'       => 'required|integer|min:1',
        ]);

        Etapa::create([
            'servicio_id' => $request->servicio_id,
            'nombre'      => $request->nombre,
            'descripcion' => $request->descripcion,
            'orden'       => $request->orden,
            'activo'      => 1,
        ]);

        return back()->with('success', 'Etapa creada correctamente.');
    }

    public function updateEtapa(Request $request, Etapa $etapa)
    {
        $request->validate([
            'nombre'      => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'orden'       => 'required|integer|min:1',
            'activo'      => 'required|in:0,1',
        ]);

        $etapa->update([
            'nombre'      => $request->nombre,
            'descripcion' => $request->descripcion,
            'orden'       => $request->orden,
            'activo'      => $request->activo,
        ]);

        return back()->with('success', 'Etapa actualizada correctamente.');
    }

    public function destroyEtapa(Etapa $etapa)
    {
        if ($etapa->actividades()->where('activo', 1)->exists()) {
            return back()->with('error', 'No se puede desactivar una etapa con actividades activas.');
        }

        $etapa->update(['activo' => 0]);
        return back()->with('success', 'Etapa desactivada correctamente.');
    }

    // ── ACTIVIDADES ──

    public function storeActividad(Request $request)
    {
        $request->validate([
            'etapa_id'       => 'required|exists:etapas,id',
            'nombre'         => 'required|string|max:255',
            'descripcion'    => 'nullable|string',
            'tipo'           => 'nullable|string|max:50',
            'es_obligatorio' => 'required|in:0,1',
            'dias_plazo'     => 'nullable|integer|min:1',
            'orden'          => 'required|integer|min:1',
            'roles'          => 'nullable|array',
            'roles.*'        => 'exists:roles,id',
        ]);

        $actividad = Actividad::create([
            'etapa_id'       => $request->etapa_id,
            'nombre'         => $request->nombre,
            'descripcion'    => $request->descripcion,
            'tipo'           => $request->tipo,
            'es_obligatorio' => $request->es_obligatorio,
            'dias_plazo'     => $request->dias_plazo,
            'orden'          => $request->orden,
            'activo'         => 1,
        ]);

        // Sincronizar roles
        if ($request->roles) {
            $actividad->roles()->sync($request->roles);
        }

        return back()->with('success', 'Actividad creada correctamente.');
    }

    public function updateActividad(Request $request, Actividad $actividad)
    {
        $request->validate([
            'nombre'         => 'required|string|max:255',
            'descripcion'    => 'nullable|string',
            'tipo'           => 'nullable|string|max:50',
            'es_obligatorio' => 'required|in:0,1',
            'dias_plazo'     => 'nullable|integer|min:1',
            'orden'          => 'required|integer|min:1',
            'activo'         => 'required|in:0,1',
            'roles'          => 'nullable|array',
            'roles.*'        => 'exists:roles,id',
        ]);

        $actividad->update([
            'nombre'         => $request->nombre,
            'descripcion'    => $request->descripcion,
            'tipo'           => $request->tipo,
            'es_obligatorio' => $request->es_obligatorio,
            'dias_plazo'     => $request->dias_plazo,
            'orden'          => $request->orden,
            'activo'         => $request->activo,
        ]);

        // Sincronizar roles (sync elimina los anteriores y pone los nuevos)
        $actividad->roles()->sync($request->roles ?? []);

        return back()->with('success', 'Actividad actualizada correctamente.');
    }

    public function destroyActividad(Actividad $actividad)
    {
        $actividad->update(['activo' => 0]);
        return back()->with('success', 'Actividad desactivada correctamente.');
    }
}