<?php

namespace App\Http\Controllers;

use App\Models\Expediente;
use App\Models\Etapa;
use App\Models\TipoActorExpediente;
use App\Models\TipoDocumento;
use App\Support\FileRules;
use App\Models\ServicioTipoActor;
use App\Models\SolicitudArbitraje;
use App\Models\SolicitudSubsanacion;
use App\Models\TipoResolucionMovimiento;
use App\Models\ExpedienteActor;
use App\Models\ExpedienteActorAceptacion;
use App\Models\ExpedienteHistorial;
use App\Models\ExpedienteMovimiento;
use App\Models\User;
use App\Services\GestorExpedienteService;
use App\Services\MovimientoService;
use App\Services\NotificacionService;
use App\Services\VencimientoService;
use Illuminate\Support\Facades\DB;
use App\Services\EtapaService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ExpedienteController extends Controller
{
    public function __construct(
        private GestorExpedienteService $gestorService,
        private MovimientoService $movimientoService,
        private NotificacionService $notificacionService,
        private VencimientoService $vencimientoService,
        private EtapaService $etapaService,
    ) {}

    // ── Todos los expedientes ──
    public function index()
    {
        $user = auth()->user();

        $query = Expediente::with([
            'servicio', 'etapaActual', 'responsables.usuario:id,name',
            'movimientos' => fn($q) => $q
                ->where('tipo', 'requerimiento')
                ->where('estado', 'pendiente')
                ->select(['id', 'expediente_id', 'instruccion', 'fecha_limite', 'tipo_dias', 'dias_plazo'])
                ->orderBy('fecha_limite'),
        ])->orderByDesc('created_at');

        if (!$user->rol?->puede_ver_todos_expedientes) {
            $query->whereHas('actores', fn($q) =>
                $q->where('usuario_id', $user->id)->where('activo', 1)->where('acceso_expediente_electronico', 1)
            );
        }

        $expedientes = $query->get()->map(function ($exp) {
            $movUrgente    = $exp->movimientos->first();
            $diasRestantes = $movUrgente?->diasRestantes();
            $responsables  = $exp->responsables->map(fn($r) => $r->usuario?->name)->filter()->values();
            return [
                'id'                => $exp->id,
                'numero_expediente' => $exp->numero_expediente ?? 'EXP-' . $exp->id,
                'servicio'          => $exp->servicio?->nombre,
                'etapa'             => $exp->etapaActual?->nombre,
                'estado'            => $exp->estado,
                'responsables'      => $responsables,
                'gestor'            => $responsables->first(),
                'created_at'        => $exp->created_at->format('d/m/Y'),
                'movimiento_urgente' => $movUrgente ? [
                    'instruccion'  => $movUrgente->instruccion,
                    'fecha_limite' => $movUrgente->fecha_limite?->format('d/m/Y'),
                    'dias_plazo'   => $movUrgente->dias_plazo,
                    'tipo_dias'    => $movUrgente->tipo_dias,
                    'dias_restantes' => $diasRestantes,
                ] : null,
            ];
        });

        return Inertia::render('Expedientes/Index', [
            'expedientes' => $expedientes,
            'titulo'      => 'Expedientes',
        ]);
    }

    // ── Visor del expediente ──
    public function show(Expediente $expediente)
    {
        $user = auth()->user();

        $expediente->load([
            'solicitud.documentos',
            'servicio',
            'etapaActual',
            'actores.usuario.rol:id,nombre,slug',
            'actores.tipoActor',
            'actores.emailsAdicionales',
            'actores.designadoPor:id,name',
            'movimientos' => fn($q) => $q->where('activo', true)
                ->orderByDesc('created_at')
                ->with([
                    'etapa',
                    'tipoActorResponsable',
                    'usuarioResponsable',
                    'creadoPor', 'respondidoPor',
                    'documentos.subidoPor',
                    'tipoDocumentoRequerido',
                    'resolucionTipo', 'resueltoPor',
                    'cargo',
                    'notificaciones',
                    'responsables.actor.usuario:id,name',
                    'responsables.tipoActor:id,nombre',
                    'responsables.respondidoPor:id,name',
                    'extensiones.extendidoPor:id,name',
                ]),
        ]);

        // Validar acceso al expediente electrónico para no-admins
        if (!$user->rol?->puede_ver_todos_expedientes) {
            $tieneAcceso = $expediente->actores->contains(fn($a) =>
                $a->usuario_id === $user->id && $a->activo && $a->acceso_expediente_electronico
            );
            abort_unless($tieneAcceso, 403, 'No tiene acceso a este expediente.');
        }

        // Inyectar flag validado_por_gestor en cada actor
        $idsValidados = ExpedienteActorAceptacion::where('expediente_id', $expediente->id)
            ->where('tipo', 'validado_por_gestor')
            ->pluck('expediente_actor_id')
            ->all();

        $expediente->actores->each(function ($actor) use ($idsValidados) {
            $actor->setAttribute('validado_por_gestor', in_array($actor->id, $idsValidados, true));
        });

        $esGestor = $this->gestorService->esGestor($expediente, $user->id);
        // Puede designar responsables: rol con puede_designar_gestor O quien ya es responsable
        $puedeDesignarGestor = ($user->rol?->puede_designar_gestor ?? false) || $esGestor;

        $miAccionPendiente = $expediente->movimientos
            ->where('estado', 'pendiente')
            ->first(fn($mov) => $mov->esResponsable($user->id));

        // Tipo de actor del usuario logueado dentro de este servicio (según rol_auto_slug del pivot).
        // Se usa para filtrar los tipos de documento que puede subir al adjuntar archivos.
        $miTipoActorId = $user->rol?->slug
            ? DB::table('servicio_tipos_actor')
                ->where('servicio_id', $expediente->servicio_id)
                ->where('activo', 1)
                ->where('rol_auto_slug', $user->rol->slug)
                ->value('tipo_actor_id')
            : null;

        $etapas = $this->etapaService->etapasDelServicio($expediente->servicio_id);

        $servicioTiposActor = ServicioTipoActor::where('servicio_id', $expediente->servicio_id)
            ->where('activo', 1)
            ->with('tipoActor:id,nombre,slug')
            ->orderBy('orden')
            ->get();

        $tiposActor = $servicioTiposActor->map(fn($sta) => [
            'id'              => $sta->tipo_actor_id,
            'nombre'          => $sta->tipoActor?->nombre,
            'slug'            => $sta->tipoActor?->slug,
            'rol_auto_slug'   => $sta->rol_auto_slug,
            'permite_externo' => $sta->permite_externo ?? false,
            'es_automatico'   => $sta->es_automatico,
        ])->values();

        $usuariosAsignables = User::where('activo', 1)
            ->whereHas('rol', fn($q) => $q->whereNotIn('slug', ['usuario']))
            ->with('rol:id,nombre,slug')
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'rol_id']);

        $actoresNotificables = $this->notificacionService->actoresNotificables($expediente->id);
        $plazo = $this->vencimientoService->resumen($expediente->id);

        // Tipos de documento activos en el servicio del expediente, con permisos por actor
        $tiposDocumento = TipoDocumento::where('activo', true)
            ->whereHas('servicios', fn($q) => $q->where('servicio_id', $expediente->servicio_id))
            ->orderBy('nombre')
            ->get(['id', 'nombre'])
            ->map(function ($td) use ($expediente) {
                $permisos = DB::table('tipo_actor_tipo_documento')
                    ->where('tipo_documento_id', $td->id)
                    ->where('servicio_id', $expediente->servicio_id)
                    ->get(['tipo_actor_id', 'puede_ver', 'puede_subir']);
                return [
                    'id'       => $td->id,
                    'nombre'   => $td->nombre,
                    'permisos' => $permisos,
                ];
            })->values();

        $tiposResolucion = TipoResolucionMovimiento::where('activo', true)
            ->orderBy('id')
            ->get(['id', 'nombre', 'color', 'requiere_nota']);

        $enviosCount = ExpedienteMovimiento::enviosPendientes($expediente->id)->count();

        return Inertia::render('Expedientes/Show', [
            'expediente'           => $expediente,
            'esGestor'             => $esGestor,
            'puedeDesignarGestor'  => $puedeDesignarGestor,
            'miAccionPendiente'    => $miAccionPendiente,
            'etapas'               => $etapas,
            'tiposActor'           => $tiposActor,
            'usuariosAsignables'   => $usuariosAsignables,
            'actoresNotificables'  => $actoresNotificables,
            'plazo'                => $plazo,
            'tiposDocumento'       => $tiposDocumento,
            'tiposResolucion'      => $tiposResolucion,
            'enviosCount'          => $enviosCount,
            'miTipoActorId'        => $miTipoActorId,
        ]);
    }

    // ── Actualizar datos de la solicitud (solo Gestor) ──
    public function updateSolicitud(Request $request, Expediente $expediente)
    {
        $user = auth()->user();
        $esGestor = $this->gestorService->esGestor($expediente, $user->id);
        abort_unless($esGestor, 403, 'Solo el Gestor puede actualizar los datos de la solicitud.');

        $solicitud = $expediente->solicitud;
        abort_unless($solicitud, 404, 'Este expediente no tiene solicitud asociada.');

        $request->validate([
            'nombre_demandante'       => 'required|string|max:255',
            'documento_demandante'    => 'required|string|max:20',
            'nombre_representante'    => 'nullable|string|max:255',
            'documento_representante' => 'nullable|string|max:20',
            'domicilio_demandante'    => 'required|string|max:500',
            'email_demandante'        => 'required|email|max:255',
            'telefono_demandante'     => 'required|string|max:20',
            'nombre_demandado'        => 'required|string|max:255',
            'domicilio_demandado'     => 'required|string|max:500',
            'email_demandado'         => 'nullable|email|max:255',
            'telefono_demandado'      => 'nullable|string|max:20',
            'resumen_controversia'    => 'required|string',
            'pretensiones'            => 'required|string',
            'monto_involucrado'                          => 'nullable|numeric|min:0',
            'solicita_designacion_director_demandado'    => 'nullable|boolean',
        ]);

        $camposActualizados = [];
        $camposEditables = [
            'nombre_demandante', 'documento_demandante', 'nombre_representante',
            'documento_representante', 'domicilio_demandante', 'email_demandante',
            'telefono_demandante', 'nombre_demandado', 'domicilio_demandado',
            'email_demandado', 'telefono_demandado', 'resumen_controversia',
            'pretensiones', 'monto_involucrado', 'solicita_designacion_director_demandado',
        ];

        foreach ($camposEditables as $campo) {
            if ($request->has($campo) && $solicitud->{$campo} != $request->{$campo}) {
                $camposActualizados[] = $campo;
            }
        }

        $datos = $request->only($camposEditables);
        $datos['solicita_designacion_director_demandado'] = $request->boolean('solicita_designacion_director_demandado') ? 1 : 0;
        $solicitud->update($datos);

        // Sincronizar datos en el usuario del demandante (si tiene cuenta)
        $actorDemandante = ExpedienteActor::where('expediente_id', $expediente->id)
            ->whereHas('tipoActor', fn($q) => $q->where('slug', TipoActorExpediente::SLUG_DEMANDANTE))
            ->with('usuario')
            ->first();

        if ($actorDemandante?->usuario) {
            $actorDemandante->usuario->update(array_filter([
                'name'  => $request->nombre_demandante,
                'email' => $request->email_demandante,
            ]));
        }

        // Sincronizar datos en el usuario del demandado (si tiene cuenta)
        $actorDemandado = ExpedienteActor::where('expediente_id', $expediente->id)
            ->whereHas('tipoActor', fn($q) => $q->where('slug', TipoActorExpediente::SLUG_DEMANDADO))
            ->with('usuario')
            ->first();

        if ($actorDemandado?->usuario && $request->filled('email_demandado')) {
            $actorDemandado->usuario->update(array_filter([
                'name'  => $request->nombre_demandado,
                'email' => $request->email_demandado,
            ]));
        }

        ExpedienteHistorial::create([
            'expediente_id' => $expediente->id,
            'usuario_id'    => $user->id,
            'tipo_evento'   => 'solicitud_actualizada',
            'descripcion'   => 'Se actualizaron datos de la solicitud: ' . implode(', ', $camposActualizados),
            'datos_extra'   => ['campos' => $camposActualizados],
            'created_at'    => now(),
        ]);

        return back()->with('success', 'Datos de la solicitud actualizados correctamente.');
    }

    // ── Registrar conformidad o no conformidad (solo Gestor) ──
    public function registrarConformidad(Request $request, Expediente $expediente)
    {
        $user = auth()->user();
        abort_unless($this->gestorService->esGestor($expediente, $user->id), 403, 'Solo el Gestor puede registrar la conformidad.');

        $solicitud = $expediente->solicitud;
        abort_unless($solicitud, 404);
        abort_if($solicitud->resultado_revision === 'conforme', 422, 'La solicitud ya fue declarada conforme.');
        abort_if($solicitud->estado === 'subsanacion', 422, 'Hay una subsanación pendiente de respuesta por el demandante.');

        $existsTipoActorEnServicio = Rule::exists('servicio_tipos_actor', 'tipo_actor_id')
            ->where('servicio_id', $expediente->servicio_id);
        $existsTipoDocEnServicio   = Rule::exists('servicio_tipo_documento', 'tipo_documento_id')
            ->where('servicio_id', $expediente->servicio_id);
        $existsActorEnExpediente   = Rule::exists('expediente_actores', 'id')
            ->where('expediente_id', $expediente->id);

        $request->validate([
            'resultado'                            => 'required|in:conforme,no_conforme',
            'motivo_no_conformidad'                => 'required_if:resultado,no_conforme|nullable|string|max:2000',
            'movimientos'                             => 'nullable|array|max:10',
            'movimientos.*.tipo'                      => 'nullable|in:requerimiento,propia,notificacion',
            'movimientos.*.etapa_id'                  => [
                'required',
                Rule::exists('etapas', 'id')->where('servicio_id', $expediente->servicio_id),
            ],
            'movimientos.*.instruccion'               => 'required|string|max:2000',
            'movimientos.*.tipo_actor_responsable_id' => ['nullable', $existsTipoActorEnServicio],
            'movimientos.*.usuario_responsable_id'    => 'nullable|exists:users,id',
            'movimientos.*.dias_plazo'                => 'nullable|integer|min:1|max:365',
            'movimientos.*.tipo_dias'                 => 'nullable|in:calendario,habiles',
            'movimientos.*.tipo_documento_requerido_id' => ['nullable', $existsTipoDocEnServicio],
            'movimientos.*.documento_tipo_id'           => ['nullable', $existsTipoDocEnServicio],
            'movimientos.*.habilitar_mesa_partes'          => 'nullable|boolean',
            'movimientos.*.actores_mesa_partes_ids'        => 'nullable|array',
            'movimientos.*.actores_mesa_partes_ids.*'      => ['integer', $existsActorEnExpediente],
            'movimientos.*.enviar_credenciales_expediente' => 'nullable|boolean',
            'movimientos.*.actor_credenciales_exp_id'      => ['nullable', $existsActorEnExpediente],
            'movimientos.*.credenciales_email_destino'     => 'nullable|email|max:255',
            'movimientos.*.notificar_a'               => 'nullable|array',
            'movimientos.*.notificar_a.*'             => ['integer', $existsActorEnExpediente],
            'documentos'                              => 'nullable|array',
            'documentos.*'                            => 'nullable|array',
            'documentos.*.*'                          => FileRules::accept(),
        ]);

        $documentosPorMovimiento = $request->file('documentos') ?? [];

        \Illuminate\Support\Facades\DB::transaction(function () use ($request, $expediente, $solicitud, $user, $documentosPorMovimiento) {

            $solicitud->update([
                'resultado_revision'    => $request->resultado,
                'fecha_revision'        => now(),
                'revisado_por'          => $user->id,
                'motivo_no_conformidad' => $request->resultado === 'no_conforme' ? $request->motivo_no_conformidad : null,
            ]);

            if ($request->resultado === 'conforme') {
                $solicitud->update(['estado' => 'admitida']);

                ExpedienteHistorial::create([
                    'expediente_id' => $expediente->id,
                    'usuario_id'    => $user->id,
                    'tipo_evento'   => 'solicitud_conforme',
                    'descripcion'   => 'Solicitud declarada CONFORME.',
                    'datos_extra'   => [],
                    'created_at'    => now(),
                ]);
            } else {
                // No conforme
                $solicitud->update(['estado' => 'subsanacion']);

                $expediente->loadMissing('servicio');
                $plazoSubsanacion = $expediente->servicio->plazo_subsanacion_dias ?? 5;

                SolicitudSubsanacion::create([
                    'solicitud_id'   => $solicitud->id,
                    'registrado_por' => $user->id,
                    'observacion'    => $request->motivo_no_conformidad,
                    'plazo_dias'     => $plazoSubsanacion,
                    'fecha_limite'   => now()->addDays($plazoSubsanacion)->toDateString(),
                    'estado'         => 'pendiente',
                ]);

                ExpedienteHistorial::create([
                    'expediente_id' => $expediente->id,
                    'usuario_id'    => $user->id,
                    'tipo_evento'   => 'solicitud_no_conforme',
                    'descripcion'   => "Solicitud declarada NO CONFORME. Motivo: {$request->motivo_no_conformidad}",
                    'datos_extra'   => ['motivo' => $request->motivo_no_conformidad],
                    'created_at'    => now(),
                ]);
            }

            // Crear los movimientos indicados por el gestor (en orden del array)
            foreach ($request->input('movimientos', []) as $i => $datos) {
                $tipo = $datos['tipo'] ?? 'requerimiento';
                $tieneResponsable = !empty($datos['usuario_responsable_id']) || !empty($datos['responsables']);
                if ($tipo === 'notificacion') {
                    $estadoMov = 'recibido';
                } elseif (!$tieneResponsable) {
                    $estadoMov = 'respondido';
                } else {
                    $estadoMov = 'pendiente';
                }
                $this->movimientoService->crear(
                    $expediente,
                    [
                        'tipo'                        => $tipo,
                        'etapa_id'                    => $datos['etapa_id'],
                        'tipo_actor_responsable_id'   => $datos['tipo_actor_responsable_id'] ?: null,
                        'usuario_responsable_id'      => $datos['usuario_responsable_id'] ?: null,
                        'responsables'                => $datos['responsables'] ?? [],
                        'instruccion'                 => $datos['instruccion'],
                        'dias_plazo'                  => $datos['dias_plazo'] ?: null,
                        'tipo_dias'                   => $datos['tipo_dias'] ?? 'calendario',
                        'tipo_documento_requerido_id' => $datos['tipo_documento_requerido_id'] ?? null,
                        'documento_tipo_id'           => $datos['documento_tipo_id'] ?? null,
                        'habilitar_mesa_partes'          => !empty($datos['habilitar_mesa_partes']),
                        'actores_mesa_partes_ids'        => $datos['actores_mesa_partes_ids'] ?? [],
                        'enviar_credenciales_expediente' => !empty($datos['enviar_credenciales_expediente']),
                        'actor_credenciales_exp_id'      => $datos['actor_credenciales_exp_id'] ?? null,
                        'credenciales_email_destino'     => $datos['credenciales_email_destino'] ?? null,
                        'creado_por'                  => $user->id,
                    ],
                    $documentosPorMovimiento[$i] ?? [],
                    $datos['notificar_a'] ?? [],
                    $estadoMov
                );
            }
        });

        $cantMov = count($request->input('movimientos', []));
        $msg = $request->resultado === 'conforme'
            ? 'Solicitud declarada CONFORME.' . ($cantMov ? " Se crearon {$cantMov} movimiento(s)." : '')
            : 'Solicitud declarada NO CONFORME.' . ($cantMov ? " Se crearon {$cantMov} movimiento(s)." : '');

        return back()->with('success', $msg);
    }
}
