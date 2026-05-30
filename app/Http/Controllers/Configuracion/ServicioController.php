<?php

namespace App\Http\Controllers\Configuracion;

use App\Http\Controllers\Controller;
use App\Models\Servicio;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ServicioController extends Controller
{
    public function index()
    {
        // Catálogo pequeño: se trae completo; filtrado/búsqueda/orden en el navegador.
        $servicios = Servicio::orderBy('nombre')->get();

        return Inertia::render('Configuracion/Servicios/Index', [
            'servicios' => $servicios,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nombre'                   => 'required|string|max:255|unique:servicios,nombre',
            'descripcion'              => 'nullable|string',
            'plazo_subsanacion_dias'   => 'nullable|integer|min:1|max:365',
            'plazo_apersonamiento_dias'=> 'nullable|integer|min:1|max:365',
        ], [
            'nombre.required' => 'El nombre del servicio es obligatorio.',
            'nombre.unique'   => 'Ya existe un servicio con ese nombre.',
        ]);

        Servicio::create([
            'nombre'                   => $request->nombre,
            'descripcion'              => $request->descripcion,
            'plazo_subsanacion_dias'   => $request->plazo_subsanacion_dias ?? 5,
            'plazo_apersonamiento_dias'=> $request->plazo_apersonamiento_dias ?? 5,
            'activo'                   => 1,
        ]);

        return back()->with('success', 'Servicio creado correctamente.');
    }

    public function update(Request $request, Servicio $servicio)
    {
        $request->validate([
            'nombre'                   => 'required|string|max:255|unique:servicios,nombre,' . $servicio->id,
            'descripcion'              => 'nullable|string',
            'activo'                   => 'required|in:0,1',
            'plazo_subsanacion_dias'   => 'nullable|integer|min:1|max:365',
            'plazo_apersonamiento_dias'=> 'nullable|integer|min:1|max:365',
        ], [
            'nombre.required' => 'El nombre del servicio es obligatorio.',
            'nombre.unique'   => 'Ya existe un servicio con ese nombre.',
        ]);

        $servicio->update([
            'nombre'                   => $request->nombre,
            'descripcion'              => $request->descripcion,
            'activo'                   => $request->activo,
            'plazo_subsanacion_dias'   => $request->plazo_subsanacion_dias ?? $servicio->plazo_subsanacion_dias,
            'plazo_apersonamiento_dias'=> $request->plazo_apersonamiento_dias ?? $servicio->plazo_apersonamiento_dias,
        ]);

        return back()->with('success', 'Servicio actualizado correctamente.');
    }

    public function destroy(Servicio $servicio)
    {
        if ($servicio->etapas()->exists()) {
            return back()->with('error', 'No se puede desactivar un servicio que tiene etapas configuradas.');
        }

        $servicio->update(['activo' => 0]);

        return back()->with('success', 'Servicio desactivado correctamente.');
    }

    public function reactivar(Servicio $servicio)
    {
        $servicio->update(['activo' => 1]);

        return back()->with('success', 'Servicio reactivado correctamente.');
    }
}