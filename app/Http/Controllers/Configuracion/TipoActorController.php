<?php

namespace App\Http\Controllers\Configuracion;

use App\Http\Controllers\Controller;
use App\Models\TipoActorExpediente;
use App\Models\ServicioTipoActor;
use App\Models\Servicio;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Str;

class TipoActorController extends Controller
{
    public function index()
    {
        $tipos = TipoActorExpediente::withCount('actoresExpediente')
            ->with(['servicios' => function ($q) {
                $q->orderBy('nombre');
            }])
            ->orderBy('nombre')
            ->get();

        $servicios = Servicio::orderBy('nombre')->get(['id', 'nombre']);
        $roles     = \App\Models\Rol::where('activo', 1)->orderBy('nombre')->get(['id', 'nombre', 'slug']);

        return Inertia::render('Configuracion/TiposActor/Index', [
            'tipos'     => $tipos,
            'servicios' => $servicios,
            'roles'     => $roles,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:100',
        ]);

        $slug = Str::slug($request->nombre, '_');

        if (TipoActorExpediente::where('slug', $slug)->exists()) {
            return back()->withErrors(['nombre' => 'Ya existe un tipo de actor con un nombre similar.']);
        }

        TipoActorExpediente::create([
            'nombre' => $request->nombre,
            'slug'   => $slug,
            'activo' => 1,
        ]);

        return back()->with('success', 'Tipo de Actor creado correctamente.');
    }

    public function update(Request $request, TipoActorExpediente $tipoActor)
    {
        $request->validate([
            'nombre' => 'required|string|max:100',
            'activo' => 'required|in:0,1',
        ]);

        $slug = Str::slug($request->nombre, '_');

        if (TipoActorExpediente::where('slug', $slug)->where('id', '!=', $tipoActor->id)->exists()) {
            return back()->withErrors(['nombre' => 'El nombre genera un identificador que ya está en uso.']);
        }

        $tipoActor->update([
            'nombre' => $request->nombre,
            'slug'   => $slug,
            'activo' => $request->activo,
        ]);

        return back()->with('success', 'Tipo de Actor actualizado correctamente.');
    }

    public function destroy(TipoActorExpediente $tipoActor)
    {
        if ($tipoActor->actoresExpediente()->exists()) {
            return back()->with('error', 'No se puede desactivar: hay expedientes con este tipo de actor asignado.');
        }

        if ($tipoActor->transicionesQueLoDesignan()->where('actividad_transiciones.activo', 1)->exists()) {
            return back()->with('error', 'No se puede desactivar: hay transiciones activas que designan este actor.');
        }

        $tipoActor->update(['activo' => 0]);

        return back()->with('success', 'Tipo de Actor desactivado correctamente.');
    }

    /**
     * Guarda la configuración de servicios para un tipo de actor.
     * Body: { servicios: [{ servicio_id, activo, es_automatico, rol_auto_slug, orden }] }
     */
    public function syncServicios(Request $request, TipoActorExpediente $tipoActor)
    {
        $request->validate([
            'servicios'                   => 'required|array',
            'servicios.*.servicio_id'     => 'required|integer|exists:servicios,id',
            'servicios.*.activo'          => 'required|boolean',
            'servicios.*.es_automatico'   => 'required|boolean',
            'servicios.*.permite_externo' => 'required|boolean',
            'servicios.*.rol_auto_slug'   => 'nullable|string|max:100',
            'servicios.*.orden'           => 'required|integer|min:1',
        ]);

        foreach ($request->servicios as $srv) {
            if ($srv['activo']) {
                ServicioTipoActor::updateOrCreate(
                    [
                        'servicio_id'   => $srv['servicio_id'],
                        'tipo_actor_id' => $tipoActor->id,
                    ],
                    [
                        'es_automatico'  => $srv['es_automatico'],
                        'permite_externo'=> $srv['permite_externo'],
                        'rol_auto_slug'  => $srv['es_automatico'] ? ($srv['rol_auto_slug'] ?? null) : null,
                        'orden'          => $srv['orden'],
                        'activo'         => 1,
                    ]
                );
            } else {
                ServicioTipoActor::where([
                    'servicio_id'   => $srv['servicio_id'],
                    'tipo_actor_id' => $tipoActor->id,
                ])->delete();
            }
        }

        return back()->with('success', 'Configuración de servicios actualizada.');
    }
}
