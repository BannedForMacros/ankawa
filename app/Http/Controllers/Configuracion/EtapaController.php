<?php

namespace App\Http\Controllers\Configuracion;

use App\Http\Controllers\Controller;
use App\Models\Etapa;
use App\Models\SubEtapa;
use App\Models\Servicio;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EtapaController extends Controller
{
    public function index(Request $request)
    {
        $servicioId = $request->get('servicio_id');

        $servicios = Servicio::where('activo', 1)->orderBy('nombre')->get(['id', 'nombre']);

        $etapas = [];
        if ($servicioId) {
            $etapas = Etapa::where('servicio_id', $servicioId)
                ->with(['subEtapas' => fn($q) => $q->orderBy('orden')])
                ->orderBy('orden')
                ->get();
        }

        return Inertia::render('Configuracion/Etapas/Index', [
            'servicios'       => $servicios,
            'servicioActual'  => $servicioId ? (int) $servicioId : null,
            'etapas'          => $etapas,
        ]);
    }

    // ── CRUD Etapas ──

    public function storeEtapa(Request $request)
    {
        $request->validate([
            'servicio_id' => 'required|exists:servicios,id',
            'nombre'      => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'orden'       => 'nullable|integer|min:1',
        ]);

        $maxOrden = Etapa::where('servicio_id', $request->servicio_id)->max('orden') ?? 0;

        Etapa::create([
            'servicio_id' => $request->servicio_id,
            'nombre'      => $request->nombre,
            'descripcion' => $request->descripcion,
            'orden'       => $request->orden ?? ($maxOrden + 1),
            'activo'      => 1,
        ]);

        return back()->with('success', 'Etapa creada correctamente.');
    }

    public function updateEtapa(Request $request, Etapa $etapa)
    {
        $request->validate([
            'nombre'      => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'orden'       => 'nullable|integer|min:1',
            'activo'      => 'nullable|in:0,1',
        ]);

        $etapa->update($request->only('nombre', 'descripcion', 'orden', 'activo'));

        return back()->with('success', 'Etapa actualizada.');
    }

    public function destroyEtapa(Etapa $etapa)
    {
        $etapa->update(['activo' => 0]);
        return back()->with('success', 'Etapa desactivada.');
    }

    // ── CRUD Sub-etapas ──

    public function storeSubEtapa(Request $request, Etapa $etapa)
    {
        $request->validate([
            'nombre'      => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'orden'       => 'nullable|integer|min:1',
        ]);

        $maxOrden = SubEtapa::where('etapa_id', $etapa->id)->max('orden') ?? 0;

        SubEtapa::create([
            'etapa_id'    => $etapa->id,
            'nombre'      => $request->nombre,
            'descripcion' => $request->descripcion,
            'orden'       => $request->orden ?? ($maxOrden + 1),
            'activo'      => 1,
        ]);

        return back()->with('success', 'Sub-etapa creada correctamente.');
    }

    public function updateSubEtapa(Request $request, SubEtapa $subEtapa)
    {
        $request->validate([
            'nombre'      => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'orden'       => 'nullable|integer|min:1',
            'activo'      => 'nullable|in:0,1',
        ]);

        $subEtapa->update($request->only('nombre', 'descripcion', 'orden', 'activo'));

        return back()->with('success', 'Sub-etapa actualizada.');
    }

    public function destroySubEtapa(SubEtapa $subEtapa)
    {
        $subEtapa->update(['activo' => 0]);
        return back()->with('success', 'Sub-etapa desactivada.');
    }
}
