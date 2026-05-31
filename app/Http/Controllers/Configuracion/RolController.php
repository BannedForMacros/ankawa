<?php

namespace App\Http\Controllers\Configuracion;

use App\Http\Controllers\Controller;
use App\Models\Rol;
use App\Models\Modulo;
use App\Models\RolModuloPermiso;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class RolController extends Controller
{
    public function index()
    {
        // Catálogo pequeño: se trae completo; filtrado/búsqueda/orden en el navegador.
        $roles = Rol::orderBy('nombre')->get();

        // Módulos activos (orden jerárquico) para la matriz de permisos.
        $modulos = Modulo::where('activo', 1)
            ->orderByRaw('COALESCE(parent_id, id)')
            ->orderBy('orden')
            ->orderBy('id')
            ->get(['id', 'nombre', 'slug', 'parent_id', 'orden']);

        // Permisos existentes por rol: { rol_id: { modulo_id: {ver,crear,editar,eliminar} } }
        $permisos = RolModuloPermiso::get(['rol_id', 'modulo_id', 'ver', 'crear', 'editar', 'eliminar'])
            ->groupBy('rol_id')
            ->map(fn($filas) => $filas->mapWithKeys(fn($p) => [
                $p->modulo_id => [
                    'ver'      => (bool) $p->ver,
                    'crear'    => (bool) $p->crear,
                    'editar'   => (bool) $p->editar,
                    'eliminar' => (bool) $p->eliminar,
                ],
            ]));

        return Inertia::render('Configuracion/Roles/Index', [
            'roles'    => $roles,
            'modulos'  => $modulos,
            'permisos' => $permisos,
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
            return back()->with('error', 'No se puede desactivar un rol que tiene usuarios activos asignados.');
        }

        $rol->update(['activo' => 0]);

        return back()->with('success', 'Rol desactivado correctamente.');
    }

    public function reactivar(Rol $rol)
    {
        $rol->update(['activo' => 1]);

        return back()->with('success', 'Rol reactivado correctamente.');
    }

    /**
     * Guarda la matriz de permisos (módulo × acción) de un rol en bulk.
     * Recibe: permisos = [{ modulo_id, ver, crear, editar, eliminar }, ...]
     */
    public function syncPermisos(Request $request, Rol $rol)
    {
        // El superusuario del sistema siempre conserva acceso total: no se edita
        // su matriz para evitar dejar al sistema sin administrador.
        if ($rol->slug === Rol::SLUG_ADMINISTRADOR_TI) {
            return back()->with('error', 'El rol Administrador TI conserva acceso total y no puede modificarse.');
        }

        $data = $request->validate([
            'permisos'              => 'required|array',
            'permisos.*.modulo_id'  => 'required|integer|exists:modules,id',
            'permisos.*.ver'        => 'required|boolean',
            'permisos.*.crear'      => 'required|boolean',
            'permisos.*.editar'     => 'required|boolean',
            'permisos.*.eliminar'   => 'required|boolean',
        ]);

        DB::transaction(function () use ($data, $rol) {
            foreach ($data['permisos'] as $p) {
                RolModuloPermiso::updateOrCreate(
                    ['rol_id' => $rol->id, 'modulo_id' => $p['modulo_id']],
                    [
                        'ver'      => $p['ver']      ? 1 : 0,
                        'crear'    => $p['crear']    ? 1 : 0,
                        'editar'   => $p['editar']   ? 1 : 0,
                        'eliminar' => $p['eliminar'] ? 1 : 0,
                    ]
                );
            }
        });

        return back()->with('success', "Permisos de \"{$rol->nombre}\" actualizados correctamente.");
    }
}
