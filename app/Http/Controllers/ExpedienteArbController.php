<?php

namespace App\Http\Controllers;

use App\Models\Actividad;
use App\Models\Correlativo;
use App\Models\ExpedienteArb;
use App\Models\ExpedienteArbArbitro;
use App\Models\ExpedienteArbMovimiento;
use App\Models\ExpedienteArbNotificacion;
use App\Models\ExpedienteArbPlazo;
use App\Models\ExpedienteArbSubsanacion;
use App\Models\ExpedienteArbUsuario;
use App\Models\SolicitudArbitraje;
use App\Models\Documento;
use App\Models\User;
use App\Traits\GuardaMovimiento;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class ExpedienteArbController extends Controller
{
    use GuardaMovimiento;

    // ─────────────────────────────────────────────
    // HELPERS PRIVADOS
    // ─────────────────────────────────────────────

    private function rolActual(): string
    {
        return Auth::user()->rol->slug ?? '';
    }

    private function validarDocumento(Request $request, array $extra = []): void
    {
        $request->validate(array_merge([
            'descripcion' => 'required|string|max:2000',
            'documento'   => 'required|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240',
        ], $extra));
    }

    private function registrarNotificacion(
        string $nombre,
        string $email,
        string $asunto,
        string $tipo,
        ?int   $expedienteId = null,
        ?int   $solicitudId  = null,
        ?int   $actividadId  = null,
    ): void {
        ExpedienteArbNotificacion::create([
            'expediente_id'       => $expedienteId,
            'solicitud_id'        => $solicitudId,
            'actividad_id'        => $actividadId,
            'enviado_por'         => Auth::id(),
            'destinatario_nombre' => $nombre,
            'destinatario_email'  => $email,
            'asunto'              => $asunto,
            'tipo'                => $tipo,
            'estado_envio'        => 'enviado',
            'activo'              => true,
        ]);
    }

    private function crearPlazo(int $expedienteId, Actividad $actividad): void
    {
        if ($actividad->dias_plazo > 0) {
            ExpedienteArbPlazo::create([
                'expediente_id'     => $expedienteId,
                'actividad_id'      => $actividad->id,
                'fecha_inicio'      => now()->toDateString(),
                'fecha_vencimiento' => now()->addWeekdays($actividad->dias_plazo)->toDateString(),
                'dias_plazo'        => $actividad->dias_plazo,
                'estado'            => 'pendiente',
                'activo'            => true,
            ]);
        }
    }

    private function cerrarPlazo(int $expedienteId, int $actividadId): void
    {
        ExpedienteArbPlazo::where('expediente_id', $expedienteId)
            ->where('actividad_id', $actividadId)
            ->where('estado', 'pendiente')
            ->update(['estado' => 'completado', 'fecha_completado' => now()]);
    }

    // ─────────────────────────────────────────────
    // INDEX — lista de expedientes
    // ─────────────────────────────────────────────

    public function index()
    {
        $user    = Auth::user();
        $rolSlug = $this->rolActual();

        $query = ExpedienteArb::with(['solicitud', 'servicio', 'etapaActual', 'actividadActual'])
            ->where('activo', true);

        // Cliente solo ve los suyos
        if ($rolSlug === 'cliente') {
            $query->whereHas('usuarios', fn($q) =>
                $q->where('usuario_id', $user->id)->where('activo', true)
            );
        }

        $expedientes = $query->orderByDesc('created_at')->get()->map(fn($e) => [
            'id'                => $e->id,
            'numero_expediente' => $e->numero_expediente,
            'servicio'          => $e->servicio->nombre,
            'nombre_demandante' => $e->solicitud->nombre_demandante,
            'nombre_demandado'  => $e->solicitud->nombre_demandado,
            'etapa_actual'      => $e->etapaActual?->nombre,
            'actividad_actual'  => $e->actividadActual?->nombre,
            'estado'            => $e->estado,
            'tiene_subsanacion' => (bool) $e->tiene_subsanacion,
            'fecha_inicio'      => $e->fecha_inicio,
            'dias_en_proceso'   => now()->diffInDays($e->fecha_inicio),
        ]);

        // Solicitudes pendientes (para roles de secretaría — solo en bandeja)
        $solicitudesPendientes = [];
        if (in_array($rolSlug, ['secretaria_general_adjunta', 'secretario_general', 'director'])) {
            $solicitudesPendientes = SolicitudArbitraje::with('servicio')
                ->whereIn('estado', ['pendiente', 'subsanacion'])
                ->whereDoesntHave('expediente')
                ->orderByDesc('created_at')
                ->get()
                ->map(fn($s) => [
                    'id'                => $s->id,
                    'numero_cargo'      => $s->numero_cargo,
                    'servicio'          => $s->servicio->nombre,
                    'nombre_demandante' => $s->nombre_demandante,
                    'email_demandante'  => $s->email_demandante,
                    'nombre_demandado'  => $s->nombre_demandado,
                    'monto_involucrado' => $s->monto_involucrado,
                    'estado'            => $s->estado,
                    'tiene_subsanacion' => $s->tieneSusanacionPendiente(),
                    'created_at'        => $s->created_at->format('d/m/Y H:i'),
                ]);
        }

        return Inertia::render('Expedientes/Index', [
            'expedientes'           => $expedientes,
            'solicitudesPendientes' => $solicitudesPendientes,
            'rolActual'             => $rolSlug,
        ]);
    }

    // ─────────────────────────────────────────────
    // SHOW — detalle del expediente
    // ─────────────────────────────────────────────

    public function show(ExpedienteArb $expediente)
    {
        $user    = Auth::user();
        $rolSlug = $this->rolActual();

        // Cliente solo ve el suyo
        if ($rolSlug === 'cliente') {
            abort_if(
                !$expediente->usuarios()->where('usuario_id', $user->id)->where('activo', true)->exists(),
                403
            );
        }

        $expediente->load([
            'solicitud.servicio.etapas.actividades.roles',  // etapas completas con roles
            'solicitud.documentos',
            'solicitud.movimientos.registradoPor',
            'solicitud.movimientos.documentos',
            'etapaActual',
            'actividadActual.roles',
            'actividadActual.etapa',
            'usuarios.usuario.rol',
            'arbitros.usuario',
            'arbitros.designadoPor',
            'plazos.actividad',
            'movimientos.registradoPor',
            'movimientos.documentos',
            'movimientos.etapaDestino',
            'movimientos.actividadDestino',
        ]);

        // ¿Puede actuar el rol actual en la actividad actual?
        $puedeActuar = false;
        if ($expediente->actividadActual) {
            $puedeActuar = $expediente->actividadActual->roles
                ->contains('id', $user->rol_id);
        }

        // Siguiente actividad
        $siguienteActividadModel = $this->calcularSiguienteActividad($expediente);
        $siguienteActividad = $siguienteActividadModel ? [
            'id'           => $siguienteActividadModel->id,
            'nombre'       => $siguienteActividadModel->nombre,
            'etapa_nombre' => $siguienteActividadModel->etapa->nombre ?? null,
        ] : null;

        // Árbitros disponibles
        $arbitrosDisponibles = [];
        if (in_array($rolSlug, ['director', 'secretario_general'])) {
            $arbitrosDisponibles = User::whereHas('rol', fn($q) => $q->where('slug', 'arbitro'))
                ->where('activo', true)
                ->get(['id', 'name', 'email']);
        }

        // Plazo activo
        $plazoActual = $expediente->actividadActual
            ? $expediente->plazos
                ->where('actividad_id', $expediente->actividad_actual_id)
                ->where('estado', 'pendiente')
                ->first()
            : null;

        // Mapear movimientos con actividad_id para el frontend
        $movimientos = $expediente->movimientos->map(fn($m) => [
            'id'               => $m->id,
            'tipo'             => $m->tipo,
            'descripcion'      => $m->descripcion,
            'actividad_id'     => $m->actividad_id,
            'autor'            => $m->registradoPor?->name,
            'actividad_destino'=> $m->actividadDestino?->nombre,
            'created_at'       => $m->created_at->format('d/m/Y H:i'),
            'documento'        => $m->documentos->first() ? [
                'nombre' => $m->documentos->first()->nombre_original,
                'ruta'   => $m->documentos->first()->ruta_archivo,
            ] : null,
        ]);

        // Movimientos Etapa 1 (de la solicitud)
        $movimientosSolicitud = $expediente->solicitud->movimientos->map(fn($m) => [
            'id'          => $m->id,
            'tipo'        => $m->tipo,
            'descripcion' => $m->descripcion,
            'autor'       => $m->registradoPor?->name,
            'created_at'  => $m->created_at->format('d/m/Y H:i'),
            'documento'   => $m->documentos->first() ? [
                'nombre' => $m->documentos->first()->nombre_original,
                'ruta'   => $m->documentos->first()->ruta_archivo,
            ] : null,
        ]);

        // Etapas con actividades y roles (para el acordeón)
        $etapas = $expediente->solicitud->servicio->etapas
            ->sortBy('orden')
            ->map(fn($etapa) => [
                'id'     => $etapa->id,
                'nombre' => $etapa->nombre,
                'orden'  => $etapa->orden,
                'actividades' => $etapa->actividades
                    ->sortBy('orden')
                    ->map(fn($a) => [
                        'id'        => $a->id,
                        'nombre'    => $a->nombre,
                        'orden'     => $a->orden,
                        'dias_plazo'=> $a->dias_plazo,
                        'roles'     => $a->roles->map(fn($r) => [
                            'id'     => $r->id,
                            'nombre' => $r->nombre,
                        ])->values(),
                    ])->values(),
            ])->values();

        return Inertia::render('Expedientes/Show', [
            'expediente' => [
                'id'                  => $expediente->id,
                'numero_expediente'   => $expediente->numero_expediente,
                'estado'              => $expediente->estado,
                'tiene_subsanacion'   => (bool) $expediente->tiene_subsanacion,
                'fecha_inicio'        => $expediente->fecha_inicio,
                'etapa_actual_id'     => $expediente->etapa_actual_id,
                'actividad_actual_id' => $expediente->actividad_actual_id,
                'etapaActual'         => $expediente->etapaActual ? [
                    'id'     => $expediente->etapaActual->id,
                    'nombre' => $expediente->etapaActual->nombre,
                ] : null,
                'actividadActual'     => $expediente->actividadActual ? [
                    'id'     => $expediente->actividadActual->id,
                    'nombre' => $expediente->actividadActual->nombre,
                ] : null,
                'solicitud' => [
                    'id'                  => $expediente->solicitud->id,
                    'numero_cargo'        => $expediente->solicitud->numero_cargo,
                    'nombre_demandante'   => $expediente->solicitud->nombre_demandante,
                    'email_demandante'    => $expediente->solicitud->email_demandante,
                    'nombre_demandado'    => $expediente->solicitud->nombre_demandado,
                    'email_demandado'     => $expediente->solicitud->email_demandado,
                    'monto_involucrado'   => $expediente->solicitud->monto_involucrado,
                    'resumen_controversia'=> $expediente->solicitud->resumen_controversia,
                    'servicio'            => [
                        'nombre' => $expediente->solicitud->servicio->nombre,
                    ],
                    'movimientos' => $movimientosSolicitud,
                ],
                'arbitros'   => $expediente->arbitros->map(fn($a) => [
                    'id'               => $a->id,
                    'nombre_arbitro'   => $a->nombre_arbitro,
                    'email_arbitro'    => $a->email_arbitro,
                    'tipo_designacion' => $a->tipo_designacion,
                    'estado_aceptacion'=> $a->estado_aceptacion,
                ])->values(),
                'movimientos' => $movimientos,
            ],
            'etapas'              => $etapas,
            'puedeActuar'         => $puedeActuar,
            'siguienteActividad'  => $siguienteActividad,
            'arbitrosDisponibles' => $arbitrosDisponibles,
            'plazoActual'         => $plazoActual ? [
                'actividad'          => ['nombre' => $plazoActual->actividad?->nombre],
                'fecha_vencimiento'  => $plazoActual->fecha_vencimiento,
                'dias_plazo'         => $plazoActual->dias_plazo,
            ] : null,
            'rolActual' => $rolSlug,
        ]);
    }

    private function calcularSiguienteActividad(ExpedienteArb $expediente): ?Actividad
    {
        if (!$expediente->actividadActual) return null;

        // Siguiente en la misma etapa
        $siguiente = $expediente->actividadActual->etapa
            ->actividades()
            ->where('orden', '>', $expediente->actividadActual->orden)
            ->where('activo', true)
            ->orderBy('orden')
            ->first();

        if ($siguiente) return $siguiente;

        // Primera actividad de la siguiente etapa
        $siguienteEtapa = $expediente->solicitud->servicio
            ->etapas()
            ->where('orden', '>', $expediente->etapaActual->orden)
            ->where('activo', true)
            ->orderBy('orden')
            ->with(['actividades' => fn($q) => $q->where('activo', true)->orderBy('orden')])
            ->first();

        return $siguienteEtapa?->actividades->first();
    }

    // ─────────────────────────────────────────────
    // ACCIONES SOBRE SOLICITUD (Etapa 1 — antes de expediente)
    // ─────────────────────────────────────────────

    // ADMITIR — crea el expediente
    public function admitir(Request $request, SolicitudArbitraje $solicitud)
    {
        // Admitir NO requiere documento aquí — la secretaria actúa desde Show.jsx
        $request->validate([
            'observacion' => 'nullable|string|max:1000',
        ]);

        DB::beginTransaction();
        try {
            // Generar número correlativo
            $anio        = now()->year;
            $correlativo = Correlativo::where('tipo', 'EXP-ARB')
                ->where('anio', $anio)
                ->lockForUpdate()
                ->firstOrCreate(
                    ['tipo' => 'EXP-ARB', 'anio' => $anio],
                    ['ultimo_numero' => 0, 'activo' => 1]
                );
            $correlativo->increment('ultimo_numero');
            $numeroExp = 'EXP-ARB-' . str_pad($correlativo->ultimo_numero, 4, '0', STR_PAD_LEFT) . '-' . $anio;

            // Primera etapa y actividad configuradas para este servicio
            $primeraEtapa     = $solicitud->servicio->etapas()->where('activo', true)->orderBy('orden')->first();
            $primeraActividad = $primeraEtapa?->actividades()->where('activo', true)->orderBy('orden')->first();

            // Crear expediente
            $expediente = ExpedienteArb::create([
                'solicitud_id'        => $solicitud->id,
                'servicio_id'         => $solicitud->servicio_id,
                'numero_expediente'   => $numeroExp,
                'etapa_actual_id'     => $primeraEtapa?->id,
                'actividad_actual_id' => $primeraActividad?->id,
                'estado'              => 'admitido',
                'tiene_subsanacion'   => false,
                'fecha_inicio'        => now()->toDateString(),
                'activo'              => true,
            ]);

            // Transferir movimientos de Etapa 1 (solicitud) al expediente
            ExpedienteArbMovimiento::where('solicitud_id', $solicitud->id)
                ->update(['expediente_id' => $expediente->id]);

            // Movimiento de admisión
            ExpedienteArbMovimiento::create([
                'expediente_id'        => $expediente->id,
                'solicitud_id'         => $solicitud->id,
                'registrado_por'       => Auth::id(),
                'etapa_destino_id'     => $primeraEtapa?->id,
                'actividad_destino_id' => $primeraActividad?->id,
                'tipo'                 => 'admision',
                'descripcion'          => $request->observacion ?? 'Solicitud admitida a trámite.',
                'activo'               => true,
            ]);

            // Vincular demandante
            $demandante = User::where('email', $solicitud->email_demandante)->first();
            if ($demandante) {
                ExpedienteArbUsuario::create([
                    'expediente_id'     => $expediente->id,
                    'usuario_id'        => $demandante->id,
                    'rol_en_expediente' => 'demandante',
                    'activo'            => true,
                ]);
            }

            // Crear plazo de primera actividad
            if ($primeraActividad) {
                $this->crearPlazo($expediente->id, $primeraActividad);
            }

            $solicitud->update(['estado' => 'admitida']);

            // Emails
            Mail::send('emails.arb.admision', [
                'solicitud'        => $solicitud,
                'numeroExpediente' => $numeroExp,
            ], fn($m) => $m
                ->to($solicitud->email_demandante, $solicitud->nombre_demandante)
                ->subject('Ankawa — Solicitud Admitida: ' . $numeroExp)
            );

            Mail::send('emails.arb.notif-demandado-admision', [
                'solicitud'        => $solicitud,
                'numeroExpediente' => $numeroExp,
            ], fn($m) => $m
                ->to($solicitud->email_demandado, $solicitud->nombre_demandado)
                ->subject('Ankawa — Ha sido notificado en proceso arbitral: ' . $numeroExp)
            );

            $this->registrarNotificacion($solicitud->nombre_demandante, $solicitud->email_demandante, 'Solicitud admitida: ' . $numeroExp, 'admision', $expediente->id, $solicitud->id);
            $this->registrarNotificacion($solicitud->nombre_demandado,  $solicitud->email_demandado,  'Notificación de demanda: ' . $numeroExp, 'notif_demandado', $expediente->id, $solicitud->id);

            DB::commit();
            return back()->with('success', 'Solicitud admitida. Expediente ' . $numeroExp . ' generado.');

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('admitir: ' . $e->getMessage() . ' | ' . $e->getLine());
            return back()->withErrors(['general' => $e->getMessage()]);
        }
    }

    // OBSERVAR — solicita subsanación al demandante
    public function observar(Request $request, SolicitudArbitraje $solicitud)
    {
        $request->validate([
            'descripcion' => 'required|string|max:2000',
            'plazo_dias'  => 'required|integer|min:1|max:30',
            'documento'   => 'required|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240',
        ]);

        DB::beginTransaction();
        try {
            $fechaLimite = now()->addWeekdays($request->plazo_dias);

            // Crear subsanación
            ExpedienteArbSubsanacion::create([
                'solicitud_id'   => $solicitud->id,
                'registrado_por' => Auth::id(),
                'observacion'    => $request->descripcion,
                'plazo_dias'     => $request->plazo_dias,
                'fecha_limite'   => $fechaLimite->toDateString(),
                'estado'         => 'pendiente',
                'activo'         => true,
            ]);

            // Guardar movimiento con documento
            $this->guardarMovimiento(
                tipo:        'observacion',
                descripcion: $request->descripcion,
                archivo:     $request->file('documento'),
                solicitudId: $solicitud->id,
            );

            $solicitud->update(['estado' => 'subsanacion']);

            Mail::send('emails.arb.subsanacion', [
                'solicitud'   => $solicitud,
                'observacion' => $request->descripcion,
                'plazo_dias'  => $request->plazo_dias,
                'fechaLimite' => $fechaLimite->format('d/m/Y'),
            ], fn($m) => $m
                ->to($solicitud->email_demandante, $solicitud->nombre_demandante)
                ->subject('Ankawa — Su solicitud requiere corrección: ' . $solicitud->numero_cargo)
            );

            $this->registrarNotificacion($solicitud->nombre_demandante, $solicitud->email_demandante, 'Solicitud requiere subsanación: ' . $solicitud->numero_cargo, 'subsanacion', null, $solicitud->id);

            DB::commit();
            return back()->with('success', 'Observación registrada. El demandante tiene ' . $request->plazo_dias . ' días hábiles.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['general' => $e->getMessage()]);
        }
    }

    // RECHAZAR — rechaza la solicitud
    public function rechazar(Request $request, SolicitudArbitraje $solicitud)
    {
        $request->validate([
            'descripcion' => 'required|string|max:2000',
            'documento'   => 'required|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240',
        ]);

        DB::beginTransaction();
        try {
            $this->guardarMovimiento(
                tipo:        'rechazo',
                descripcion: $request->descripcion,
                archivo:     $request->file('documento'),
                solicitudId: $solicitud->id,
            );

            $solicitud->update([
                'estado'         => 'rechazada',
                'motivo_rechazo' => $request->descripcion,
            ]);

            Mail::send('emails.arb.rechazo', [
                'solicitud' => $solicitud,
                'motivo'    => $request->descripcion,
            ], fn($m) => $m
                ->to($solicitud->email_demandante, $solicitud->nombre_demandante)
                ->subject('Ankawa — Solicitud no admitida: ' . $solicitud->numero_cargo)
            );

            $this->registrarNotificacion($solicitud->nombre_demandante, $solicitud->email_demandante, 'Solicitud rechazada: ' . $solicitud->numero_cargo, 'rechazo', null, $solicitud->id);

            DB::commit();
            return back()->with('success', 'Solicitud rechazada y notificada.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['general' => $e->getMessage()]);
        }
    }

    // ─────────────────────────────────────────────
    // ACCIONES SOBRE EXPEDIENTE (desde Show.jsx)
    // ─────────────────────────────────────────────

    // REGISTRAR MOVIMIENTO — subir documento + descripción + avanzar actividad
    // Esta es la acción principal desde Show.jsx para cualquier rol autorizado
    public function registrarAccion(Request $request, ExpedienteArb $expediente)
    {
        $request->validate([
            'descripcion'          => 'required|string|max:2000',
            'documento'            => 'required|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240',
            'avanzar'              => 'boolean',            // ¿avanza a siguiente actividad?
            'actividad_destino_id' => 'nullable|exists:actividades,id',
            // Subsanación interna del expediente (distinto a la de solicitud)
            'crear_subsanacion'    => 'boolean',
            'plazo_dias'           => 'nullable|integer|min:1|max:365',
        ]);

        // Verificar que el rol puede actuar en la actividad actual
        $user = Auth::user();
        abort_if(
            !$expediente->actividadActual?->roles->contains('id', $user->rol_id),
            403,
            'Su rol no puede actuar en la actividad actual.'
        );

        abort_if($expediente->tiene_subsanacion, 422, 'El expediente tiene una subsanación pendiente.');

        DB::beginTransaction();
        try {
            $actividadActual = $expediente->actividadActual;

            // Guardar movimiento con documento
            $movimiento = $this->guardarMovimiento(
                tipo:         'accion',
                descripcion:  $request->descripcion,
                archivo:      $request->file('documento'),
                expedienteId: $expediente->id,
                etapaId:      $expediente->etapa_actual_id,
                actividadId:  $expediente->actividad_actual_id,
            );

            // Si se solicita crear subsanación interna
            if ($request->boolean('crear_subsanacion') && $request->plazo_dias) {
                ExpedienteArbSubsanacion::create([
                    'expediente_id'  => $expediente->id,
                    'actividad_id'   => $actividadActual->id,
                    'registrado_por' => Auth::id(),
                    'observacion'    => $request->descripcion,
                    'plazo_dias'     => $request->plazo_dias,
                    'fecha_limite'   => now()->addWeekdays($request->plazo_dias)->toDateString(),
                    'estado'         => 'pendiente',
                    'activo'         => true,
                ]);
                $expediente->update(['tiene_subsanacion' => true]);
            }

            // Si avanza a siguiente actividad
            if ($request->boolean('avanzar') && $request->actividad_destino_id) {
                $actividadDestino = Actividad::with('etapa')->find($request->actividad_destino_id);

                // Cerrar plazo actual
                $this->cerrarPlazo($expediente->id, $actividadActual->id);

                // Actualizar movimiento con destino
                $movimiento->update([
                    'etapa_destino_id'     => $actividadDestino->etapa_id,
                    'actividad_destino_id' => $actividadDestino->id,
                ]);

                // Mover expediente a siguiente actividad
                $expediente->update([
                    'etapa_actual_id'     => $actividadDestino->etapa_id,
                    'actividad_actual_id' => $actividadDestino->id,
                ]);

                // Crear plazo de nueva actividad
                $this->crearPlazo($expediente->id, $actividadDestino);
            }

            DB::commit();
            $msg = $request->boolean('avanzar') ? 'Acción registrada y expediente avanzado.' : 'Acción registrada correctamente.';
            return back()->with('success', $msg);

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['general' => $e->getMessage()]);
        }
    }

    // DESIGNAR ÁRBITRO
    public function designarArbitro(Request $request, ExpedienteArb $expediente)
    {
        $request->validate([
            'tipo_designacion' => 'required|in:unico,presidente,coarbitro',
            'nombre_arbitro'   => 'required|string|max:255',
            'email_arbitro'    => 'required|email|max:255',
            'usuario_id'       => 'nullable|exists:users,id',
        ]);

        DB::beginTransaction();
        try {
            ExpedienteArbArbitro::create([
                'expediente_id'     => $expediente->id,
                'usuario_id'        => $request->usuario_id,
                'nombre_arbitro'    => $request->nombre_arbitro,
                'email_arbitro'     => $request->email_arbitro,
                'tipo_designacion'  => $request->tipo_designacion,
                'designado_por'     => Auth::id(),
                'fecha_designacion' => now()->toDateString(),
                'estado_aceptacion' => 'pendiente',
                'activo'            => true,
            ]);

            ExpedienteArbMovimiento::create([
                'expediente_id'  => $expediente->id,
                'usuario_id'     => Auth::id(),
                'tipo'           => 'designacion_arbitro',
                'descripcion'    => 'Árbitro designado: ' . $request->nombre_arbitro . ' (' . $request->tipo_designacion . ')',
                'activo'         => true,
            ]);

            $this->registrarNotificacion($request->nombre_arbitro, $request->email_arbitro, 'Ankawa — Ha sido designado árbitro: ' . $expediente->numero_expediente, 'designacion_arbitro', $expediente->id);

            Mail::send('emails.arb.designacion-arbitro', [
                'expediente'    => $expediente,
                'nombreArbitro' => $request->nombre_arbitro,
                'tipo'          => $request->tipo_designacion,
            ], fn($m) => $m
                ->to($request->email_arbitro, $request->nombre_arbitro)
                ->subject('Ankawa — Designación como árbitro: ' . $expediente->numero_expediente)
            );

            DB::commit();
            return back()->with('success', 'Árbitro designado y notificado.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['general' => $e->getMessage()]);
        }
    }

    // ASIGNAR SECRETARIO ARBITRAL
    public function asignarSecretario(Request $request, ExpedienteArb $expediente)
    {
        $request->validate(['secretario_id' => 'required|exists:users,id']);

        DB::beginTransaction();
        try {
            // Desactivar secretario anterior
            ExpedienteArbUsuario::where('expediente_id', $expediente->id)
                ->where('rol_en_expediente', 'secretario_arb')
                ->update(['activo' => false]);

            ExpedienteArbUsuario::create([
                'expediente_id'     => $expediente->id,
                'usuario_id'        => $request->secretario_id,
                'rol_en_expediente' => 'secretario_arb',
                'activo'            => true,
            ]);

            $secretario = User::find($request->secretario_id);

            ExpedienteArbMovimiento::create([
                'expediente_id'  => $expediente->id,
                'registrado_por' => Auth::id(),
                'tipo'           => 'asignacion_secretario',
                'descripcion'    => 'Secretario Arbitral asignado: ' . $secretario->name,
                'activo'         => true,
            ]);

            DB::commit();
            return back()->with('success', 'Secretario Arbitral asignado.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['general' => $e->getMessage()]);
        }
    }
}