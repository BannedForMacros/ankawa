<?php

namespace App\Http\Controllers\Configuracion;

use App\Http\Controllers\Controller;
use App\Models\CatalogoAccion;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Str;

class AccionFlujoController extends Controller
{
    public function index()
    {
        // Traemos las acciones con el conteo de transiciones que las usan
        $acciones = CatalogoAccion::withCount('transiciones')
            ->orderBy('id')
            ->get();

        return Inertia::render('Configuracion/Acciones/Index', [
            'acciones' => $acciones
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nombre'    => 'required|string|max:100',
            'color_hex' => 'nullable|string|max:20',
        ]);

        $slug = Str::slug($request->nombre, '_');

        if (CatalogoAccion::where('slug', $slug)->exists()) {
            return back()->withErrors(['nombre' => 'Ya existe una acción con un nombre similar.']);
        }

        CatalogoAccion::create([
            'nombre'    => $request->nombre,
            'slug'      => $slug,
            'color_hex' => $request->color_hex ?? '#291136', // Color por defecto (El de Ankawa/Galilea)
            'activo'    => 1,
        ]);

        return back()->with('success', 'Acción creada correctamente.');
    }

    public function update(Request $request, CatalogoAccion $accion)
    {
        $request->validate([
            'nombre'    => 'required|string|max:100',
            'color_hex' => 'required|string|max:20',
            'activo'    => 'required|in:0,1',
        ]);

        $slug = Str::slug($request->nombre, '_');

        if (CatalogoAccion::where('slug', $slug)->where('id', '!=', $accion->id)->exists()) {
            return back()->withErrors(['nombre' => 'El nombre genera un identificador que ya está en uso.']);
        }

        $accion->update([
            'nombre'    => $request->nombre,
            'slug'      => $slug,
            'color_hex' => $request->color_hex,
            'activo'    => $request->activo,
        ]);

        return back()->with('success', 'Acción actualizada correctamente.');
    }

    public function destroy(CatalogoAccion $accion)
    {
        // Protección legal/lógica: No podemos borrar una acción si un botón la está usando
        if ($accion->transiciones()->where('activo', 1)->exists()) {
            return back()->with('error', 'No se puede desactivar: Hay transiciones (botones) activos usando esta acción.');
        }

        $accion->update(['activo' => 0]);

        return back()->with('success', 'Acción desactivada correctamente.');
    }
}