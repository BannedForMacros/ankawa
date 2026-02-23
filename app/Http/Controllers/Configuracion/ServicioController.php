<?php

namespace App\Http\Controllers\Configuracion;

use App\Http\Controllers\Controller;
use App\Models\Servicio;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ServicioController extends Controller
{
    public function index(Request $request)
    {
        $query = Servicio::query();

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('nombre',      'ilike', '%' . $request->search . '%')
                  ->orWhere('descripcion', 'ilike', '%' . $request->search . '%');
            });
        }

        $sortBy  = in_array($request->sort, ['id', 'nombre', 'activo']) ? $request->sort : 'id';
        $sortDir = $request->dir === 'desc' ? 'desc' : 'asc';
        $query->orderBy($sortBy, $sortDir);

        $servicios = $query->paginate(20)->withQueryString();

        return Inertia::render('Configuracion/Servicios/Index', [
            'servicios' => $servicios,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nombre'      => 'required|string|max:255|unique:servicios,nombre',
            'descripcion' => 'nullable|string',
        ], [
            'nombre.required' => 'El nombre del servicio es obligatorio.',
            'nombre.unique'   => 'Ya existe un servicio con ese nombre.',
        ]);

        Servicio::create([
            'nombre'      => $request->nombre,
            'descripcion' => $request->descripcion,
            'activo'      => 1,
        ]);

        return back()->with('success', 'Servicio creado correctamente.');
    }

    public function update(Request $request, Servicio $servicio)
    {
        $request->validate([
            'nombre'      => 'required|string|max:255|unique:servicios,nombre,' . $servicio->id,
            'descripcion' => 'nullable|string',
            'activo'      => 'required|in:0,1',
        ], [
            'nombre.required' => 'El nombre del servicio es obligatorio.',
            'nombre.unique'   => 'Ya existe un servicio con ese nombre.',
        ]);

        $servicio->update([
            'nombre'      => $request->nombre,
            'descripcion' => $request->descripcion,
            'activo'      => $request->activo,
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
}