<?php

namespace App\Http\Controllers;

use App\Models\SolicitudArbitraje;
use App\Models\ExpedienteArb;
use App\Models\ExpedienteArbUsuario;
use App\Models\ExpedienteArbMovimiento;
use App\Models\ExpedienteArbSubsanacion;
use App\Models\ExpedienteArbNotificacion;
use App\Models\ExpedienteArbPlazo;
use App\Models\Correlativo;
use App\Models\User;
use App\Mail\CargoSolicitudMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class SecretariaController extends Controller
{
    // ── Vista principal — solicitudes pendientes + expedientes activos ──
    public function index()
    {
        $usuario = Auth::user();

        // Solicitudes pendientes de revisión (aún no tienen expediente)
        $solicitudesPendientes = SolicitudArbitraje::with(['servicio'])
            ->whereIn('estado', ['pendiente', 'en_revision', 'subsanacion'])
            ->whereDoesntHave('expediente')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($s) => [
                'id'                 => $s->id,
                'numero_cargo'       => $s->numero_cargo,
                'servicio'           => $s->servicio->nombre,
                'nombre_demandante'  => $s->nombre_demandante,
                'email_demandante'   => $s->email_demandante,
                'nombre_demandado'   => $s->nombre_demandado,
                'monto_involucrado'  => $s->monto_involucrado,
                'estado'             => $s->estado,
                'tiene_subsanacion'  => $s->tieneSusanacionPendiente(),
                'created_at'         => $s->created_at->format('d/m/Y H:i'),
            ]);

        // Expedientes activos
        $expedientes = ExpedienteArb::with([
                'solicitud', 'servicio',
                'etapaActual', 'actividadActual',
            ])
            ->activo()
            ->whereNotIn('estado', ['cerrado', 'archivado'])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($e) => [
                'id'                  => $e->id,
                'numero_expediente'   => $e->numero_expediente,
                'servicio'            => $e->servicio->nombre,
                'nombre_demandante'   => $e->solicitud->nombre_demandante,
                'nombre_demandado'    => $e->solicitud->nombre_demandado,
                'etapa_actual'        => $e->etapaActual?->nombre,
                'actividad_actual'    => $e->actividadActual?->nombre,
                'estado'              => $e->estado,
                'tiene_subsanacion'   => $e->tiene_subsanacion,
                'fecha_inicio'        => $e->fecha_inicio->format('d/m/Y'),
                'dias_en_proceso'     => $e->fecha_inicio->diffInDays(now()),
            ]);

        // Usuarios secretarios arbitrales para asignación
        $secretariosArbitrales = User::whereHas('rol', fn($q) =>
                $q->where('nombre', 'like', '%Secretario Arbitral%')
            )
            ->where('activo', 1)
            ->get(['id', 'name', 'email']);

        return Inertia::render('Secretaria/Index', [
            'solicitudesPendientes' => $solicitudesPendientes,
            'expedientes'           => $expedientes,
            'secretariosArbitrales' => $secretariosArbitrales,
        ]);
    }

    // ── Ver detalle de solicitud ──
    public function verSolicitud(SolicitudArbitraje $solicitud)
    {
        $solicitud->load(['servicio', 'documentos', 'subsanaciones.registradoPor']);

        return Inertia::render('Secretaria/DetalleSolicitud', [
            'solicitud' => $solicitud,
        ]);
    }

    // ── Admitir solicitud → genera expediente ──
    public function admitir(Request $request, SolicitudArbitraje $solicitud)
    {
        $request->validate([
            'observacion' => 'nullable|string|max:1000',
        ]);

        DB::beginTransaction();
        try {
            // 1. Generar número de expediente
            $anio        = now()->year;
            $correlativo = Correlativo::where('tipo', 'EXP-ARB')
                ->where('anio', $anio)
                ->lockForUpdate()
                ->first();

            if (!$correlativo) {
                $correlativo = Correlativo::create([
                    'tipo'          => 'EXP-ARB',
                    'anio'          => $anio,
                    'ultimo_numero' => 0,
                    'activo'        => 1,
                ]);
            }

            $correlativo->increment('ultimo_numero');
            $numeroExp = 'EXP-ARB-' . str_pad($correlativo->ultimo_numero, 4, '0', STR_PAD_LEFT) . '-' . $anio;

            // 2. Obtener primera etapa y actividad del servicio
            $primeraEtapa = $solicitud->servicio
                ->etapas()
                ->where('activo', 1)
                ->orderBy('orden')
                ->first();

            $primeraActividad = $primeraEtapa?->actividades()
                ->where('activo', 1)
                ->orderBy('orden')
                ->first();

            // 3. Crear expediente
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

            // 4. Registrar demandante como usuario del expediente
            $usuarioDemandante = User::where('email', $solicitud->email_demandante)->first();
            if ($usuarioDemandante) {
                ExpedienteArbUsuario::create([
                    'expediente_id'    => $expediente->id,
                    'usuario_id'       => $usuarioDemandante->id,
                    'rol_en_expediente'=> 'demandante',
                    'activo'           => true,
                ]);
            }

            // 5. Crear plazo si la primera actividad tiene dias_plazo
            if ($primeraActividad && $primeraActividad->dias_plazo > 0) {
                ExpedienteArbPlazo::create([
                    'expediente_id'    => $expediente->id,
                    'actividad_id'     => $primeraActividad->id,
                    'fecha_inicio'     => now()->toDateString(),
                    'fecha_vencimiento'=> now()->addDays($primeraActividad->dias_plazo)->toDateString(),
                    'dias_plazo'       => $primeraActividad->dias_plazo,
                    'estado'           => 'pendiente',
                    'activo'           => true,
                ]);
            }

            // 6. Actualizar estado de la solicitud
            $solicitud->update(['estado' => 'admitida']);

            // 7. Movimiento en log
            ExpedienteArbMovimiento::create([
                'expediente_id'       => $expediente->id,
                'usuario_id'          => Auth::id(),
                'etapa_destino_id'    => $primeraEtapa?->id,
                'actividad_destino_id'=> $primeraActividad?->id,
                'accion'              => 'admitir',
                'observacion'         => $request->observacion ?? 'Solicitud admitida a trámite.',
                'activo'              => true,
            ]);

            // 8. Registrar notificación
            ExpedienteArbNotificacion::create([
                'expediente_id'      => $expediente->id,
                'solicitud_id'       => $solicitud->id,
                'enviado_por'        => Auth::id(),
                'destinatario_nombre'=> $solicitud->nombre_demandante,
                'destinatario_email' => $solicitud->email_demandante,
                'asunto'             => 'Ankawa — Su solicitud ha sido admitida: ' . $numeroExp,
                'tipo'               => 'admision',
                'estado_envio'       => 'enviado',
                'activo'             => true,
            ]);

            // 9. Enviar email al demandante
            Mail::send('emails.admision-solicitud', [
                'solicitud'        => $solicitud,
                'numeroExpediente' => $numeroExp,
                'observacion'      => $request->observacion,
            ], fn($m) => $m
                ->to($solicitud->email_demandante, $solicitud->nombre_demandante)
                ->subject('Ankawa Internacional — Solicitud Admitida: ' . $numeroExp)
            );

            DB::commit();

            return back()->with('success', 'Solicitud admitida. Expediente ' . $numeroExp . ' generado.');

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error al admitir solicitud: ' . $e->getMessage());
            return back()->withErrors(['general' => 'Error al procesar. Intente nuevamente.']);
        }
    }

    // ── Observar / Subsanar ──
    public function observar(Request $request, SolicitudArbitraje $solicitud)
    {
        $request->validate([
            'observacion' => 'required|string|max:2000',
            'plazo_dias'  => 'required|integer|min:1|max:30',
        ]);

        DB::beginTransaction();
        try {
            $fechaLimite = now()->addDays($request->plazo_dias)->toDateString();

            // Crear subsanación sobre la solicitud
            ExpedienteArbSubsanacion::create([
                'solicitud_id'   => $solicitud->id,
                'registrado_por' => Auth::id(),
                'observacion'    => $request->observacion,
                'plazo_dias'     => $request->plazo_dias,
                'fecha_limite'   => $fechaLimite,
                'estado'         => 'pendiente',
                'activo'         => true,
            ]);

            // Actualizar estado de la solicitud
            $solicitud->update(['estado' => 'subsanacion']);

            // Registrar notificación
            ExpedienteArbNotificacion::create([
                'solicitud_id'       => $solicitud->id,
                'enviado_por'        => Auth::id(),
                'destinatario_nombre'=> $solicitud->nombre_demandante,
                'destinatario_email' => $solicitud->email_demandante,
                'asunto'             => 'Ankawa — Solicitud requiere subsanación: ' . $solicitud->numero_cargo,
                'tipo'               => 'subsanacion',
                'estado_envio'       => 'enviado',
                'activo'             => true,
            ]);

            // Enviar email
            Mail::send('emails.subsanacion-solicitud', [
                'solicitud'   => $solicitud,
                'observacion' => $request->observacion,
                'plazo_dias'  => $request->plazo_dias,
                'fechaLimite' => $fechaLimite,
            ], fn($m) => $m
                ->to($solicitud->email_demandante, $solicitud->nombre_demandante)
                ->subject('Ankawa — Su solicitud requiere corrección: ' . $solicitud->numero_cargo)
            );

            DB::commit();

            return back()->with('success', 'Observación registrada. Se notificó al demandante.');

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error al observar solicitud: ' . $e->getMessage());
            return back()->withErrors(['general' => 'Error al procesar. Intente nuevamente.']);
        }
    }

    // ── Rechazar ──
    public function rechazar(Request $request, SolicitudArbitraje $solicitud)
    {
        $request->validate([
            'motivo' => 'required|string|max:2000',
        ]);

        DB::beginTransaction();
        try {
            $solicitud->update(['estado' => 'rechazada']);

            ExpedienteArbNotificacion::create([
                'solicitud_id'       => $solicitud->id,
                'enviado_por'        => Auth::id(),
                'destinatario_nombre'=> $solicitud->nombre_demandante,
                'destinatario_email' => $solicitud->email_demandante,
                'asunto'             => 'Ankawa — Solicitud rechazada: ' . $solicitud->numero_cargo,
                'tipo'               => 'rechazo',
                'estado_envio'       => 'enviado',
                'activo'             => true,
            ]);

            Mail::send('emails.rechazo-solicitud', [
                'solicitud' => $solicitud,
                'motivo'    => $request->motivo,
            ], fn($m) => $m
                ->to($solicitud->email_demandante, $solicitud->nombre_demandante)
                ->subject('Ankawa — Solicitud no admitida: ' . $solicitud->numero_cargo)
            );

            DB::commit();

            return back()->with('success', 'Solicitud rechazada y notificada al demandante.');

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error al rechazar solicitud: ' . $e->getMessage());
            return back()->withErrors(['general' => 'Error al procesar. Intente nuevamente.']);
        }
    }

    // ── Asignar Secretario Arbitral (acción del Secretario General) ──
    public function asignarSecretario(Request $request, ExpedienteArb $expediente)
    {
        $request->validate([
            'secretario_id' => 'required|exists:users,id',
        ]);

        DB::beginTransaction();
        try {
            // Quitar secretario anterior si existe
            ExpedienteArbUsuario::where('expediente_id', $expediente->id)
                ->where('rol_en_expediente', 'secretario_arb')
                ->update(['activo' => false]);

            // Asignar nuevo
            ExpedienteArbUsuario::create([
                'expediente_id'     => $expediente->id,
                'usuario_id'        => $request->secretario_id,
                'rol_en_expediente' => 'secretario_arb',
                'activo'            => true,
            ]);

            // Mover expediente a estado en_proceso
            $expediente->update(['estado' => 'en_proceso']);

            // Log de movimiento
            ExpedienteArbMovimiento::create([
                'expediente_id' => $expediente->id,
                'usuario_id'    => Auth::id(),
                'accion'        => 'avanzar',
                'observacion'   => 'Secretario Arbitral asignado: ' .
                    User::find($request->secretario_id)->name,
                'activo'        => true,
            ]);

            DB::commit();

            return back()->with('success', 'Secretario Arbitral asignado correctamente.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['general' => 'Error al asignar. Intente nuevamente.']);
        }
    }

    // ── Notificar al demandado ──
    public function notificarDemandado(Request $request, ExpedienteArb $expediente)
    {
        $request->validate([
            'mensaje_adicional' => 'nullable|string|max:1000',
        ]);

        $solicitud = $expediente->solicitud;

        DB::beginTransaction();
        try {
            ExpedienteArbNotificacion::create([
                'expediente_id'      => $expediente->id,
                'solicitud_id'       => $solicitud->id,
                'enviado_por'        => Auth::id(),
                'destinatario_nombre'=> $solicitud->nombre_demandado,
                'destinatario_email' => $solicitud->email_demandado,
                'asunto'             => 'Ankawa — Notificación de demanda arbitral: ' . $expediente->numero_expediente,
                'tipo'               => 'notif_demandado',
                'estado_envio'       => 'enviado',
                'activo'             => true,
            ]);

            Mail::send('emails.notificacion-demandado', [
                'solicitud'          => $solicitud,
                'expediente'         => $expediente,
                'mensajeAdicional'   => $request->mensaje_adicional,
            ], fn($m) => $m
                ->to($solicitud->email_demandado, $solicitud->nombre_demandado)
                ->subject('Ankawa — Ha sido notificado en proceso arbitral: ' . $expediente->numero_expediente)
            );

            // Log
            ExpedienteArbMovimiento::create([
                'expediente_id' => $expediente->id,
                'usuario_id'    => Auth::id(),
                'accion'        => 'notificar',
                'observacion'   => 'Demandado notificado. Plazo de 5 días para apersonarse.',
                'activo'        => true,
            ]);

            DB::commit();

            return back()->with('success', 'Demandado notificado correctamente.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['general' => 'Error al notificar. Intente nuevamente.']);
        }
    }
}