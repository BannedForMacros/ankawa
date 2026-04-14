<?php

namespace App\Http\Controllers\Configuracion;

use App\Http\Controllers\Controller;
use App\Models\Etapa;
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
            'servicio_id'           => 'required|exists:servicios,id',
            'nombre'                => 'required|string|max:255',
            'descripcion'           => 'nullable|string',
            'orden'                 => 'nullable|integer|min:1',
            'requiere_conformidad'  => 'nullable|boolean',
        ]);

        if ($request->boolean('requiere_conformidad')) {
            $yaExiste = Etapa::where('servicio_id', $request->servicio_id)
                ->where('requiere_conformidad', true)
                ->where('activo', 1)
                ->exists();

            if ($yaExiste) {
                return back()->withErrors([
                    'requiere_conformidad' => 'Ya existe una etapa con conformidad obligatoria para este servicio. Solo puede haber una.',
                ]);
            }
        }

        $maxOrden = Etapa::where('servicio_id', $request->servicio_id)->max('orden') ?? 0;

        Etapa::create([
            'servicio_id'           => $request->servicio_id,
            'nombre'                => $request->nombre,
            'descripcion'           => $request->descripcion,
            'orden'                 => $request->orden ?? ($maxOrden + 1),
            'activo'                => 1,
            'requiere_conformidad'  => $request->boolean('requiere_conformidad'),
        ]);

        return back()->with('success', 'Etapa creada correctamente.');
    }

    public function updateEtapa(Request $request, Etapa $etapa)
    {
        $request->validate([
            'nombre'                => 'required|string|max:255',
            'descripcion'           => 'nullable|string',
            'orden'                 => 'nullable|integer|min:1',
            'activo'                => 'nullable|in:0,1',
            'requiere_conformidad'  => 'nullable|boolean',
        ]);

        if ($request->boolean('requiere_conformidad')) {
            $yaExiste = Etapa::where('servicio_id', $etapa->servicio_id)
                ->where('requiere_conformidad', true)
                ->where('activo', 1)
                ->where('id', '!=', $etapa->id)
                ->exists();

            if ($yaExiste) {
                return back()->withErrors([
                    'requiere_conformidad' => 'Ya existe una etapa con conformidad obligatoria para este servicio. Solo puede haber una.',
                ]);
            }
        }

        $etapa->update($request->only('nombre', 'descripcion', 'orden', 'activo', 'requiere_conformidad'));

        return back()->with('success', 'Etapa actualizada.');
    }

    public function destroyEtapa(Etapa $etapa)
    {
        $etapa->update(['activo' => 0]);
        return back()->with('success', 'Etapa desactivada.');
    }
}
