<?php

namespace App\Http\Controllers;

use App\Models\Expediente;
use App\Models\ExpedienteMovimiento;
use App\Services\MovimientoService;
use App\Services\GestorExpedienteService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Support\FileRules;

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

        $expediente->loadMissing(['etapaActual', 'solicitud']);
        $etapaActual = $expediente->etapaActual;
        if ($etapaActual?->requiere_conformidad) {
            $etapaSolicitada = (int) $request->input('etapa_id');
            $esConforme      = $expediente->solicitud?->resultado_revision === 'conforme';
            if ($etapaSolicitada !== $expediente->etapa_actual_id && !$esConforme) {
                return back()->withErrors([
                    'etapa_id' => 'Esta etapa requiere que la solicitud esté declarada CONFORME antes de avanzar a otra etapa.',
                ]);
            }
        }

        // IDs validados con scope: cada FK debe pertenecer al servicio o al expediente correspondiente.
        $existsTipoActorEnServicio = Rule::exists('servicio_tipos_actor', 'tipo_actor_id')
            ->where('servicio_id', $expediente->servicio_id);
        $existsTipoDocEnServicio   = Rule::exists('servicio_tipo_documento', 'tipo_documento_id')
            ->where('servicio_id', $expediente->servicio_id);
        $existsActorEnExpediente   = Rule::exists('expediente_actores', 'id')
            ->where('expediente_id', $expediente->id);

        $request->validate([
            'etapa_id'                   => [
                'required',
                Rule::exists('etapas', 'id')->where('servicio_id', $expediente->servicio_id),
            ],
            'tipo_actor_responsable_id'  => ['nullable', $existsTipoActorEnServicio],
            'usuario_responsable_id'     => 'nullable|exists:users,id',
            'responsables'                 => 'nullable|array',
            'responsables.*.actor_ids'    => 'nullable|array',
            'responsables.*.actor_ids.*'  => ['integer', $existsActorEnExpediente],
            'responsables.*.dias_plazo'   => [Rule::requiredIf(fn() => $request->input('tipo') === 'requerimiento'), 'nullable', 'integer', 'min:1', 'max:365'],
            'responsables.*.tipo_dias'    => 'nullable|in:calendario,habiles',
            'instruccion'                => 'required|string|max:2000',
            'observaciones'              => 'nullable|string|max:2000',
            'dias_plazo'                 => 'nullable|integer|min:1|max:365',
            'tipo_dias'                  => 'nullable|in:calendario,habiles',
            'tipo_documento_requerido_id' => ['nullable', $existsTipoDocEnServicio],
            'habilitar_mesa_partes'              => 'nullable|boolean',
            'actores_mesa_partes_ids'            => 'nullable|array',
            'actores_mesa_partes_ids.*'          => ['integer', $existsActorEnExpediente],
            'enviar_credenciales_expediente'     => 'nullable|boolean',
            'actor_credenciales_exp_id'          => ['nullable', $existsActorEnExpediente],
            'credenciales_email_destino'         => 'nullable|email|max:255',
            'documentos'                         => 'nullable|array',
            'documentos.*'               => FileRules::accept(),
            'notificar_a'                => 'nullable|array',
            'notificar_a.*'              => ['integer', $existsActorEnExpediente],
        ]);

        $datos = array_merge($request->only([
            'etapa_id', 'tipo_actor_responsable_id',
            'usuario_responsable_id', 'instruccion', 'observaciones',
            'dias_plazo', 'tipo_dias', 'tipo_documento_requerido_id',
        ]), [
            'creado_por'                         => auth()->id(),
            'tipo'                               => $request->input('tipo', 'requerimiento'),
            'responsables'                       => $request->input('responsables') ?: [],
            'habilitar_mesa_partes'              => $request->boolean('habilitar_mesa_partes'),
            'actores_mesa_partes_ids'            => $request->input('actores_mesa_partes_ids', []),
            'enviar_credenciales_expediente'     => $request->boolean('enviar_credenciales_expediente'),
            'actor_credenciales_exp_id'          => $request->input('actor_credenciales_exp_id') ?: null,
            'credenciales_email_destino'         => $request->input('credenciales_email_destino') ?: null,
        ]);

        $archivos = $request->file('documentos') ?? [];
        $notificarA = $request->notificar_a ?? [];

        // tipo: 'requerimiento' → pendiente | 'propia' → respondido | 'notificacion' → recibido
        $tipo = $request->input('tipo', 'requerimiento');
        $totalActorIds = collect($datos['responsables'] ?? [])->sum(fn($r) => count($r['actor_ids'] ?? []));
        $tieneResponsable = !empty($datos['usuario_responsable_id']) || $totalActorIds > 0;
        if ($tipo === 'notificacion') {
            $estadoInicial = 'recibido';     // traslado/notificación → no requiere respuesta
        } elseif (!$tieneResponsable) {
            $estadoInicial = 'respondido';   // actuación propia (sin responsable)
        } else {
            $estadoInicial = 'pendiente';    // requerimiento con responsable
        }

        $this->movimientoService->crear($expediente, $datos, $archivos, $notificarA, $estadoInicial);

        return back()->with('success', 'Movimiento registrado correctamente.');
    }

    /**
     * Crear múltiples movimientos en lote (solo Gestor), en orden.
     */
    public function storeLote(Request $request, Expediente $expediente)
    {
        abort_unless($this->gestorService->esGestor($expediente, auth()->id()), 403);
        abort_if($expediente->estado !== 'activo', 422, 'No se pueden crear movimientos en un expediente inactivo.');

        $expediente->loadMissing(['etapaActual', 'solicitud']);
        $etapaActual = $expediente->etapaActual;
        if ($etapaActual?->requiere_conformidad) {
            $esConforme = $expediente->solicitud?->resultado_revision === 'conforme';
            $cambia = collect($request->input('movimientos', []))
                ->contains(fn($m) => isset($m['etapa_id']) && (int) $m['etapa_id'] !== $expediente->etapa_actual_id);
            if ($cambia && !$esConforme) {
                return back()->withErrors([
                    'movimientos' => 'Esta etapa requiere que la solicitud esté declarada CONFORME antes de avanzar a otra etapa.',
                ]);
            }
        }

        $existsTipoActorEnServicio = Rule::exists('servicio_tipos_actor', 'tipo_actor_id')
            ->where('servicio_id', $expediente->servicio_id);
        $existsTipoDocEnServicio   = Rule::exists('servicio_tipo_documento', 'tipo_documento_id')
            ->where('servicio_id', $expediente->servicio_id);
        $existsActorEnExpediente   = Rule::exists('expediente_actores', 'id')
            ->where('expediente_id', $expediente->id);

        $request->validate([
            'movimientos'                            => 'required|array|min:1|max:20',
            'movimientos.*.tipo'                     => 'required|in:requerimiento,propia,notificacion',
            'movimientos.*.etapa_id'                 => [
                'required',
                Rule::exists('etapas', 'id')->where('servicio_id', $expediente->servicio_id),
            ],
            'movimientos.*.instruccion'              => 'required|string|max:2000',
            'movimientos.*.observaciones'            => 'nullable|string|max:2000',
            'movimientos.*.tipo_actor_responsable_id'      => ['nullable', $existsTipoActorEnServicio],
            'movimientos.*.usuario_responsable_id'        => 'nullable|exists:users,id',
            'movimientos.*.responsables'                   => 'nullable|array',
            'movimientos.*.responsables.*.actor_ids'      => 'nullable|array',
            'movimientos.*.responsables.*.actor_ids.*'    => ['integer', $existsActorEnExpediente],
            'movimientos.*.responsables.*.dias_plazo'     => 'nullable|integer|min:1|max:365',
            'movimientos.*.responsables.*.tipo_dias'      => 'nullable|in:calendario,habiles',
            'movimientos.*.dias_plazo'                    => 'nullable|integer|min:1|max:365',
            'movimientos.*.tipo_dias'                => 'nullable|in:calendario,habiles',
            'movimientos.*.tipo_documento_requerido_id' => ['nullable', $existsTipoDocEnServicio],
            'movimientos.*.habilitar_mesa_partes'            => 'nullable|boolean',
            'movimientos.*.actores_mesa_partes_ids'          => 'nullable|array',
            'movimientos.*.actores_mesa_partes_ids.*'        => ['integer', $existsActorEnExpediente],
            'movimientos.*.enviar_credenciales_expediente'   => 'nullable|boolean',
            'movimientos.*.actor_credenciales_exp_id'        => ['nullable', $existsActorEnExpediente],
            'movimientos.*.credenciales_email_destino'       => 'nullable|email|max:255',
            'movimientos.*.notificar_a'              => 'nullable|array',
            'movimientos.*.notificar_a.*'            => ['integer', $existsActorEnExpediente],
            'documentos'                             => 'nullable|array',
            'documentos.*'                           => 'nullable|array',
            'documentos.*.*'                         => FileRules::accept(),
        ]);

        $documentosPorMovimiento = $request->file('documentos') ?? [];

        \Illuminate\Support\Facades\DB::transaction(function () use ($request, $expediente, $documentosPorMovimiento) {
            foreach ($request->movimientos as $i => $item) {
                $tipo = $item['tipo'] ?? 'requerimiento';
                $totalActorIds = collect($item['responsables'] ?? [])->sum(fn($r) => count($r['actor_ids'] ?? []));
                $tieneResponsable = !empty($item['usuario_responsable_id']) || $totalActorIds > 0;
                if ($tipo === 'notificacion') {
                    $estadoInicial = 'recibido';
                } elseif (!$tieneResponsable) {
                    $estadoInicial = 'respondido';
                } else {
                    $estadoInicial = 'pendiente';
                }

                $archivos   = $documentosPorMovimiento[$i] ?? [];
                $notificarA = $item['notificar_a'] ?? [];

                $this->movimientoService->crear(
                    $expediente,
                    array_merge(
                        \Illuminate\Support\Arr::only($item, [
                            'etapa_id', 'tipo_actor_responsable_id',
                            'usuario_responsable_id', 'instruccion', 'observaciones',
                            'dias_plazo', 'tipo_dias', 'tipo_documento_requerido_id',
                        ]),
                        [
                            'creado_por'   => auth()->id(),
                            'responsables' => $item['responsables'] ?? [],
                            'tipo'         => $tipo,
                            'habilitar_mesa_partes'              => !empty($item['habilitar_mesa_partes']),
                            'actores_mesa_partes_ids'            => $item['actores_mesa_partes_ids'] ?? [],
                            'enviar_credenciales_expediente'     => !empty($item['enviar_credenciales_expediente']),
                            'actor_credenciales_exp_id'          => $item['actor_credenciales_exp_id'] ?? null,
                            'credenciales_email_destino'         => $item['credenciales_email_destino'] ?? null,
                        ]
                    ),
                    $archivos,
                    $notificarA,
                    $estadoInicial
                );
            }
        });

        $cant = count($request->movimientos);
        return back()->with('success', "{$cant} movimiento(s) creado(s) correctamente.");
    }

    /**
     * Responder a un movimiento pendiente (actor responsable).
     */
    public function responder(Request $request, Expediente $expediente, ExpedienteMovimiento $movimiento)
    {
        abort_unless($movimiento->expediente_id === $expediente->id, 404);
        abort_unless($movimiento->esResponsable(auth()->id()), 403,
            'Solo el actor responsable puede responder este movimiento.');
        abort_unless($movimiento->estado === 'pendiente', 422,
            'Este movimiento ya no está pendiente.');

        $existsActorEnExpediente = Rule::exists('expediente_actores', 'id')
            ->where('expediente_id', $expediente->id);

        $request->validate([
            'respuesta'       => 'required|string|max:5000',
            'documentos'      => 'nullable|array',
            'documentos.*'    => FileRules::accept(),
            'notificar_a'     => 'nullable|array',
            'notificar_a.*'   => ['integer', $existsActorEnExpediente],
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
        abort_unless($movimiento->esResponsable(auth()->id()), 403);
        abort_unless($movimiento->estado === 'pendiente', 422);
        abort_unless($this->gestorService->esGestor($expediente, auth()->id()), 403,
            'Solo el Gestor puede responder y crear un nuevo movimiento simultáneamente.');

        $existsTipoActorEnServicio = Rule::exists('servicio_tipos_actor', 'tipo_actor_id')
            ->where('servicio_id', $expediente->servicio_id);
        $existsTipoDocEnServicio   = Rule::exists('servicio_tipo_documento', 'tipo_documento_id')
            ->where('servicio_id', $expediente->servicio_id);
        $existsActorEnExpediente   = Rule::exists('expediente_actores', 'id')
            ->where('expediente_id', $expediente->id);

        $request->validate([
            // Respuesta
            'respuesta'                       => 'required|string|max:5000',
            'documentos_respuesta'            => 'nullable|array',
            'documentos_respuesta.*'          => FileRules::accept(),
            // Nuevo movimiento
            'nuevo_etapa_id'                  => [
                'required',
                Rule::exists('etapas', 'id')->where('servicio_id', $expediente->servicio_id),
            ],
            'nuevo_tipo_actor_responsable_id'              => ['nullable', $existsTipoActorEnServicio],
            'nuevo_usuario_responsable_id'                => 'nullable|exists:users,id',
            'nuevo_responsables'                           => 'nullable|array',
            'nuevo_responsables.*.actor_ids'              => 'nullable|array',
            'nuevo_responsables.*.actor_ids.*'            => ['integer', $existsActorEnExpediente],
            'nuevo_responsables.*.dias_plazo'             => 'nullable|integer|min:1|max:365',
            'nuevo_responsables.*.tipo_dias'              => 'nullable|in:calendario,habiles',
            'nuevo_instruccion'               => 'required|string|max:2000',
            'nuevo_observaciones'             => 'nullable|string|max:2000',
            'nuevo_dias_plazo'                => 'nullable|integer|min:1|max:365',
            'nuevo_tipo_dias'                 => 'nullable|in:calendario,habiles',
            'nuevo_tipo_documento_requerido_id' => ['nullable', $existsTipoDocEnServicio],
            'documentos_nuevo'                => 'nullable|array',
            'documentos_nuevo.*'              => FileRules::accept(),
            'notificar_a'                     => 'nullable|array',
            'notificar_a.*'                   => ['integer', $existsActorEnExpediente],
        ]);

        $datosRespuesta = [
            'respuesta'      => $request->respuesta,
            'respondido_por' => auth()->id(),
        ];

        $datosNuevo = [
            'etapa_id'                   => $request->nuevo_etapa_id,
            'tipo_actor_responsable_id'  => $request->nuevo_tipo_actor_responsable_id,
            'usuario_responsable_id'     => $request->nuevo_usuario_responsable_id,
            'responsables'               => $request->input('nuevo_responsables') ?: [],
            'instruccion'                => $request->nuevo_instruccion,
            'observaciones'              => $request->nuevo_observaciones,
            'dias_plazo'                 => $request->nuevo_dias_plazo,
            'tipo_dias'                  => $request->nuevo_tipo_dias ?? 'calendario',
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
     * Extender el plazo de un movimiento pendiente y continuar el proceso.
     */
    public function extenderPlazo(Request $request, Expediente $expediente, ExpedienteMovimiento $movimiento)
    {
        abort_unless($movimiento->expediente_id === $expediente->id, 404);
        abort_unless($this->gestorService->esGestor($expediente, auth()->id()), 403);
        abort_unless(
            in_array($movimiento->estado, ['pendiente', 'vencido'], true),
            422,
            'Solo se puede extender el plazo de movimientos pendientes o vencidos.'
        );

        $request->validate([
            'dias_plazo' => 'nullable|integer|min:1|max:365',
        ]);

        $updates = [];
        if (!empty($request->dias_plazo)) {
            $updates['dias_plazo']    = $request->dias_plazo;
            $updates['fecha_limite']  = now()->addDays((int) $request->dias_plazo)->toDateString();
            // Si estaba vencido, volver a pendiente
            if ($movimiento->estado === 'vencido') {
                $updates['estado'] = 'pendiente';
            }
        }

        if (!empty($updates)) {
            $movimiento->update($updates);

            \App\Models\ExpedienteHistorial::create([
                'expediente_id' => $expediente->id,
                'usuario_id'    => auth()->id(),
                'tipo_evento'   => 'plazo_extendido',
                'descripcion'   => "Plazo extendido a {$request->dias_plazo} días: {$movimiento->instruccion}",
                'datos_extra'   => ['movimiento_id' => $movimiento->id, 'nuevos_dias' => $request->dias_plazo],
                'created_at'    => now(),
            ]);
        }

        return back()->with('success', 'Proceso continuado.' . (!empty($updates) ? ' Plazo actualizado.' : ''));
    }
}
