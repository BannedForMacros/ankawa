<?php

namespace App\Http\Controllers;

use App\Models\Expediente;
use App\Models\ExpedienteActor;
use App\Models\ExpedienteMovimiento;
use App\Models\MovimientoResponsable;
use App\Models\SolicitudArbitraje;
use App\Models\SolicitudJPRD;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

class DashboardController extends Controller
{
    /**
     * Slugs de tipo de actor que cumplen un papel resolutivo (árbitro / adjudicador).
     * El bloque "arbitral" del dashboard se enciende si la persona participa con
     * alguno de estos papeles en algún expediente — independiente de su rol de sistema.
     */
    private const SLUGS_ARBITRO = [
        'arbitro_unico', 'presidente_tribunal', 'presidente_de_tribunal_arbitral',
        'arbitro_emergencia', 'arbitro_de_parte',
        'adjudicador_unico', 'adjudicador_de_parte', 'presidente_de_la_jprd',
    ];

    public function index()
    {
        $user          = auth()->user();
        $rol           = $user->rol;
        $puedeVerTodos = (bool) ($rol?->puede_ver_todos_expedientes ?? false);

        // ── Anclas de "lo mío": el trabajo se ancla en expediente_actores, no en el rol ──
        $misActorIds      = ExpedienteActor::where('usuario_id', $user->id)->where('activo', 1)->pluck('id');
        $misExpedienteIds = ExpedienteActor::where('usuario_id', $user->id)->where('activo', 1)
            ->pluck('expediente_id')->unique()->values();

        // Señales que encienden bloques (composición por trabajo real, no por etiqueta de rol)
        $casosGestorIds = ExpedienteActor::where('usuario_id', $user->id)
            ->where('es_gestor', true)->where('activo', 1)->pluck('expediente_id')->unique()->values();
        $esGestor = $casosGestorIds->isNotEmpty();

        $misActoresArbitro = ExpedienteActor::where('usuario_id', $user->id)->where('activo', 1)
            ->whereHas('tipoActor', fn ($q) => $q->whereIn('slug', self::SLUGS_ARBITRO))
            ->get(['id', 'expediente_id']);
        $esArbitral       = $misActoresArbitro->isNotEmpty();
        $arbitroActorIds  = $misActoresArbitro->pluck('id');
        $arbitroExpIds    = $misActoresArbitro->pluck('expediente_id')->unique()->values();

        // ── Formateadores de filas de lista ──────────────────────────────────
        $fmtMov = function (ExpedienteMovimiento $m) {
            return [
                'id'             => $m->id,
                'expediente_id'  => $m->expediente_id,
                'expediente'     => $m->expediente?->numero_expediente,
                'instruccion'    => Str::limit($m->instruccion, 90),
                'tipo'           => $m->tipo,
                'fecha_limite'   => $m->fecha_limite?->toDateString(),
                'dias_restantes' => $m->fecha_limite
                    ? Carbon::today()->diffInDays($m->fecha_limite->copy()->startOfDay(), false)
                    : null,
            ];
        };
        $fmtResp = function (MovimientoResponsable $r) {
            $fl = $r->fecha_limite ? Carbon::parse($r->fecha_limite) : null;
            return [
                'id'             => $r->id,
                'expediente_id'  => $r->movimiento?->expediente_id,
                'expediente'     => $r->movimiento?->expediente?->numero_expediente,
                'instruccion'    => Str::limit($r->movimiento?->instruccion ?? '', 90),
                'fecha_limite'   => $fl?->toDateString(),
                'dias_restantes' => $fl ? Carbon::today()->diffInDays($fl->startOfDay(), false) : null,
            ];
        };

        // ── Bloque PERSONAL (siempre): movimientos donde soy responsable ──────
        $misMovPendientes = function () use ($user, $misActorIds) {
            return ExpedienteMovimiento::query()
                ->where('estado', 'pendiente')->where('activo', true)
                ->where(function ($q) use ($user, $misActorIds) {
                    $q->where('usuario_responsable_id', $user->id);
                    if ($misActorIds->isNotEmpty()) {
                        $q->orWhereHas('responsables', fn ($q2) =>
                            $q2->whereIn('expediente_actor_id', $misActorIds)->where('estado', 'pendiente'));
                    }
                });
        };

        $personal = [
            'mis_expedientes' => Expediente::where('estado', 'activo')->whereIn('id', $misExpedienteIds)->count(),
            'mis_pendientes'  => $misMovPendientes()->count(),
            'por_vencer'      => $misMovPendientes()->whereNotNull('fecha_limite')
                ->whereDate('fecha_limite', '>=', now()->toDateString())
                ->whereDate('fecha_limite', '<=', now()->addDays(3)->toDateString())->count(),
            'vencidos'        => $misMovPendientes()->whereNotNull('fecha_limite')
                ->whereDate('fecha_limite', '<', now()->toDateString())->count(),
            'por_vencer_lista' => $misMovPendientes()->whereNotNull('fecha_limite')
                ->with('expediente:id,numero_expediente')->orderBy('fecha_limite')->limit(8)
                ->get()->map($fmtMov)->values(),
        ];

        // ── Bloque GLOBAL (visión institucional) — solo puede_ver_todos ───────
        $global = null;
        if ($puedeVerTodos) {
            $porRevisar = SolicitudArbitraje::where('estado', 'pendiente')->count()
                        + SolicitudJPRD::where('estado', 'pendiente')->count();
            $enSubsanacion = SolicitudArbitraje::where('estado', 'subsanacion')->count()
                           + SolicitudJPRD::where('estado', 'subsanacion')->count();
            $sinGestor = Expediente::where('estado', 'activo')
                ->whereDoesntHave('actores', fn ($q) => $q->where('es_gestor', true)->where('activo', 1))
                ->count();

            $global = [
                'expedientes_activos' => Expediente::where('estado', 'activo')->count(),
                'vencidos'            => ExpedienteMovimiento::where('estado', 'pendiente')->where('activo', true)
                    ->whereNotNull('fecha_limite')->whereDate('fecha_limite', '<', now()->toDateString())->count(),
                'admision' => [
                    'por_revisar'    => $porRevisar,
                    'en_subsanacion' => $enSubsanacion,
                    'sin_gestor'     => $sinGestor,
                ],
                'por_servicio'  => DB::table('expedientes as e')
                    ->join('servicios as s', 's.id', '=', 'e.servicio_id')
                    ->where('e.estado', 'activo')
                    ->groupBy('s.nombre')
                    ->select('s.nombre as label', DB::raw('count(*) as total'))
                    ->orderByDesc('total')->get(),
                'carga_gestores' => DB::table('expediente_actores as ea')
                    ->join('expedientes as e', function ($j) {
                        $j->on('e.id', '=', 'ea.expediente_id')->where('e.estado', '=', 'activo');
                    })
                    ->join('users as u', 'u.id', '=', 'ea.usuario_id')
                    ->where('ea.es_gestor', true)->where('ea.activo', 1)
                    ->groupBy('u.name')
                    ->select('u.name as label', DB::raw('count(distinct e.id) as total'))
                    ->orderByDesc('total')->limit(8)->get(),
                'cargos_mes'    => $this->serieCargosUltimosMeses(6),
                'urgentes'      => ExpedienteMovimiento::where('estado', 'pendiente')->where('activo', true)
                    ->whereNotNull('fecha_limite')
                    ->with('expediente:id,numero_expediente')
                    ->orderBy('fecha_limite')->limit(6)->get()->map($fmtMov)->values(),
                'recientes'     => Expediente::with('servicio:id,nombre', 'etapaActual:id,nombre')
                    ->orderByDesc('id')->limit(6)->get()->map(fn ($e) => [
                        'id'     => $e->id,
                        'numero' => $e->numero_expediente,
                        'servicio' => $e->servicio?->nombre,
                        'etapa'  => $e->etapaActual?->nombre,
                        'estado' => $e->estado,
                    ])->values(),
            ];
        }

        // ── Bloque GESTOR — si es es_gestor en algún expediente ───────────────
        $gestor = null;
        if ($esGestor) {
            $gestor = [
                'mis_casos'          => Expediente::where('estado', 'activo')->whereIn('id', $casosGestorIds)->count(),
                'envios_por_aceptar' => ExpedienteMovimiento::where('estado', 'pendiente_aceptacion')
                    ->whereIn('expediente_id', $casosGestorIds)->count(),
                'por_etapa' => DB::table('expedientes as e')
                    ->leftJoin('etapas as et', 'et.id', '=', 'e.etapa_actual_id')
                    ->whereIn('e.id', $casosGestorIds)->where('e.estado', 'activo')
                    ->groupBy('et.nombre')
                    ->select(DB::raw("coalesce(et.nombre,'Sin etapa') as label"), DB::raw('count(*) as total'))
                    ->orderByDesc('total')->get(),
                'por_vencer_lista' => ExpedienteMovimiento::where('estado', 'pendiente')->where('activo', true)
                    ->whereIn('expediente_id', $casosGestorIds)->whereNotNull('fecha_limite')
                    ->with('expediente:id,numero_expediente')->orderBy('fecha_limite')->limit(8)
                    ->get()->map($fmtMov)->values(),
            ];
        }

        // ── Bloque ARBITRAL — si participa como árbitro/adjudicador ───────────
        $arbitral = null;
        if ($esArbitral) {
            $arbitral = [
                'mis_casos' => Expediente::where('estado', 'activo')->whereIn('id', $arbitroExpIds)->count(),
                'conformidad_pendiente' => Expediente::where('estado', 'activo')
                    ->whereIn('id', $arbitroExpIds)
                    ->whereHas('etapaActual', fn ($q) => $q->where('requiere_conformidad', true))
                    ->with('servicio:id,nombre', 'etapaActual:id,nombre')
                    ->limit(8)->get()->map(fn ($e) => [
                        'id'       => $e->id,
                        'numero'   => $e->numero_expediente,
                        'servicio' => $e->servicio?->nombre,
                        'etapa'    => $e->etapaActual?->nombre,
                    ])->values(),
                'plazos' => MovimientoResponsable::whereIn('expediente_actor_id', $arbitroActorIds)
                    ->where('estado', 'pendiente')->whereNotNull('fecha_limite')
                    ->with('movimiento:id,expediente_id,instruccion', 'movimiento.expediente:id,numero_expediente')
                    ->orderBy('fecha_limite')->limit(8)->get()->map($fmtResp)->values(),
            ];
        }

        return Inertia::render('Dashboard', [
            'perfil' => [
                'nombre'          => $user->name,
                'rol'             => $rol?->slug,
                'rol_nombre'      => $rol?->nombre,
                'puede_ver_todos' => $puedeVerTodos,
                'bloques'         => [
                    'global'   => $puedeVerTodos,
                    'gestor'   => $esGestor,
                    'arbitral' => $esArbitral,
                ],
            ],
            'personal' => $personal,
            'global'   => $global,
            'gestor'   => $gestor,
            'arbitral' => $arbitral,
        ]);
    }

    /**
     * Serie de cargos emitidos por mes, rellenando los meses sin datos con 0
     * para que el gráfico muestre el rango completo.
     */
    private function serieCargosUltimosMeses(int $meses): array
    {
        $desde = now()->startOfMonth()->subMonths($meses - 1);

        $conteos = DB::table('cargos')
            ->where('created_at', '>=', $desde)
            ->groupBy(DB::raw("to_char(created_at, 'YYYY-MM')"))
            ->select(DB::raw("to_char(created_at, 'YYYY-MM') as ym"), DB::raw('count(*) as total'))
            ->pluck('total', 'ym');

        $serie = [];
        for ($i = 0; $i < $meses; $i++) {
            $m = $desde->copy()->addMonths($i);
            $serie[] = [
                'label' => ucfirst($m->locale('es')->isoFormat('MMM')),
                'total' => (int) ($conteos[$m->format('Y-m')] ?? 0),
            ];
        }
        return $serie;
    }
}
