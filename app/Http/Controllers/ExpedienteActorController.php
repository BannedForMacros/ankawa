<?php

namespace App\Http\Controllers;

use App\Models\Expediente;
use App\Models\ExpedienteActor;
use App\Models\ExpedienteHistorial;
use App\Services\GestorExpedienteService;
use Illuminate\Http\Request;

class ExpedienteActorController extends Controller
{
    public function __construct(
        private GestorExpedienteService $gestorService,
    ) {}

    /**
     * Agregar un actor al expediente.
     * Solo Gestor o roles con puede_designar_gestor.
     */
    public function store(Request $request, Expediente $expediente)
    {
        $this->autorizarGestion($expediente);

        $request->validate([
            'usuario_id'    => 'nullable|exists:users,id',
            'tipo_actor_id' => 'required|exists:tipos_actor_expediente,id',
            'nombre_externo'=> 'nullable|string|max:255',
            'email_externo' => 'nullable|email|max:255',
        ]);

        $actor = ExpedienteActor::updateOrCreate(
            [
                'expediente_id' => $expediente->id,
                'tipo_actor_id' => $request->tipo_actor_id,
                'usuario_id'    => $request->usuario_id,
            ],
            [
                'nombre_externo' => $request->nombre_externo,
                'email_externo'  => $request->email_externo,
                'activo'         => 1,
            ]
        );

        $nombre = $actor->usuario?->name ?? $actor->nombre_externo ?? 'Actor externo';
        ExpedienteHistorial::create([
            'expediente_id' => $expediente->id,
            'usuario_id'    => auth()->id(),
            'tipo_evento'   => 'actor_agregado',
            'descripcion'   => "Se agregó al actor: {$nombre}",
            'datos_extra'   => ['actor_id' => $actor->id, 'tipo_actor_id' => $request->tipo_actor_id],
            'created_at'    => now(),
        ]);

        return back()->with('success', 'Actor agregado correctamente.');
    }

    /**
     * Desactivar un actor del expediente.
     */
    public function destroy(Expediente $expediente, ExpedienteActor $actor)
    {
        $this->autorizarGestion($expediente);
        abort_unless($actor->expediente_id === $expediente->id, 404);

        $nombre = $actor->usuario?->name ?? $actor->nombre_externo ?? 'Actor';
        $actor->update(['activo' => 0, 'es_gestor' => false]);

        ExpedienteHistorial::create([
            'expediente_id' => $expediente->id,
            'usuario_id'    => auth()->id(),
            'tipo_evento'   => 'actor_removido',
            'descripcion'   => "Se removió al actor: {$nombre}",
            'datos_extra'   => ['actor_id' => $actor->id],
            'created_at'    => now(),
        ]);

        return back()->with('success', 'Actor removido correctamente.');
    }

    /**
     * Designar gestor del expediente.
     */
    public function designarGestor(Request $request, Expediente $expediente)
    {
        $user = auth()->user();
        abort_unless($user->rol?->puede_designar_gestor, 403,
            'No tiene permisos para designar gestor.');

        $request->validate([
            'usuario_id' => 'required|exists:users,id',
        ]);

        $this->gestorService->designar($expediente, $request->usuario_id, $user->id);

        return back()->with('success', 'Gestor designado correctamente.');
    }

    private function autorizarGestion(Expediente $expediente): void
    {
        $user = auth()->user();
        $esGestor = $this->gestorService->esGestor($expediente, $user->id);
        $puedeGestionar = $user->rol?->puede_designar_gestor ?? false;

        abort_unless($esGestor || $puedeGestionar, 403,
            'No tiene permisos para gestionar actores en este expediente.');
    }
}
