<?php

namespace App\Http\Controllers;

use App\Models\Cargo;
use App\Support\FileRules;
use App\Models\Expediente;
use App\Models\MovimientoDocumento;
use App\Models\ExpedienteActor;
use App\Models\ExpedienteActorEmail;
use App\Models\ExpedienteHistorial;
use App\Models\ExpedienteMovimiento;
use App\Models\SolicitudArbitraje;
use App\Models\Servicio;
use App\Models\User;
use App\Models\ExpedienteActorAceptacion;
use App\Models\VerificationCode;
use App\Mail\CargoRespuestaMail;
use App\Mail\CodigoVerificacionMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class PortalController extends Controller
{
    // ── Helpers privados ──────────────────────────────────────────────────────

    private function actorIdsPorEmail(string $email)
    {
        return ExpedienteActor::where('email_externo', $email)
            ->orWhereHas('usuario', fn($q) => $q->where('email', $email))
            ->pluck('id')
            ->merge(ExpedienteActorEmail::where('email', $email)->pluck('expediente_actor_id'))
            ->unique()
            ->values();
    }

    private function expedientesDashboard(string $email): array
    {
        $actorIds = $this->actorIdsPorEmail($email);

        if ($actorIds->isEmpty()) {
            return [];
        }

        $movimientosPendientes = ExpedienteMovimiento::where('tipo', 'requerimiento')
            ->where('estado', 'pendiente')
            ->where(function ($q) use ($email, $actorIds) {
                $q->whereHas('notificaciones', fn($nq) =>
                    $nq->where('email_destino', $email)->orWhereIn('actor_id', $actorIds)
                );
            })
            ->with(['expediente.servicio', 'tipoDocumentoRequerido:id,nombre'])
            ->orderBy('created_at')
            ->select(['id', 'expediente_id', 'instruccion', 'fecha_limite', 'tipo_dias', 'dias_plazo', 'tipo_documento_requerido_id', 'created_at'])
            ->get();

        $expedienteIdsConPendiente = $movimientosPendientes->pluck('expediente_id')->unique();

        $todosExpedienteIds = Expediente::whereHas('actores', fn($q) =>
            $q->whereIn('id', $actorIds)->where('activo', 1)->where('acceso_mesa_partes', 1)
        )->pluck('id');

        return Expediente::whereIn('id', $todosExpedienteIds)
            ->with(['servicio'])
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($exp) use ($expedienteIdsConPendiente, $movimientosPendientes) {
                $movsPendientes = $movimientosPendientes->where('expediente_id', $exp->id)->values();
                return [
                    'id'                    => $exp->id,
                    'numero_expediente'     => $exp->numero_expediente,
                    'servicio'              => $exp->servicio->nombre,
                    'estado'                => $exp->estado,
                    'etapa_actual'          => $exp->etapa_actual,
                    'tiene_pendiente'       => $expedienteIdsConPendiente->contains($exp->id),
                    'movimientos_pendientes' => $movsPendientes->map(fn($mov) => [
                        'id'                      => $mov->id,
                        'instruccion'             => $mov->instruccion,
                        'fecha_limite'            => $mov->fecha_limite?->format('d/m/Y'),
                        'tipo_dias'               => $mov->tipo_dias,
                        'dias_plazo'              => $mov->dias_plazo,
                        'dias_restantes'          => $mov->diasRestantes(),
                        'created_at'              => $mov->created_at->format('d/m/Y H:i'),
                        'tipo_documento_requerido' => $mov->tipoDocumentoRequerido?->nombre,
                    ])->values()->toArray(),
                ];
            })
            ->toArray();
    }

    // ── Login (solo redirect si ya hay sesión) ────────────────────────────────
    public function index()
    {
        if (session('portal_email')) {
            return redirect()->route('portal.expedientes');
        }
        return Inertia::render('Portal/Login');
    }

    // ── Enviar OTP — acepta cualquier email ───────────────────────────────────
    public function enviarCodigo(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        $email = strtolower(trim($request->email));

        VerificationCode::where('email', $email)->where('usado', false)->update(['usado' => true]);

        $codigo = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        VerificationCode::create([
            'email'      => $email,
            'codigo'     => $codigo,
            'expires_at' => now()->addMinutes(15),
            'usado'      => false,
        ]);

        try {
            Mail::to($email)->send(new CodigoVerificacionMail('', $codigo, 'Ankawa — Acceso al portal'));
        } catch (\Exception $e) {
            \Log::warning("Error enviando OTP a {$email}: " . $e->getMessage());
        }

        return response()->json(['ok' => true]);
    }

    // ── Verificar OTP ─────────────────────────────────────────────────────────
    public function verificarCodigo(Request $request)
    {
        $request->validate([
            'email'  => 'required|email',
            'codigo' => 'required|string|size:6',
        ]);

        $email    = strtolower(trim($request->email));
        $registro = VerificationCode::where('email', $email)
            ->where('codigo', $request->codigo)
            ->where('usado', false)
            ->latest()
            ->first();

        if (!$registro || !$registro->esValido()) {
            return response()->json(['ok' => false, 'mensaje' => 'Código inválido o expirado.'], 422);
        }

        $registro->update(['usado' => true]);
        session(['portal_email' => $email]);

        return response()->json(['ok' => true]);
    }

    // ── Dashboard unificado (expedientes + datos para nueva solicitud) ─────────
    public function dashboard()
    {
        $email   = session('portal_email');
        $usuario = User::where('email', $email)->first();

        $portalUser = $usuario ? [
            'name'             => $usuario->name,
            'email'            => $email,
            'numero_documento' => $usuario->numero_documento,
            'telefono'         => $usuario->telefono,
            'direccion'        => $usuario->direccion,
            'tipo_persona'     => $usuario->tipo_persona,
        ] : null;

        $servicios   = Servicio::where('activo', 1)->orderBy('nombre')->get(['id', 'nombre', 'slug', 'descripcion']);
        $expedientes = $this->expedientesDashboard($email);

        // Expedientes con acceso habilitado pero sin toma de conocimiento registrada
        $actorIds = $this->actorIdsPorEmail($email);
        $pendientesAceptacion = [];
        if ($actorIds->isNotEmpty()) {
            $yaAceptados = ExpedienteActorAceptacion::whereIn('expediente_actor_id', $actorIds)
                ->where('tipo', 'toma_conocimiento')
                ->pluck('expediente_id')
                ->unique();

            $pendientesAceptacion = Expediente::whereHas('actores', fn($q) =>
                $q->whereIn('id', $actorIds)->where('activo', 1)->where('acceso_mesa_partes', 1)
            )
            ->whereNotIn('id', $yaAceptados)
            ->with('servicio:id,nombre')
            ->get()
            ->map(fn($exp) => [
                'id'                => $exp->id,
                'numero_expediente' => $exp->numero_expediente,
                'servicio'          => $exp->servicio->nombre,
                'estado'            => $exp->estado,
            ])->values()->toArray();
        }

        return Inertia::render('MesaPartes/Dashboard', [
            'expedientes'          => $expedientes,
            'servicios'            => $servicios,
            'portalUser'           => $portalUser,
            'portalEmail'          => $email,
            'pendientesAceptacion' => $pendientesAceptacion,
        ]);
    }

    // ── misExpedientes (legacy) → redirige al dashboard ───────────────────────
    public function misExpedientes()
    {
        return redirect()->route('mesa-partes.inicio');
    }

    // ── Responder movimiento ──────────────────────────────────────────────────
    public function responder(Request $request, ExpedienteMovimiento $movimiento)
    {
        $email    = session('portal_email');
        $actorIds = $this->actorIdsPorEmail($email);

        $autorizado = $movimiento->notificaciones()
            ->where(fn($q) => $q->where('email_destino', $email)->orWhereIn('actor_id', $actorIds))
            ->exists();

        abort_unless($autorizado, 403, 'No tiene autorización para responder este movimiento.');
        abort_unless($movimiento->estado === 'pendiente', 422, 'Este movimiento ya no está pendiente.');

        $request->validate([
            'respuesta'    => 'required|string|max:5000',
            'documentos'   => 'nullable|array',
            'documentos.*' => FileRules::accept(),
        ]);

        $actorDelEmail = ExpedienteActor::where('email_externo', $email)
            ->orWhereHas('usuario', fn($q) => $q->where('email', $email))
            ->orWhereHas('emailsAdicionales', fn($q) => $q->where('email', $email))
            ->first();
        $usuarioIdActor = $actorDelEmail?->usuario_id;

        DB::transaction(function () use ($request, $movimiento, $email, $usuarioIdActor) {
            $movimiento->update([
                'respuesta'       => $request->respuesta,
                'fecha_respuesta' => now(),
                'respondido_por'  => $usuarioIdActor,
                'estado'          => 'respondido',
            ]);

            // Si la solicitud estaba en subsanación, volver a pendiente
            $solicitud = SolicitudArbitraje::where('id',
                Expediente::where('id', $movimiento->expediente_id)->value('solicitud_id')
            )->where('estado', 'subsanacion')->first();
            if ($solicitud) {
                $solicitud->update(['estado' => 'pendiente']);
            }

            if ($request->hasFile('documentos')) {
                $carpeta = "expedientes/{$movimiento->expediente_id}/movimientos/{$movimiento->id}";
                foreach ($request->file('documentos') as $archivo) {
                    $ruta = $archivo->store($carpeta, 'public');
                    MovimientoDocumento::create([
                        'movimiento_id'   => $movimiento->id,
                        'subido_por'      => $usuarioIdActor,
                        'nombre_original' => $archivo->getClientOriginalName(),
                        'ruta_archivo'    => $ruta,
                        'peso_bytes'      => $archivo->getSize(),
                        'momento'         => 'respuesta',
                    ]);
                }
            }

            ExpedienteHistorial::create([
                'expediente_id' => $movimiento->expediente_id,
                'usuario_id'    => $usuarioIdActor,
                'tipo_evento'   => 'movimiento_respondido',
                'descripcion'   => "Movimiento respondido desde portal por: {$email}",
                'datos_extra'   => ['movimiento_id' => $movimiento->id, 'portal_email' => $email],
                'created_at'    => now(),
            ]);

            if ($movimiento->tipo === 'requerimiento' && $movimiento->genera_cargo) {
                $cargo = Cargo::crear('respuesta_requerimiento', $movimiento, null);
                if ($cargo) {
                    try {
                        Mail::to($email)->send(new CargoRespuestaMail($cargo, $movimiento));
                    } catch (\Exception $e) {
                        \Log::warning("Error enviando cargo portal a {$email}: " . $e->getMessage());
                    }
                }
            }
        });

        return response()->json(['ok' => true, 'mensaje' => 'Respuesta registrada correctamente.']);
    }

    // ── Logout ────────────────────────────────────────────────────────────────
    public function logout()
    {
        session()->forget('portal_email');
        return redirect()->route('mesa-partes.index');
    }

    // ── Toma de conocimiento de un expediente ─────────────────────────────────
    public function aceptarConocimiento(Request $request, Expediente $expediente)
    {
        $email    = session('portal_email');
        $actorIds = $this->actorIdsPorEmail($email);

        $actor = ExpedienteActor::whereIn('id', $actorIds)
            ->where('expediente_id', $expediente->id)
            ->where('acceso_mesa_partes', 1)
            ->firstOrFail();

        ExpedienteActorAceptacion::firstOrCreate(
            [
                'expediente_actor_id' => $actor->id,
                'expediente_id'       => $expediente->id,
                'tipo'                => 'toma_conocimiento',
            ],
            [
                'ip_address'   => $request->ip(),
                'user_agent'   => $request->userAgent(),
                'portal_email' => $email,
                'created_at'   => now(),
            ]
        );

        ExpedienteHistorial::create([
            'expediente_id' => $expediente->id,
            'usuario_id'    => $actor->usuario_id ?? 0,
            'tipo_evento'   => 'toma_conocimiento',
            'descripcion'   => "Actor tomó conocimiento del expediente desde el portal ({$email}).",
            'datos_extra'   => [
                'portal_email' => $email,
                'ip'           => $request->ip(),
                'user_agent'   => substr($request->userAgent() ?? '', 0, 200),
                'actor_id'     => $actor->id,
            ],
        ]);

        return back();
    }
}
