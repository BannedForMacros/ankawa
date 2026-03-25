<?php

namespace App\Http\Controllers;

use App\Models\Expediente;
use App\Models\ExpedienteHistorial;
use App\Services\GestorExpedienteService;
use App\Services\EtapaService;
use Illuminate\Http\Request;

class ExpedienteEstadoController extends Controller
{
    public function __construct(
        private GestorExpedienteService $gestorService,
        private EtapaService $etapaService,
    ) {}

    /**
     * Suspender un expediente (solo Gestor).
     */
    public function suspender(Request $request, Expediente $expediente)
    {
        abort_unless($this->gestorService->esGestor($expediente, auth()->id()), 403);
        abort_unless($expediente->estado === 'activo', 422, 'Solo se puede suspender un expediente activo.');

        $request->validate(['motivo' => 'required|string|max:1000']);

        $expediente->update(['estado' => 'suspendido']);

        ExpedienteHistorial::create([
            'expediente_id' => $expediente->id,
            'usuario_id'    => auth()->id(),
            'tipo_evento'   => 'expediente_suspendido',
            'descripcion'   => "Expediente suspendido. Motivo: {$request->motivo}",
            'created_at'    => now(),
        ]);

        return back()->with('success', 'Expediente suspendido.');
    }

    /**
     * Reactivar un expediente suspendido (solo Gestor).
     */
    public function reactivar(Expediente $expediente)
    {
        abort_unless($this->gestorService->esGestor($expediente, auth()->id()), 403);
        abort_unless($expediente->estado === 'suspendido', 422, 'Solo se puede reactivar un expediente suspendido.');

        $expediente->update(['estado' => 'activo']);

        ExpedienteHistorial::create([
            'expediente_id' => $expediente->id,
            'usuario_id'    => auth()->id(),
            'tipo_evento'   => 'expediente_reactivado',
            'descripcion'   => 'Expediente reactivado.',
            'created_at'    => now(),
        ]);

        return back()->with('success', 'Expediente reactivado.');
    }

    /**
     * Concluir un expediente (solo Gestor).
     */
    public function concluir(Request $request, Expediente $expediente)
    {
        abort_unless($this->gestorService->esGestor($expediente, auth()->id()), 403);
        abort_unless($expediente->estado === 'activo', 422, 'Solo se puede concluir un expediente activo.');

        $request->validate(['motivo' => 'required|string|max:1000']);

        $expediente->update(['estado' => 'concluido']);

        ExpedienteHistorial::create([
            'expediente_id' => $expediente->id,
            'usuario_id'    => auth()->id(),
            'tipo_evento'   => 'expediente_concluido',
            'descripcion'   => "Expediente concluido. Motivo: {$request->motivo}",
            'created_at'    => now(),
        ]);

        return back()->with('success', 'Expediente concluido.');
    }

    /**
     * Cambiar la etapa actual del expediente (solo Gestor).
     */
    public function cambiarEtapa(Request $request, Expediente $expediente)
    {
        abort_unless($this->gestorService->esGestor($expediente, auth()->id()), 403);

        $request->validate([
            'etapa_id' => 'required|exists:etapas,id',
        ]);

        $this->etapaService->cambiarEtapa($expediente, $request->etapa_id, auth()->id());

        return back()->with('success', 'Etapa actualizada.');
    }
}
