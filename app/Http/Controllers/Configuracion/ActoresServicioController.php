<?php

namespace App\Http\Controllers\Configuracion;

use App\Http\Controllers\Controller;
use App\Models\Servicio;
use App\Models\ServicioTipoActor;
use App\Models\TipoActorExpediente;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ActoresServicioController extends Controller
{
    public function index()
    {
        return Inertia::render('Configuracion/ActoresServicio/Index', [
            'servicios'  => Servicio::orderBy('nombre')->get(['id', 'nombre', 'activo']),
            'tiposActor' => TipoActorExpediente::where('activo', 1)->orderBy('nombre')->get(['id', 'nombre', 'slug']),
            'pivot'      => ServicioTipoActor::all(),
        ]);
    }

    public function upsert(Request $request, Servicio $servicio, TipoActorExpediente $tipoActor)
    {
        $request->validate([
            'es_automatico'   => 'required|boolean',
            'permite_externo' => 'required|boolean',
            'rol_auto_slug'   => 'nullable|string|max:100',
            'orden'           => 'required|integer|min:1',
        ]);

        ServicioTipoActor::updateOrCreate(
            ['servicio_id' => $servicio->id, 'tipo_actor_id' => $tipoActor->id],
            [
                'es_automatico'  => $request->es_automatico,
                'permite_externo'=> $request->permite_externo,
                'rol_auto_slug'  => $request->es_automatico ? $request->rol_auto_slug : null,
                'orden'          => $request->orden,
                'activo'         => 1,
            ]
        );

        return back()->with('success', 'Actor actualizado correctamente.');
    }

    public function destroy(Servicio $servicio, TipoActorExpediente $tipoActor)
    {
        ServicioTipoActor::where([
            'servicio_id'   => $servicio->id,
            'tipo_actor_id' => $tipoActor->id,
        ])->delete();

        return back()->with('success', 'Actor removido del servicio.');
    }
}
