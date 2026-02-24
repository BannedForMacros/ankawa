<?php

namespace App\Http\Controllers;

use App\Models\ExpedienteArb;
use App\Models\ExpedienteArbMovimiento;
use App\Models\ExpedienteArbSubsanacion;
use App\Models\ExpedienteArbNotificacion;
use App\Models\ExpedienteArbUsuario;
use App\Models\ExpedienteArbPlazo;
use App\Models\SolicitudArbitraje;
use App\Models\Correlativo;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class ExpedienteArbController extends Controller
{
    // ── Lista — cada rol ve lo que le corresponde ──
    public function index()
    {
        $user    = Auth::user();
        $rolSlug = $user->rol->slug ?? '';

        $query = ExpedienteArb::with(['solicitud', 'servicio', 'etapaActual', 'actividadActual'])
            ->activo();

        // Cliente solo ve sus expedientes
        if ($rolSlug === 'cliente') {
            $query->whereHas('usuarios', fn($q) =>
                $q->where('usuario_id', $user->id)->where('activo', true)
            );
        }

        $expedientes = $query->orderByDesc('created_at')->get()
            ->map(fn($e) => [
                'id'                => $e->id,
                'numero_expediente' => $e->numero_expediente,
                'servicio'          => $e->servicio->nombre,
                'nombre_demandante' => $e->solicitud->nombre_demandante,
                'nombre_demandado'  => $e->solicitud->nombre_demandado,
                'etapa_actual'      => $e->etapaActual?->nombre,
                'actividad_actual'  => $e->actividadActual?->nombre,
                'estado'            => $e->estado,
                'tiene_subsanacion' => $e->tiene_subsanacion,
                'fecha_inicio'      => $e->fecha_inicio->format('d/m/Y'),
                'dias_en_proceso'   => $e->fecha_inicio->diffInDays(now()),
            ]);

        // Solicitudes pendientes — solo las ven roles de secretaría
        $solicitudesPendientes = [];
        if (in_array($rolSlug, ['secretaria_general_adjunta', 'secretario_general', 'director'])) {
            $solicitudesPendientes = SolicitudArbitraje::with('servicio')
                ->whereIn('estado', ['pendiente', 'en_revision', 'subsanacion'])
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

        // Secretarios arbitrales — para asignación (solo secretario general y director)
        $secretariosArbitrales = [];
        if (in_array($rolSlug, ['secretario_general', 'director'])) {
            $secretariosArbitrales = User::whereHas('rol', fn($q) =>
                    $q->where('slug', 'secretario_arbitral')
                )
                ->where('activo', 1)
                ->get(['id', 'name', 'email']);
        }

        return Inertia::render('Expedientes/Index', [
            'expedientes'           => $expedientes,
            'solicitudesPendientes' => $solicitudesPendientes,
            'secretariosArbitrales' => $secretariosArbitrales,
            'rolActual'             => $rolSlug,
        ]);
    }

    // ── Detalle del expediente ──
    public function show(ExpedienteArb $expediente)
    {
        $user    = Auth::user();
        $rolSlug = $user->rol->slug ?? '';

        // Cliente solo puede ver sus propios expedientes
        if ($rolSlug === 'cliente') {
            $tieneAcceso = $expediente->usuarios()
                ->where('usuario_id', $user->id)
                ->where('activo', true)
                ->exists();

            abort_if(!$tieneAcceso, 403);
        }

        $expediente->load([
            'solicitud.servicio',
            'solicitud.documentos',
            'etapaActual',
            'actividadActual',
            'usuarios.usuario.rol',
            'arbitros.usuario',
            'arbitros.designadoPor',
            'plazos.actividad',
            'subsanaciones.registradoPor',
            'movimientos.usuario',
            'movimientos.etapaDestino',
            'movimientos.actividadDestino',
            'documentos',
        ]);

        // Siguiente actividad disponible (para avanzar)
        $siguienteActividad = null;
        if ($expediente->actividadActual) {
            $siguienteActividad = $expediente->actividadActual->etapa
                ->actividades()
                ->where('orden', '>', $expediente->actividadActual->orden)
                ->where('activo', true)
                ->orderBy('orden')
                ->first();

            // Si no hay más en esta etapa, buscar en la siguiente etapa
            if (!$siguienteActividad) {
                $siguienteEtapa = $expediente->solicitud->servicio
                    ->etapas()
                    ->where('orden', '>', $expediente->etapaActual->orden)
                    ->where('activo', true)
                    ->orderBy('orden')
                    ->with(['actividades' => fn($q) => $q->where('activo', true)->orderBy('orden')])
                    ->first();

                $siguienteActividad = $siguienteEtapa?->actividades->first();
            }
        }

        // Árbitros disponibles para designar
        $arbitrosDisponibles = [];
        if (in_array($rolSlug, ['director', 'secretario_general'])) {
            $arbitrosDisponibles = User::whereHas('rol', fn($q) =>
                    $q->where('slug', 'arbitro')
                )
                ->where('activo', 1)
                ->get(['id', 'name', 'email']);
        }

        return Inertia::render('Expedientes/Show', [
            'expediente'          => $expediente,
            'siguienteActividad'  => $siguienteActividad,
            'arbitrosDisponibles' => $arbitrosDisponibles,
            'rolActual'           => $rolSlug,
        ]);
    }

    // ── ACCIÓN: Admitir solicitud (Secretaria General Adjunta) ──
    public function admitir(Request $request, SolicitudArbitraje $solicitud)
    {
        $request->validate(['observacion' => 'nullable|string|max:1000']);

        DB::beginTransaction();
        try {
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

            $primeraEtapa     = $solicitud->servicio->etapas()->where('activo', 1)->orderBy('orden')->first();
            $primeraActividad = $primeraEtapa?->actividades()->where('activo', 1)->orderBy('orden')->first();

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

            // Vincular demandante al expediente
            $demandante = User::where('email', $solicitud->email_demandante)->first();
            if ($demandante) {
                ExpedienteArbUsuario::create([
                    'expediente_id'     => $expediente->id,
                    'usuario_id'        => $demandante->id,
                    'rol_en_expediente' => 'demandante',
                    'activo'            => true,
                ]);
            }

            // Crear plazo si corresponde
            if ($primeraActividad?->dias_plazo > 0) {
                ExpedienteArbPlazo::create([
                    'expediente_id'     => $expediente->id,
                    'actividad_id'      => $primeraActividad->id,
                    'fecha_inicio'      => now()->toDateString(),
                    'fecha_vencimiento' => now()->addDays($primeraActividad->dias_plazo)->toDateString(),
                    'dias_plazo'        => $primeraActividad->dias_plazo,
                    'estado'            => 'pendiente',
                    'activo'            => true,
                ]);
            }

            $solicitud->update(['estado' => 'admitida']);

            ExpedienteArbMovimiento::create([
                'expediente_id'        => $expediente->id,
                'usuario_id'           => Auth::id(),
                'etapa_destino_id'     => $primeraEtapa?->id,
                'actividad_destino_id' => $primeraActividad?->id,
                'accion'               => 'admitir',
                'observacion'          => $request->observacion ?? 'Solicitud admitida a trámite.',
                'activo'               => true,
            ]);

            $this->registrarNotificacion(
                expedienteId: $expediente->id,
                solicitudId: $solicitud->id,
                nombre: $solicitud->nombre_demandante,
                email: $solicitud->email_demandante,
                asunto: 'Solicitud admitida: ' . $numeroExp,
                tipo: 'admision'
            );

            // Email al demandante
            Mail::send('emails.arb.admision', [
                'solicitud'        => $solicitud,
                'numeroExpediente' => $numeroExp,
            ], fn($m) => $m
                ->to($solicitud->email_demandante, $solicitud->nombre_demandante)
                ->subject('Ankawa — Solicitud Admitida: ' . $numeroExp)
            );

            DB::commit();
            return back()->with('success', 'Solicitud admitida. Expediente ' . $numeroExp . ' generado.');

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('admitir: ' . $e->getMessage());
            return back()->withErrors(['general' => 'Error al procesar.']);
        }
    }

    // ── ACCIÓN: Observar / Subsanar ──
    public function observar(Request $request, SolicitudArbitraje $solicitud)
    {
        $request->validate([
            'observacion' => 'required|string|max:2000',
            'plazo_dias'  => 'required|integer|min:1|max:30',
        ]);

        DB::beginTransaction();
        try {
            ExpedienteArbSubsanacion::create([
                'solicitud_id'   => $solicitud->id,
                'registrado_por' => Auth::id(),
                'observacion'    => $request->observacion,
                'plazo_dias'     => $request->plazo_dias,
                'fecha_limite'   => now()->addDays($request->plazo_dias)->toDateString(),
                'estado'         => 'pendiente',
                'activo'         => true,
            ]);

            $solicitud->update(['estado' => 'subsanacion']);

            $this->registrarNotificacion(
                solicitudId: $solicitud->id,
                nombre: $solicitud->nombre_demandante,
                email: $solicitud->email_demandante,
                asunto: 'Solicitud requiere subsanación: ' . $solicitud->numero_cargo,
                tipo: 'subsanacion'
            );

            Mail::send('emails.arb.subsanacion', [
                'solicitud'   => $solicitud,
                'observacion' => $request->observacion,
                'plazo_dias'  => $request->plazo_dias,
                'fechaLimite' => now()->addDays($request->plazo_dias)->format('d/m/Y'),
            ], fn($m) => $m
                ->to($solicitud->email_demandante, $solicitud->nombre_demandante)
                ->subject('Ankawa — Su solicitud requiere corrección: ' . $solicitud->numero_cargo)
            );

            DB::commit();
            return back()->with('success', 'Observación enviada al demandante.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['general' => $e->getMessage()]); // temporal
        }
    }

    // ── ACCIÓN: Rechazar ──
    public function rechazar(Request $request, SolicitudArbitraje $solicitud)
    {
        $request->validate(['motivo' => 'required|string|max:2000']);

        DB::beginTransaction();
        try {
            $solicitud->update(['estado' => 'rechazada']);

            $this->registrarNotificacion(
                solicitudId: $solicitud->id,
                nombre: $solicitud->nombre_demandante,
                email: $solicitud->email_demandante,
                asunto: 'Solicitud rechazada: ' . $solicitud->numero_cargo,
                tipo: 'rechazo'
            );

            Mail::send('emails.arb.rechazo', [
                'solicitud' => $solicitud,
                'motivo'    => $request->motivo,
            ], fn($m) => $m
                ->to($solicitud->email_demandante, $solicitud->nombre_demandante)
                ->subject('Ankawa — Solicitud no admitida: ' . $solicitud->numero_cargo)
            );

            DB::commit();
            return back()->with('success', 'Solicitud rechazada y notificada.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['general' => 'Error al procesar.']);
        }
    }

    // ── ACCIÓN: Asignar Secretario Arbitral (Secretario General) ──
    public function asignarSecretario(Request $request, ExpedienteArb $expediente)
    {
        $request->validate(['secretario_id' => 'required|exists:users,id']);

        DB::beginTransaction();
        try {
            ExpedienteArbUsuario::where('expediente_id', $expediente->id)
                ->where('rol_en_expediente', 'secretario_arb')
                ->update(['activo' => false]);

            ExpedienteArbUsuario::create([
                'expediente_id'     => $expediente->id,
                'usuario_id'        => $request->secretario_id,
                'rol_en_expediente' => 'secretario_arb',
                'activo'            => true,
            ]);

            $expediente->update(['estado' => 'en_proceso']);

            ExpedienteArbMovimiento::create([
                'expediente_id' => $expediente->id,
                'usuario_id'    => Auth::id(),
                'accion'        => 'avanzar',
                'observacion'   => 'Secretario Arbitral asignado: ' . User::find($request->secretario_id)->name,
                'activo'        => true,
            ]);

            DB::commit();
            return back()->with('success', 'Secretario Arbitral asignado.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['general' => 'Error al asignar.']);
        }
    }

    // ── ACCIÓN: Notificar demandado ──
    public function notificarDemandado(Request $request, ExpedienteArb $expediente)
    {
        $request->validate(['mensaje_adicional' => 'nullable|string|max:1000']);

        $solicitud = $expediente->solicitud;

        DB::beginTransaction();
        try {
            $this->registrarNotificacion(
                expedienteId: $expediente->id,
                solicitudId: $solicitud->id,
                nombre: $solicitud->nombre_demandado,
                email: $solicitud->email_demandado,
                asunto: 'Notificación de demanda arbitral: ' . $expediente->numero_expediente,
                tipo: 'notif_demandado'
            );

            Mail::send('emails.arb.notif-demandado', [
                'solicitud'        => $solicitud,
                'expediente'       => $expediente,
                'mensajeAdicional' => $request->mensaje_adicional,
            ], fn($m) => $m
                ->to($solicitud->email_demandado, $solicitud->nombre_demandado)
                ->subject('Ankawa — Ha sido notificado: ' . $expediente->numero_expediente)
            );

            ExpedienteArbMovimiento::create([
                'expediente_id' => $expediente->id,
                'usuario_id'    => Auth::id(),
                'accion'        => 'notificar',
                'observacion'   => 'Demandado notificado. Plazo de 5 días para apersonarse.',
                'activo'        => true,
            ]);

            DB::commit();
            return back()->with('success', 'Demandado notificado.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['general' => 'Error al notificar.']);
        }
    }

    // ── ACCIÓN: Avanzar actividad (Secretario Arbitral) ──
    public function avanzarActividad(Request $request, ExpedienteArb $expediente)
    {
        $request->validate([
            'actividad_destino_id' => 'required|exists:actividades,id',
            'observacion'          => 'nullable|string|max:1000',
        ]);

        abort_if($expediente->tiene_subsanacion, 422, 'El expediente tiene una subsanación pendiente.');

        DB::beginTransaction();
        try {
            $actividadDestino = \App\Models\Actividad::with('etapa')->find($request->actividad_destino_id);

            ExpedienteArbMovimiento::create([
                'expediente_id'        => $expediente->id,
                'usuario_id'           => Auth::id(),
                'etapa_origen_id'      => $expediente->etapa_actual_id,
                'actividad_origen_id'  => $expediente->actividad_actual_id,
                'etapa_destino_id'     => $actividadDestino->etapa_id,
                'actividad_destino_id' => $actividadDestino->id,
                'accion'               => 'avanzar',
                'observacion'          => $request->observacion,
                'activo'               => true,
            ]);

            // Completar plazo anterior
            ExpedienteArbPlazo::where('expediente_id', $expediente->id)
                ->where('actividad_id', $expediente->actividad_actual_id)
                ->where('estado', 'pendiente')
                ->update(['estado' => 'completado', 'fecha_completado' => now()]);

            // Actualizar expediente
            $expediente->update([
                'etapa_actual_id'     => $actividadDestino->etapa_id,
                'actividad_actual_id' => $actividadDestino->id,
            ]);

            // Crear nuevo plazo si corresponde
            if ($actividadDestino->dias_plazo > 0) {
                ExpedienteArbPlazo::create([
                    'expediente_id'     => $expediente->id,
                    'actividad_id'      => $actividadDestino->id,
                    'fecha_inicio'      => now()->toDateString(),
                    'fecha_vencimiento' => now()->addDays($actividadDestino->dias_plazo)->toDateString(),
                    'dias_plazo'        => $actividadDestino->dias_plazo,
                    'estado'            => 'pendiente',
                    'activo'            => true,
                ]);
            }

            DB::commit();
            return back()->with('success', 'Expediente avanzado a: ' . $actividadDestino->nombre);

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['general' => 'Error al avanzar.']);
        }
    }

    // ── Helper: registrar notificación ──
    private function registrarNotificacion(
        string $nombre,
        string $email,
        string $asunto,
        string $tipo,
        ?int $expedienteId = null,
        ?int $solicitudId  = null,
        ?int $actividadId  = null,
    ): void {
        ExpedienteArbNotificacion::create([
            'expediente_id'      => $expedienteId,
            'solicitud_id'       => $solicitudId,
            'actividad_id'       => $actividadId,
            'enviado_por'        => Auth::id(),
            'destinatario_nombre'=> $nombre,
            'destinatario_email' => $email,
            'asunto'             => $asunto,
            'tipo'               => $tipo,
            'estado_envio'       => 'enviado',
            'activo'             => true,
        ]);
    }

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
            \App\Models\ExpedienteArbArbitro::create([
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
                'expediente_id' => $expediente->id,
                'usuario_id'    => Auth::id(),
                'accion'        => 'designar_arbitro',
                'observacion'   => 'Árbitro designado: ' . $request->nombre_arbitro . ' (' . $request->tipo_designacion . ')',
                'activo'        => true,
            ]);

            $this->registrarNotificacion(
                expedienteId: $expediente->id,
                nombre: $request->nombre_arbitro,
                email: $request->email_arbitro,
                asunto: 'Ankawa — Ha sido designado árbitro: ' . $expediente->numero_expediente,
                tipo: 'designacion_arbitro'
            );

            // Email al árbitro
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
            return back()->withErrors(['general' => 'Error al designar.']);
        }
    }

}