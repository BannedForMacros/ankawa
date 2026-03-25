<?php

namespace App\Http\Controllers;

use App\Models\Expediente;
use App\Models\ExpedienteMovimiento;
use App\Services\MovimientoService;
use App\Services\GestorExpedienteService;
use Illuminate\Http\Request;

class MovimientoController extends Controller
{
    public function __construct(
        private MovimientoService $movimientoService,
        private GestorExpedienteService $gestorService,
    ) {}

    /**
     * Crear un nuevo movimiento (solo Gestor del expediente).
     */
    public function store(Request $request, Expediente $expediente)
    {
        // Verificar que el usuario es gestor
        abort_unless($this->gestorService->esGestor($expediente, auth()->id()), 403,
            'Solo el Gestor del expediente puede crear movimientos.');

        abort_if($expediente->estado !== 'activo', 422,
            'No se pueden crear movimientos en un expediente que no está activo.');

        $request->validate([
            'etapa_id'                  => 'required|exists:etapas,id',
            'sub_etapa_id'              => 'nullable|exists:sub_etapas,id',
            'tipo_actor_responsable_id' => 'nullable|exists:tipos_actor_expediente,id',
            'usuario_responsable_id'    => 'nullable|exists:users,id',
            'instruccion'               => 'required|string|max:2000',
            'observaciones'             => 'nullable|string|max:2000',
            'dias_plazo'                => 'nullable|integer|min:1|max:365',
            'documentos'               => 'nullable|array',
            'documentos.*'             => 'file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240',
            'notificar_a'              => 'nullable|array',
            'notificar_a.*'            => 'integer|exists:expediente_actores,id',
        ]);

        $datos = array_merge($request->only([
            'etapa_id', 'sub_etapa_id', 'tipo_actor_responsable_id',
            'usuario_responsable_id', 'instruccion', 'observaciones', 'dias_plazo',
        ]), ['creado_por' => auth()->id()]);

        $archivos = $request->file('documentos') ?? [];
        $notificarA = $request->notificar_a ?? [];

        $this->movimientoService->crear($expediente, $datos, $archivos, $notificarA);

        return back()->with('success', 'Movimiento registrado correctamente.');
    }

    /**
     * Responder a un movimiento pendiente (actor responsable).
     */
    public function responder(Request $request, Expediente $expediente, ExpedienteMovimiento $movimiento)
    {
        abort_unless($movimiento->expediente_id === $expediente->id, 404);
        abort_unless($movimiento->usuario_responsable_id === auth()->id(), 403,
            'Solo el actor responsable puede responder este movimiento.');
        abort_unless($movimiento->estado === 'pendiente', 422,
            'Este movimiento ya no está pendiente.');

        $request->validate([
            'respuesta'       => 'required|string|max:5000',
            'documentos'      => 'nullable|array',
            'documentos.*'    => 'file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240',
            'notificar_a'     => 'nullable|array',
            'notificar_a.*'   => 'integer|exists:expediente_actores,id',
        ]);

        $datos = [
            'respuesta'      => $request->respuesta,
            'respondido_por' => auth()->id(),
        ];

        $archivos = $request->file('documentos') ?? [];
        $notificarA = $request->notificar_a ?? [];

        $this->movimientoService->responder($movimiento, $datos, $archivos, $notificarA);

        return back()->with('success', 'Respuesta registrada correctamente.');
    }

    /**
     * Omitir un movimiento pendiente (solo Gestor).
     */
    public function omitir(Request $request, Expediente $expediente, ExpedienteMovimiento $movimiento)
    {
        abort_unless($movimiento->expediente_id === $expediente->id, 404);
        abort_unless($this->gestorService->esGestor($expediente, auth()->id()), 403,
            'Solo el Gestor puede omitir movimientos.');
        abort_unless($movimiento->estado === 'pendiente', 422,
            'Solo se pueden omitir movimientos pendientes.');

        $request->validate([
            'motivo' => 'required|string|max:1000',
        ]);

        $this->movimientoService->omitir($movimiento, auth()->id(), $request->motivo);

        return back()->with('success', 'Movimiento omitido.');
    }
}
