<?php

namespace App\Http\Controllers\Configuracion;

use App\Http\Controllers\Controller;
use App\Models\Modulo;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ModuloController extends Controller
{
    public function index(Request $request)
    {
        $modulos = Modulo::with('padre')
            ->orderBy('parent_id', 'asc')
            ->orderBy('orden', 'asc')
            ->paginate(50)
            ->withQueryString();

        return Inertia::render('Configuracion/Modulos/Index', [
            'modulos' => $modulos,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nombre'    => 'required|string|max:255',
            'slug'      => 'required|string|max:255|unique:modules,slug',
            'icono'     => 'nullable|string|max:100',
            'ruta'      => 'nullable|string|max:255',
            'parent_id' => 'nullable|exists:modules,id',
            'orden'     => 'nullable|integer|min:0',
        ]);

        Modulo::create([
            'nombre'    => $request->nombre,
            'slug'      => $request->slug,
            'icono'     => $request->icono,
            'ruta'      => $request->ruta,
            'parent_id' => $request->parent_id,
            'orden'     => $request->orden ?? 0,
            'activo'    => 1,
        ]);

        return back()->with('success', 'Módulo creado correctamente.');
    }

    public function update(Request $request, Modulo $modulo)
    {
        $request->validate([
            'nombre'    => 'required|string|max:255',
            'slug'      => 'required|string|max:255|unique:modules,slug,' . $modulo->id,
            'icono'     => 'nullable|string|max:100',
            'ruta'      => 'nullable|string|max:255',
            'parent_id' => 'nullable|exists:modules,id',
            'orden'     => 'nullable|integer|min:0',
            'activo'    => 'required|in:0,1',
        ]);

        $modulo->update($request->only(['nombre', 'slug', 'icono', 'ruta', 'parent_id', 'orden', 'activo']));

        return back()->with('success', 'Módulo actualizado correctamente.');
    }

    public function destroy(Modulo $modulo)
    {
        if ($modulo->submodulos()->count() > 0) {
            return back()->with('error', 'No se puede eliminar un módulo que tiene sub-módulos.');
        }

        $modulo->rolPermisos()->delete();
        $modulo->delete();

        return back()->with('success', 'Módulo eliminado correctamente.');
    }
}
