<?php

namespace App\Http\Controllers;

use App\Models\Expediente;
use App\Models\Etapa;
use App\Models\SubEtapa;
use App\Models\TipoActorExpediente;
use App\Models\TipoDocumento;
use App\Models\ServicioTipoActor;
use App\Models\SolicitudArbitraje;
use App\Models\SolicitudSubsanacion;
use App\Models\TipoResolucionMovimiento;
use App\Models\ExpedienteActor;
use App\Models\ExpedienteHistorial;
use App\Models\User;
use App\Services\GestorExpedienteService;
use App\Services\MovimientoService;
use App\Services\NotificacionService;
use App\Services\VencimientoService;
use App\Services\EtapaService;
use Illuminate\Http\Request;
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

        $query = Expediente::with(['servicio', 'etapaActual', 'gestor.usuario'])
            ->orderByDesc('created_at');

        if (!$user->rol?->puede_ver_todos_expedientes) {
            $query->whereHas('actores', fn($q) => $q->where('usuario_id', $user->id)->where('activo', 1));
        }

        $expedientes = $query->get()->map(fn($exp) => [
            'id'                => $exp->id,
            'numero_expediente' => $exp->numero_expediente ?? 'EXP-' . $exp->id,
            'servicio'          => $exp->servicio?->nombre,
            'etapa'             => $exp->etapaActual?->nombre,
            'estado'            => $exp->estado,
            'gestor'            => $exp->gestor?->usuario?->name,
            'created_at'        => $exp->created_at->format('d/m/Y'),
        ]);

        return Inertia::render('Expedientes/Index', [
            'expedientes' => $expedientes,
        ]);
    }

    // ── Mis expedientes ──
    public function misExpedientes()
    {
        $user = auth()->user();

        $expedientes = Expediente::with(['servicio', 'etapaActual', 'gestor.usuario'])
            ->whereHas('actores', fn($q) => $q->where('usuario_id', $user->id)->where('activo', 1))
            ->where('estado', '!=', 'concluido')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($exp) => [
                'id'                => $exp->id,
                'numero_expediente' => $exp->numero_expediente ?? 'EXP-' . $exp->id,
                'servicio'          => $exp->servicio?->nombre,
                'etapa'             => $exp->etapaActual?->nombre,
                'estado'            => $exp->estado,
                'gestor'            => $exp->gestor?->usuario?->name,
                'created_at'        => $exp->created_at->format('d/m/Y'),
            ]);

        return Inertia::render('Expedientes/Index', [
            'expedientes' => $expedientes,
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
            'movimientos' => fn($q) => $q->where('activo', true)
                ->orderByDesc('created_at')
                ->with([
                    'etapa', 'subEtapa',
                    'tipoActorResponsable',
                    'usuarioResponsable',
                    'creadoPor', 'respondidoPor',
                    'documentos.subidoPor',
                    'tipoDocumentoRequerido',
                    'resolucionTipo', 'resueltoPor',
                ]),
        ]);

        $esGestor = $this->gestorService->esGestor($expediente, $user->id);
        $puedeDesignarGestor = $user->rol?->puede_designar_gestor ?? false;

        $miAccionPendiente = $expediente->movimientos
            ->where('estado', 'pendiente')
            ->where('usuario_responsable_id', $user->id)
            ->first();

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

        $tiposDocumento = TipoDocumento::where('activo', true)
            ->orderBy('nombre')
            ->get(['id', 'nombre']);

        $tiposResolucion = TipoResolucionMovimiento::where('activo', true)
            ->orderBy('id')
            ->get(['id', 'nombre', 'color', 'requiere_nota']);

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
            'monto_involucrado'       => 'nullable|numeric|min:0',
        ]);

        $camposActualizados = [];
        $camposEditables = [
            'nombre_demandante', 'documento_demandante', 'nombre_representante',
            'documento_representante', 'domicilio_demandante', 'email_demandante',
            'telefono_demandante', 'nombre_demandado', 'domicilio_demandado',
            'email_demandado', 'telefono_demandado', 'resumen_controversia',
            'pretensiones', 'monto_involucrado',
        ];

        foreach ($camposEditables as $campo) {
            if ($request->has($campo) && $solicitud->{$campo} != $request->{$campo}) {
                $camposActualizados[] = $campo;
            }
        }

        $solicitud->update($request->only($camposEditables));

        // Sincronizar datos en el usuario del demandante (si tiene cuenta)
        $actorDemandante = ExpedienteActor::where('expediente_id', $expediente->id)
            ->whereHas('tipoActor', fn($q) => $q->where('slug', 'demandante'))
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
            ->whereHas('tipoActor', fn($q) => $q->where('slug', 'demandado'))
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

        $request->validate([
            'resultado'                            => 'required|in:conforme,no_conforme',
            'motivo_no_conformidad'                => 'required_if:resultado,no_conforme|nullable|string|max:2000',
            'movimientos'                             => 'nullable|array|max:10',
            'movimientos.*.tipo'                      => 'nullable|in:requerimiento,propia,notificacion',
            'movimientos.*.etapa_id'                  => 'required|exists:etapas,id',
            'movimientos.*.sub_etapa_id'              => 'nullable|exists:sub_etapas,id',
            'movimientos.*.instruccion'               => 'required|string|max:2000',
            'movimientos.*.tipo_actor_responsable_id' => 'nullable|exists:tipos_actor_expediente,id',
            'movimientos.*.usuario_responsable_id'    => 'nullable|exists:users,id',
            'movimientos.*.dias_plazo'                => 'nullable|integer|min:1|max:365',
            'movimientos.*.tipo_documento_requerido_id' => 'nullable|exists:tipo_documentos,id',
            'movimientos.*.enviar_credenciales'       => 'nullable|boolean',
            'movimientos.*.actor_credenciales_id'     => 'nullable|exists:expediente_actores,id',
            'movimientos.*.notificar_a'               => 'nullable|array',
            'movimientos.*.notificar_a.*'             => 'integer|exists:expediente_actores,id',
            'documentos'                              => 'nullable|array',
            'documentos.*'                            => 'nullable|array',
            'documentos.*.*'                          => 'file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240',
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
                if ($tipo === 'notificacion') {
                    $estadoMov = 'recibido';
                } elseif (empty($datos['usuario_responsable_id'])) {
                    $estadoMov = 'respondido';
                } else {
                    $estadoMov = 'pendiente';
                }
                $this->movimientoService->crear(
                    $expediente,
                    [
                        'tipo'                        => $tipo,
                        'etapa_id'                    => $datos['etapa_id'],
                        'sub_etapa_id'                => $datos['sub_etapa_id'] ?: null,
                        'tipo_actor_responsable_id'   => $datos['tipo_actor_responsable_id'] ?: null,
                        'usuario_responsable_id'      => $datos['usuario_responsable_id'] ?: null,
                        'instruccion'                 => $datos['instruccion'],
                        'dias_plazo'                  => $datos['dias_plazo'] ?: null,
                        'tipo_documento_requerido_id' => $datos['tipo_documento_requerido_id'] ?? null,
                        'enviar_credenciales'         => !empty($datos['enviar_credenciales']),
                        'actor_credenciales_id'       => $datos['actor_credenciales_id'] ?? null,
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
