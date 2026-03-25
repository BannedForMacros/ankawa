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
        abort_unless($this->gestorService->esGestor($expediente, auth()->id()), 403,
            'Solo el Gestor del expediente puede crear movimientos.');

        abort_if($expediente->estado !== 'activo', 422,
            'No se pueden crear movimientos en un expediente que no está activo.');

        $request->validate([
            'etapa_id'                   => 'required|exists:etapas,id',
            'sub_etapa_id'               => 'nullable|exists:sub_etapas,id',
            'tipo_actor_responsable_id'  => 'nullable|exists:tipos_actor_expediente,id',
            'usuario_responsable_id'     => 'nullable|exists:users,id',
            'instruccion'                => 'required|string|max:2000',
            'observaciones'              => 'nullable|string|max:2000',
            'dias_plazo'                 => 'nullable|integer|min:1|max:365',
            'tipo_documento_requerido_id' => 'nullable|exists:tipo_documentos,id',
            'documentos'                 => 'nullable|array',
            'documentos.*'               => 'file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240',
            'notificar_a'                => 'nullable|array',
            'notificar_a.*'              => 'integer|exists:expediente_actores,id',
        ]);

        $datos = array_merge($request->only([
            'etapa_id', 'sub_etapa_id', 'tipo_actor_responsable_id',
            'usuario_responsable_id', 'instruccion', 'observaciones',
            'dias_plazo', 'tipo_documento_requerido_id',
        ]), ['creado_por' => auth()->id()]);

        $archivos = $request->file('documentos') ?? [];
        $notificarA = $request->notificar_a ?? [];

        // Si no hay responsable, es una "Actuación Propia" → se crea ya como respondido
        $estadoInicial = empty($datos['usuario_responsable_id']) ? 'respondido' : 'pendiente';

        $this->movimientoService->crear($expediente, $datos, $archivos, $notificarA, $estadoInicial);

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
     * Responder un movimiento Y crear el siguiente en un solo paso (solo Gestor).
     */
    public function responderYCrear(Request $request, Expediente $expediente, ExpedienteMovimiento $movimiento)
    {
        abort_unless($movimiento->expediente_id === $expediente->id, 404);
        abort_unless($movimiento->usuario_responsable_id === auth()->id(), 403);
        abort_unless($movimiento->estado === 'pendiente', 422);
        abort_unless($this->gestorService->esGestor($expediente, auth()->id()), 403,
            'Solo el Gestor puede responder y crear un nuevo movimiento simultáneamente.');

        $request->validate([
            // Respuesta
            'respuesta'                       => 'required|string|max:5000',
            'documentos_respuesta'            => 'nullable|array',
            'documentos_respuesta.*'          => 'file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240',
            // Nuevo movimiento
            'nuevo_etapa_id'                  => 'required|exists:etapas,id',
            'nuevo_sub_etapa_id'              => 'nullable|exists:sub_etapas,id',
            'nuevo_tipo_actor_responsable_id' => 'nullable|exists:tipos_actor_expediente,id',
            'nuevo_usuario_responsable_id'    => 'nullable|exists:users,id',
            'nuevo_instruccion'               => 'required|string|max:2000',
            'nuevo_observaciones'             => 'nullable|string|max:2000',
            'nuevo_dias_plazo'                => 'nullable|integer|min:1|max:365',
            'nuevo_tipo_documento_requerido_id' => 'nullable|exists:tipo_documentos,id',
            'documentos_nuevo'                => 'nullable|array',
            'documentos_nuevo.*'              => 'file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240',
            'notificar_a'                     => 'nullable|array',
            'notificar_a.*'                   => 'integer|exists:expediente_actores,id',
        ]);

        $datosRespuesta = [
            'respuesta'      => $request->respuesta,
            'respondido_por' => auth()->id(),
        ];

        $datosNuevo = [
            'etapa_id'                   => $request->nuevo_etapa_id,
            'sub_etapa_id'               => $request->nuevo_sub_etapa_id,
            'tipo_actor_responsable_id'  => $request->nuevo_tipo_actor_responsable_id,
            'usuario_responsable_id'     => $request->nuevo_usuario_responsable_id,
            'instruccion'                => $request->nuevo_instruccion,
            'observaciones'              => $request->nuevo_observaciones,
            'dias_plazo'                 => $request->nuevo_dias_plazo,
            'tipo_documento_requerido_id' => $request->nuevo_tipo_documento_requerido_id,
            'creado_por'                 => auth()->id(),
        ];

        $this->movimientoService->responderYCrear(
            $movimiento,
            $datosRespuesta,
            $request->file('documentos_respuesta') ?? [],
            $expediente,
            $datosNuevo,
            $request->file('documentos_nuevo') ?? [],
            $request->notificar_a ?? []
        );

        return back()->with('success', 'Respuesta registrada y nuevo movimiento creado.');
    }

    /**
     * Resolver un movimiento respondido (solo Gestor).
     * Aprueba, observa, rechaza, valida, etc. según tipos_resolucion_movimiento.
     */
    public function resolver(Request $request, Expediente $expediente, ExpedienteMovimiento $movimiento)
    {
        abort_unless($movimiento->expediente_id === $expediente->id, 404);
        abort_unless($this->gestorService->esGestor($expediente, auth()->id()), 403);
        abort_unless($movimiento->puedeSerResuelto(), 422, 'Este movimiento no puede ser resuelto.');

        $tipoResolucion = \App\Models\TipoResolucionMovimiento::findOrFail($request->resolucion_tipo_id);

        $request->validate([
            'resolucion_tipo_id' => 'required|exists:tipos_resolucion_movimiento,id',
            'resolucion_nota'    => ($tipoResolucion->requiere_nota ? 'required' : 'nullable') . '|string|max:2000',
        ]);

        $movimiento->update([
            'resolucion_tipo_id' => $request->resolucion_tipo_id,
            'resolucion_nota'    => $request->resolucion_nota,
            'resuelto_por'       => auth()->id(),
            'fecha_resolucion'   => now(),
        ]);

        \App\Models\ExpedienteHistorial::create([
            'expediente_id' => $expediente->id,
            'usuario_id'    => auth()->id(),
            'tipo_evento'   => 'movimiento_resuelto',
            'descripcion'   => "Movimiento resuelto como «{$tipoResolucion->nombre}»: {$movimiento->instruccion}",
            'datos_extra'   => ['movimiento_id' => $movimiento->id, 'resolucion' => $tipoResolucion->nombre],
            'created_at'    => now(),
        ]);

        return back()->with('success', "Movimiento marcado como «{$tipoResolucion->nombre}».");
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
