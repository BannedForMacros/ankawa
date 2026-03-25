<?php

namespace App\Http\Controllers;

use App\Models\Expediente;
use App\Models\Etapa;
use App\Models\SubEtapa;
use App\Models\TipoActorExpediente;
use App\Models\ServicioTipoActor;
use App\Models\User;
use App\Services\GestorExpedienteService;
use App\Services\NotificacionService;
use App\Services\VencimientoService;
use App\Services\EtapaService;
use Inertia\Inertia;

class ExpedienteController extends Controller
{
    public function __construct(
        private GestorExpedienteService $gestorService,
        private NotificacionService $notificacionService,
        private VencimientoService $vencimientoService,
        private EtapaService $etapaService,
    ) {}

    // ── Todos los expedientes (solo roles con puede_ver_todos_expedientes) ──
    public function index()
    {
        $user = auth()->user();

        $query = Expediente::with(['servicio', 'etapaActual', 'gestor.usuario'])
            ->orderByDesc('created_at');

        // Si el rol NO tiene puede_ver_todos_expedientes, solo ve los suyos
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

    // ── Mis expedientes (donde el usuario es actor) ──
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

    // ── Visor del expediente (4 pestañas) ──
    public function show(Expediente $expediente)
    {
        $user = auth()->user();

        $expediente->load([
            'solicitud.documentos',
            'servicio',
            'etapaActual',
            'actores.usuario',
            'actores.tipoActor',
            'movimientos' => fn($q) => $q->where('activo', true)
                ->orderByDesc('created_at')
                ->with([
                    'etapa', 'subEtapa',
                    'tipoActorResponsable',
                    'usuarioResponsable',
                    'creadoPor', 'respondidoPor',
                    'documentos.subidoPor',
                ]),
        ]);

        $esGestor = $this->gestorService->esGestor($expediente, $user->id);
        $puedeDesignarGestor = $user->rol?->puede_designar_gestor ?? false;

        // Movimientos pendientes donde el usuario actual es responsable
        $miAccionPendiente = $expediente->movimientos
            ->where('estado', 'pendiente')
            ->where('usuario_responsable_id', $user->id)
            ->first();

        // Etapas y sub-etapas del servicio (para el form de nuevo movimiento)
        $etapas = $this->etapaService->etapasDelServicio($expediente->servicio_id);

        // Tipos de actor del servicio (para asignar responsable)
        $tiposActorIds = ServicioTipoActor::where('servicio_id', $expediente->servicio_id)
            ->where('activo', 1)
            ->pluck('tipo_actor_id');

        $tiposActor = TipoActorExpediente::whereIn('id', $tiposActorIds)
            ->where('activo', 1)
            ->get(['id', 'nombre', 'slug']);

        // Usuarios asignables (no-usuarios)
        $usuariosAsignables = User::where('activo', 1)
            ->whereHas('rol', fn($q) => $q->whereNotIn('slug', ['usuario']))
            ->with('rol:id,nombre,slug')
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'rol_id']);

        // Actores notificables (todos los activos con email)
        $actoresNotificables = $this->notificacionService->actoresNotificables($expediente->id);

        // Resumen de plazos
        $plazo = $this->vencimientoService->resumen($expediente->id);

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
        ]);
    }
}
