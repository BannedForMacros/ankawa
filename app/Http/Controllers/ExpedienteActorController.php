<?php

namespace App\Http\Controllers;

use App\Models\Expediente;
use App\Models\ExpedienteActor;
use App\Models\TipoActorExpediente;
use Illuminate\Http\Request;

class ExpedienteActorController extends Controller
{
    private const SLUGS_INMUTABLES = ['demandante', 'demandado'];

    public function store(Request $request, Expediente $expediente)
    {
        $request->validate([
            'tipo_actor_id' => 'required|exists:tipos_actor_expediente,id',
            'usuario_id'    => 'required|exists:users,id',
        ]);

        $tipo = TipoActorExpediente::findOrFail($request->tipo_actor_id);

        if (in_array($tipo->slug, self::SLUGS_INMUTABLES)) {
            return back()->withErrors(['tipo_actor_id' => 'Este tipo de actor no puede asignarse manualmente.']);
        }

        $existe = ExpedienteActor::where([
            'expediente_id' => $expediente->id,
            'usuario_id'    => $request->usuario_id,
            'tipo_actor_id' => $request->tipo_actor_id,
        ])->exists();

        if ($existe) {
            return back()->withErrors(['usuario_id' => 'Este usuario ya tiene ese rol en el expediente.']);
        }

        ExpedienteActor::create([
            'expediente_id' => $expediente->id,
            'usuario_id'    => $request->usuario_id,
            'tipo_actor_id' => $request->tipo_actor_id,
            'activo'        => 1,
        ]);

        return back()->with('success', 'Actor asignado correctamente.');
    }

    public function destroy(Expediente $expediente, ExpedienteActor $actor)
    {
        abort_if($actor->expediente_id !== $expediente->id, 403);

        $tipo = TipoActorExpediente::find($actor->tipo_actor_id);

        if ($tipo && in_array($tipo->slug, self::SLUGS_INMUTABLES)) {
            return back()->withErrors(['general' => 'Las partes principales no pueden eliminarse del expediente.']);
        }

        $actor->update(['activo' => 0]);

        return back()->with('success', 'Actor removido del expediente.');
    }
}
