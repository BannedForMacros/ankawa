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
            // Nuevo: agrupado por tipo de documento. Cada tipo de doc lleva sus propios responsables con plazo individual.
            // tipo_documento_id es opcional (puede ser NULL para requerimientos "libres" sin doc específico, ej. apersonamiento).
            'requerimientos'                                  => 'nullable|array',
            'requerimientos.*.tipo_documento_id'              => ['nullable', $existsTipoDocEnServicio],
            'requerimientos.*.responsables'                   => 'nullable|array',
            'requerimientos.*.responsables.*.actor_ids'       => 'nullable|array',
            'requerimientos.*.responsables.*.actor_ids.*'     => ['integer', $existsActorEnExpediente],
            'requerimientos.*.responsables.*.dias_plazo'      => [Rule::requiredIf(fn() => $request->input('tipo') === 'requerimiento'), 'nullable', 'integer', 'min:1', 'max:365'],
            'requerimientos.*.responsables.*.tipo_dias'       => 'nullable|in:calendario,habiles',
            'instruccion'                => 'required|string|max:2000',
            'observaciones'              => 'nullable|string|max:2000',
            'dias_plazo'                 => 'nullable|integer|min:1|max:365',
            'tipo_dias'                  => 'nullable|in:calendario,habiles',
            'tipo_documento_requerido_id' => ['nullable', $existsTipoDocEnServicio],
            'documento_tipo_id'          => ['nullable', $existsTipoDocEnServicio],
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
            'documento_tipo_id',
        ]), [
            'creado_por'                         => auth()->id(),
            'tipo'                               => $request->input('tipo', 'requerimiento'),
            'requerimientos'                     => $request->input('requerimientos') ?: [],
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
        $totalActorIds = collect($datos['requerimientos'] ?? [])
            ->flatMap(fn($r) => $r['responsables'] ?? [])
            ->sum(fn($resp) => count($resp['actor_ids'] ?? []));
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
            // Nuevo: requerimientos agrupados por tipo de documento (cada uno con sus responsables y plazos)
            'movimientos.*.requerimientos'                                      => 'nullable|array',
            'movimientos.*.requerimientos.*.tipo_documento_id'                  => ['nullable', $existsTipoDocEnServicio],
            'movimientos.*.requerimientos.*.responsables'                       => 'nullable|array',
            'movimientos.*.requerimientos.*.responsables.*.actor_ids'           => 'nullable|array',
            'movimientos.*.requerimientos.*.responsables.*.actor_ids.*'         => ['integer', $existsActorEnExpediente],
            'movimientos.*.requerimientos.*.responsables.*.dias_plazo'          => 'nullable|integer|min:1|max:365',
            'movimientos.*.requerimientos.*.responsables.*.tipo_dias'           => 'nullable|in:calendario,habiles',
            'movimientos.*.dias_plazo'                    => 'nullable|integer|min:1|max:365',
            'movimientos.*.tipo_dias'                => 'nullable|in:calendario,habiles',
            'movimientos.*.tipo_documento_requerido_id' => ['nullable', $existsTipoDocEnServicio],
            'movimientos.*.documento_tipo_id'           => ['nullable', $existsTipoDocEnServicio],
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
                $totalActorIds = collect($item['requerimientos'] ?? [])
                    ->flatMap(fn($r) => $r['responsables'] ?? [])
                    ->sum(fn($resp) => count($resp['actor_ids'] ?? []));
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
                            'documento_tipo_id',
                        ]),
                        [
                            'creado_por'    => auth()->id(),
                            'requerimientos' => $item['requerimientos'] ?? [],
                            'tipo'          => $tipo,
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
            $diasAnterior   = $movimiento->dias_plazo;
            $fechaAnterior  = $movimiento->fecha_limite;
            $estadoAnterior = $movimiento->estado;

            $nuevaFecha = now()->addDays((int) $request->dias_plazo)->toDateString();
            $updates['dias_plazo']    = $request->dias_plazo;
            $updates['fecha_limite']  = $nuevaFecha;
            // Si estaba vencido, volver a pendiente
            if ($movimiento->estado === 'vencido') {
                $updates['estado'] = 'pendiente';
            }

            $movimiento->update($updates);

            \App\Models\MovimientoExtensionPlazo::create([
                'movimiento_id'         => $movimiento->id,
                'dias_plazo_anterior'   => $diasAnterior,
                'dias_plazo_nuevo'      => (int) $request->dias_plazo,
                'fecha_limite_anterior' => $fechaAnterior,
                'fecha_limite_nueva'    => $nuevaFecha,
                'tipo_dias'             => $movimiento->tipo_dias ?? 'calendario',
                'extendido_por'         => auth()->id(),
                'estado_anterior'       => $estadoAnterior,
                'created_at'            => now(),
            ]);

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
