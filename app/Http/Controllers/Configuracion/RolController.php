<?php

namespace App\Http\Controllers\Configuracion;

use App\Http\Controllers\Controller;
use App\Models\Rol;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RolController extends Controller
{
    public function index(Request $request)
    {
        $query = Rol::query();

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('nombre', 'ilike', '%' . $request->search . '%')
                  ->orWhere('descripcion', 'ilike', '%' . $request->search . '%');
            });
        }

        $sortBy  = in_array($request->sort, ['id', 'nombre', 'activo']) ? $request->sort : 'id';
        $sortDir = $request->dir === 'desc' ? 'desc' : 'asc';
        $query->orderBy($sortBy, $sortDir);

        $roles = $query->paginate(20)->withQueryString();

        return Inertia::render('Configuracion/Roles/Index', [
            'roles' => $roles,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nombre'      => 'required|string|max:255|unique:roles,nombre',
            'descripcion' => 'nullable|string',
        ], [
            'nombre.required' => 'El nombre del rol es obligatorio.',
            'nombre.unique'   => 'Ya existe un rol con ese nombre.',
            'nombre.max'      => 'El nombre no puede superar los 255 caracteres.',
        ]);

        Rol::create([
            'nombre'      => $request->nombre,
            'descripcion' => $request->descripcion,
            'activo'      => 1,
        ]);

        return back()->with('success', 'Rol creado correctamente.');
    }

    public function update(Request $request, Rol $rol)
    {
        $request->validate([
            'nombre'      => 'required|string|max:255|unique:roles,nombre,' . $rol->id,
            'descripcion' => 'nullable|string',
            'activo'      => 'required|in:0,1',
        ], [
            'nombre.required' => 'El nombre del rol es obligatorio.',
            'nombre.unique'   => 'Ya existe un rol con ese nombre.',
        ]);

        $rol->update([
            'nombre'      => $request->nombre,
            'descripcion' => $request->descripcion,
            'activo'      => $request->activo,
        ]);

        return back()->with('success', 'Rol actualizado correctamente.');
    }

    public function destroy(Rol $rol)
    {
        // Verificar si tiene usuarios asignados activos
        if ($rol->usuarios()->where('activo', 1)->exists()) {
            return back()->with('error', 'No se puede eliminar un rol que tiene usuarios activos asignados.');
        }

        $rol->update(['activo' => 0]);

        return back()->with('success', 'Rol eliminado correctamente.');
    }
}