<?php

namespace App\Http\Controllers;

use App\Models\Cargo;
use App\Support\FileRules;
use App\Models\Expediente;
use App\Models\MovimientoDocumento;
use App\Models\MovimientoResponsable;
use App\Models\ExpedienteActor;
use App\Models\ExpedienteActorEmail;
use App\Models\ExpedienteHistorial;
use App\Models\ExpedienteMovimiento;
use App\Models\SolicitudArbitraje;
use App\Models\Servicio;
use App\Models\User;
use App\Models\ExpedienteActorAceptacion;
use App\Models\VerificationCode;
use App\Models\ValidacionDocumento;
use App\Mail\CargoRespuestaMail;
use App\Mail\CodigoVerificacionMail;
use App\Support\AuditoriaPortal;
use App\Support\CaptchaValidator;
use App\Support\DecolectaClient;
use App\Support\DisposableEmailGuard;
use App\Support\DniValidator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
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

    /**
     * Descarga autorizada de un documento desde el portal externo (sesión OTP).
     *
     * Los archivos viven en el disco PRIVADO `documentos`. Aquí se valida que el
     * email de la sesión sea dueño de algún actor del expediente del documento
     * (o el solicitante de la solicitud) antes de servirlo. Reemplaza las URLs
     * públicas directas que exponían evidencia legal sin autorización.
     */
    public function descargarDocumento(Request $request, $id)
    {
        $email = (string) session('portal_email');
        abort_unless($email, 403, 'Sesión de portal no válida.');

        $documento = \App\Support\DocumentoAcceso::resolver($id);
        abort_unless($documento, 404, 'El documento solicitado no existe.');

        $actorIds = $this->actorIdsPorEmail($email)->all();

        abort_unless(
            \App\Support\DocumentoAcceso::portalPuedeVer($documento, $actorIds, $email),
            403,
            'No tiene acceso a este documento.'
        );

        return \App\Support\DocumentoAcceso::servir($documento);
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
            ->with([
                'expediente.servicio',
                'tipoDocumentoRequerido:id,nombre',
                'documentos' => fn($q) => $q->where('activo', true),
                // Filas del pivot del actor logueado — pendientes Y ya respondidas — para que
                // el modal pueda separar y mostrar trazabilidad de lo ya entregado.
                'responsables' => function ($q) use ($actorIds) {
                    $q->whereIn('expediente_actor_id', $actorIds)
                      ->whereNotNull('tipo_documento_id')
                      ->orderBy('fecha_limite');
                },
                'responsables.tipoDocumento:id,nombre',
            ])
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
                    'movimientos_pendientes' => $movsPendientes->map(function ($mov) {
                        // Docs del requerimiento original (momento='creacion'): los que adjuntó el remitente.
                        $docsCreacion = $mov->documentos->where('momento', 'creacion');
                        // Docs de respuesta (momento='respuesta'): lo que ya entregó alguien.
                        // Para cada responsable respondido, filtramos los docs del mismo tipo.
                        $docsRespuesta = $mov->documentos->where('momento', 'respuesta');

                        $responsablesPendientes  = $mov->responsables->where('estado', 'pendiente');
                        // Tanto respondidos como omitidos van al historial "ya entregaste"
                        // (omitido = el actor decidió previamente no presentar un opcional).
                        $responsablesRespondidos = $mov->responsables->whereIn('estado', ['respondido', 'omitido']);

                        return [
                            'id'                      => $mov->id,
                            'instruccion'             => $mov->instruccion,
                            'fecha_limite'            => $mov->fecha_limite?->format('d/m/Y'),
                            'tipo_dias'               => $mov->tipo_dias,
                            'dias_plazo'              => $mov->dias_plazo,
                            'dias_restantes'          => $mov->diasRestantes(),
                            'created_at'              => $mov->created_at->format('d/m/Y H:i'),
                            'tipo_documento_requerido' => $mov->tipoDocumentoRequerido?->nombre,
                            'documentos'              => $docsCreacion->map(fn($d) => [
                                'id'              => $d->id,
                                'nombre_original' => $d->nombre_original,
                                'peso_bytes'      => $d->peso_bytes,
                                'url'             => route('mesa-partes.documentos.descargar', $d->id),
                            ])->values()->toArray(),
                            // Tipos de documento que el actor logueado todavía debe presentar.
                            'responsables_pendientes' => $responsablesPendientes->map(fn($r) => [
                                'responsable_id'         => $r->id,
                                'tipo_documento_id'      => $r->tipo_documento_id,
                                'tipo_documento_nombre'  => $r->tipoDocumento?->nombre,
                                'es_opcional'            => (bool) $r->es_opcional,
                                'dias_plazo'             => $r->dias_plazo,
                                'tipo_dias'              => $r->tipo_dias,
                                'fecha_limite'           => $r->fecha_limite?->format('d/m/Y'),
                                'estado'                 => $r->estado,
                            ])->values()->toArray(),
                            // Tipos sobre los que YA hay una decisión del actor — para trazabilidad en el modal.
                            // Incluye 'respondido' (entregó algo) y 'omitido' (decidió no presentar el opcional).
                            'responsables_entregados' => $responsablesRespondidos->map(fn($r) => [
                                'responsable_id'         => $r->id,
                                'tipo_documento_id'      => $r->tipo_documento_id,
                                'tipo_documento_nombre'  => $r->tipoDocumento?->nombre,
                                'es_opcional'            => (bool) $r->es_opcional,
                                'estado'                 => $r->estado,
                                'fecha_respuesta'        => $r->fecha_respuesta?->format('d/m/Y H:i'),
                                'archivos'               => $r->estado === 'respondido'
                                    ? $docsRespuesta
                                        ->where('tipo_documento_id', $r->tipo_documento_id)
                                        ->map(fn($d) => [
                                            'id'              => $d->id,
                                            'nombre_original' => $d->nombre_original,
                                            'peso_bytes'      => $d->peso_bytes,
                                            'url'             => route('mesa-partes.documentos.descargar', $d->id),
                                        ])->values()->toArray()
                                    : [],
                            ])->values()->toArray(),
                        ];
                    })->values()->toArray(),
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
        return Inertia::render('Portal/Login', [
            'hcaptchaSiteKey' => config('services.hcaptcha.site_key'),
        ]);
    }

    // ── Enviar OTP — exige captcha + identidad verificada por DNI ──────────
    // Solo se acepta DNI: el que entra al portal es siempre una persona natural.
    // Si representa a una empresa, los datos del RUC se piden DENTRO del formulario.
    public function enviarCodigo(Request $request)
    {
        $request->validate([
            'email'              => 'required|email',
            'numero_doc'         => 'required|string',
            'digito_verificador' => 'required|string|max:2',
            'captcha_token'      => 'nullable|string',
        ]);

        $email     = strtolower(trim($request->email));
        $tipoDoc   = 'dni';
        $numeroDoc = preg_replace('/\D/', '', (string) $request->numero_doc) ?? '';
        $digito    = trim((string) $request->digito_verificador);

        AuditoriaPortal::registrar('login_inicio', $request, [
            'email'      => $email,
            'numero_doc' => $numeroDoc,
        ]);

        // 1) Captcha
        if (!CaptchaValidator::valido($request->captcha_token, $request->ip())) {
            AuditoriaPortal::registrar('captcha_fallido', $request, ['email' => $email]);
            return response()->json(['ok' => false, 'mensaje' => 'No pudimos verificar que eres humano. Intenta de nuevo.'], 422);
        }

        // 2) Email no desechable
        if (DisposableEmailGuard::esDesechable($email)) {
            AuditoriaPortal::registrar('email_desechable_bloqueado', $request, ['email' => $email]);
            return response()->json([
                'ok'      => false,
                'mensaje' => 'Por seguridad legal, no se aceptan correos temporales o desechables. Usa un correo permanente (Gmail, institucional, corporativo).',
            ], 422);
        }

        // 3) Validar formato del DNI + dígito verificador (algoritmo Módulo 11 local)
        if (!preg_match('/^\d{8}$/', $numeroDoc)) {
            return response()->json(['ok' => false, 'mensaje' => 'El DNI debe tener 8 dígitos.'], 422);
        }
        if (!DniValidator::esValido($numeroDoc, $digito)) {
            AuditoriaPortal::registrar('dni_digito_invalido', $request, ['numero_doc' => $numeroDoc]);
            return response()->json([
                'ok'      => false,
                'mensaje' => 'El dígito verificador no coincide con el DNI. Revisa el carácter impreso al lado del número en tu DNI.',
            ], 422);
        }

        // 4) Consultar RENIEC y persistir snapshot
        $consulta = DecolectaClient::consultarDni($numeroDoc);

        $resultado = match ($consulta['estado']) {
            'ok'             => 'valido',
            'no_encontrado'  => 'no_encontrado',
            default          => 'invalido',
        };

        ValidacionDocumento::create([
            'tipo'               => $tipoDoc,
            'numero'             => $numeroDoc,
            'digito_verificador' => mb_strtoupper($digito),
            'resultado'          => $resultado,
            'respuesta_completa' => $consulta['data'],
            'ip'                 => $request->ip(),
            'user_agent'         => $request->userAgent(),
            'contexto'           => 'login_portal',
            'email_sesion'       => $email,
        ]);

        if ($consulta['estado'] === 'no_encontrado') {
            AuditoriaPortal::registrar('documento_no_encontrado_reniec', $request, ['numero' => $numeroDoc]);
            return response()->json([
                'ok'      => false,
                'mensaje' => 'No encontramos este DNI en RENIEC. Verifica el número.',
            ], 422);
        }

        if ($consulta['estado'] === 'error') {
            return response()->json([
                'ok'      => false,
                'mensaje' => 'No pudimos verificar tu documento en este momento. Intenta de nuevo en unos minutos.',
            ], 503);
        }

        AuditoriaPortal::registrar('login_dni_validado', $request, ['numero' => $numeroDoc]);

        // 5) Generar OTP y enviar
        VerificationCode::where('email', $email)->where('usado', false)->update(['usado' => true]);

        $codigo = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        VerificationCode::create([
            'email'                => $email,
            'codigo'               => $codigo,
            'expires_at'           => now()->addMinutes(15),
            'usado'                => false,
            'ip_solicitud'         => $request->ip(),
            'user_agent_solicitud' => $request->userAgent(),
            'numero_documento'     => $numeroDoc,
        ]);

        try {
            Mail::to($email)->send(new CodigoVerificacionMail('', $codigo, 'Ankawa — Acceso al portal'));
        } catch (\Exception $e) {
            \Log::warning("Error enviando OTP a {$email}: " . $e->getMessage());
        }

        AuditoriaPortal::registrar('otp_solicitado', $request, ['email' => $email]);

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
            // Sumar 1 al último código vigente del email para tener intentos por usuario
            VerificationCode::where('email', $email)
                ->where('usado', false)
                ->latest()
                ->limit(1)
                ->update(['intentos_fallidos' => DB::raw('intentos_fallidos + 1')]);
            AuditoriaPortal::registrar('otp_fallido', $request, ['email' => $email]);
            return response()->json(['ok' => false, 'mensaje' => 'Código inválido o expirado.'], 422);
        }

        $registro->update([
            'usado'                  => true,
            'ip_validacion'          => $request->ip(),
            'user_agent_validacion'  => $request->userAgent(),
            'validado_at'            => now(),
        ]);

        $usuarioVinculado = $registro->numero_documento
            ? User::where('numero_documento', $registro->numero_documento)->first()
            : User::where('email', $email)->first();

        session([
            'portal_email'   => $email,
            'portal_dni'     => $registro->numero_documento,
            'portal_user_id' => $usuarioVinculado?->id,
        ]);

        AuditoriaPortal::registrar('otp_validado', $request, ['email' => $email]);
        AuditoriaPortal::registrar('sesion_iniciada', $request, ['email' => $email]);

        // Devolver al recurso que el usuario intentaba abrir antes del login (p. ej. un
        // documento desde el correo). Solo se honra si es una URL interna del portal.
        $intended = session()->pull('portal_intended');
        $redirect = ($intended && str_starts_with($intended, url('/mesa-partes')))
            ? $intended
            : route('mesa-partes.inicio');

        return response()->json(['ok' => true, 'redirect' => $redirect]);
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
            // IDs de actor del portal para suscribirse a sus canales en vivo (Reverb)
            'avisoActorIds'        => $actorIds->values(),
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

        // Reglas de validación:
        //   - archivos[<tipo_documento_id>][] = files (flujo nuevo, agrupado por tipo)
        //   - documentos[]                    = files (flujo legacy, sin agrupar)
        $request->validate([
            'respuesta'    => 'required|string|max:5000',
            'archivos'     => 'nullable|array',
            'archivos.*'   => 'nullable|array',
            'archivos.*.*' => FileRules::accept(),
            'documentos'   => 'nullable|array',
            'documentos.*' => FileRules::accept(),
        ]);

        // Filas pendientes de los actores asociados al email — sólo éstas pueden marcarse como respondidas hoy.
        $responsablesPendientes = MovimientoResponsable::where('movimiento_id', $movimiento->id)
            ->whereIn('expediente_actor_id', $actorIds)
            ->where('estado', 'pendiente')
            ->get();

        // Agrupar archivos por tipo de documento (sólo los que corresponden a filas pendientes del actor).
        $archivosPorTipo = collect($request->file('archivos') ?? [])
            ->filter(fn($files, $tipoId) => $responsablesPendientes->contains('tipo_documento_id', (int) $tipoId))
            ->mapWithKeys(fn($files, $tipoId) => [(int) $tipoId => is_array($files) ? array_filter($files) : []]);

        $archivosLegacy = array_filter($request->file('documentos') ?? []);

        if ($archivosPorTipo->flatten()->isEmpty() && empty($archivosLegacy)) {
            return response()->json([
                'ok'      => false,
                'mensaje' => 'Debes adjuntar al menos un documento de los requeridos.',
            ], 422);
        }

        $actorDelEmail = ExpedienteActor::where('email_externo', $email)
            ->orWhereHas('usuario', fn($q) => $q->where('email', $email))
            ->orWhereHas('emailsAdicionales', fn($q) => $q->where('email', $email))
            ->first();
        $usuarioIdActor = $actorDelEmail?->usuario_id;

        $rutasArchivosSubidos = [];
        // [tipo_id => [{nombre_original, peso_bytes, ruta}, ...]] — para reconstruir docsEntregados con URL después de la TX.
        $archivosGuardadosPorTipo = [];

        try {
            DB::transaction(function () use (
                $request, $movimiento, $email, $usuarioIdActor, $actorDelEmail,
                $responsablesPendientes, $archivosPorTipo, $archivosLegacy,
                &$rutasArchivosSubidos, &$archivosGuardadosPorTipo
            ) {
                $carpeta = "expedientes/{$movimiento->expediente_id}/movimientos/{$movimiento->id}";

                // ── Flujo nuevo: por cada (tipo_documento_id => files) marcar fila + guardar docs ──
                $tiposEntregadosHoy = [];
                foreach ($archivosPorTipo as $tipoId => $files) {
                    if (empty($files)) continue;

                    // Marcar como respondida la(s) fila(s) pendiente(s) del actor para este tipo.
                    foreach ($responsablesPendientes->where('tipo_documento_id', $tipoId) as $resp) {
                        $resp->update([
                            'estado'          => 'respondido',
                            'respuesta'       => $request->respuesta,
                            'respondido_por'  => $usuarioIdActor,
                            'fecha_respuesta' => now(),
                        ]);
                    }

                    foreach ($files as $archivo) {
                        if (!$archivo) continue;
                        $ruta = $archivo->store($carpeta, 'documentos');
                        if (!$ruta) {
                            throw new \RuntimeException('No se pudo guardar uno de los archivos.');
                        }
                        $rutasArchivosSubidos[] = $ruta;
                        $docCreado = MovimientoDocumento::create([
                            'movimiento_id'     => $movimiento->id,
                            'tipo_documento_id' => $tipoId,
                            'subido_por'        => $usuarioIdActor,
                            'nombre_original'   => $archivo->getClientOriginalName(),
                            'ruta_archivo'      => $ruta,
                            'peso_bytes'        => $archivo->getSize(),
                            'momento'           => 'respuesta',
                        ]);
                        $archivosGuardadosPorTipo[$tipoId][] = [
                            'id'              => $docCreado->id,
                            'nombre_original' => $archivo->getClientOriginalName(),
                            'peso_bytes'      => $archivo->getSize(),
                            'ruta'            => $ruta,
                        ];
                    }
                    $tiposEntregadosHoy[] = $tipoId;
                }

                // ── Marcar como OMITIDO los tipos OPCIONALES pendientes del actor que NO se entregaron en este envío.
                //    Solo aplica si el actor entregó al menos un tipo (caso normal: termina su submission decidiendo
                //    no presentar los opcionales). Si no entregó nada, ya retornamos 422 antes.
                if (!empty($tiposEntregadosHoy)) {
                    foreach ($responsablesPendientes as $resp) {
                        if (!$resp->es_opcional) continue;                                  // requeridos no se omiten
                        if (in_array($resp->tipo_documento_id, $tiposEntregadosHoy)) continue; // este tipo SÍ se entregó
                        $resp->update([
                            'estado'          => ExpedienteMovimiento::ESTADO_OMITIDO,
                            'respondido_por'  => $usuarioIdActor,
                            'fecha_respuesta' => now(),
                        ]);
                    }
                }

                // ── Flujo legacy: documentos[] sin agrupar (movimientos viejos) ──
                if (!empty($archivosLegacy)) {
                    foreach ($archivosLegacy as $archivo) {
                        if (!$archivo) continue;
                        $ruta = $archivo->store($carpeta, 'documentos');
                        if (!$ruta) {
                            throw new \RuntimeException('No se pudo guardar uno de los archivos.');
                        }
                        $rutasArchivosSubidos[] = $ruta;
                        MovimientoDocumento::create([
                            'movimiento_id'     => $movimiento->id,
                            'tipo_documento_id' => $movimiento->tipo_documento_requerido_id,
                            'subido_por'        => $usuarioIdActor,
                            'nombre_original'   => $archivo->getClientOriginalName(),
                            'ruta_archivo'      => $ruta,
                            'peso_bytes'        => $archivo->getSize(),
                            'momento'           => 'respuesta',
                        ]);
                    }
                }

                // ── ¿Todo el movimiento quedó respondido? ──
                // Cierra cuando ninguna fila REQUERIDA (es_opcional=false) sigue pendiente.
                // Las filas opcionales en estado `omitido` o `pendiente` no bloquean el cierre.
                $todasRespondidas = !MovimientoResponsable::where('movimiento_id', $movimiento->id)
                    ->where('es_opcional', false)
                    ->where('estado', ExpedienteMovimiento::ESTADO_PENDIENTE)
                    ->exists();

                // Si no había filas en el pivot (movimiento legacy) se cierra directo.
                $sinPivot = !MovimientoResponsable::where('movimiento_id', $movimiento->id)->exists();

                if ($todasRespondidas || $sinPivot) {
                    $movimiento->update([
                        'respuesta'       => $request->respuesta,
                        'fecha_respuesta' => now(),
                        'respondido_por'  => $usuarioIdActor,
                        'estado'          => 'respondido',
                    ]);

                    // Si la solicitud estaba en subsanación, volver a pendiente (solo al cerrar el movimiento)
                    $solicitud = SolicitudArbitraje::where('id',
                        Expediente::where('id', $movimiento->expediente_id)->value('solicitud_id')
                    )->where('estado', 'subsanacion')->first();
                    if ($solicitud) {
                        $solicitud->update(['estado' => 'pendiente']);
                    }
                }

                ExpedienteHistorial::create([
                    'expediente_id' => $movimiento->expediente_id,
                    'usuario_id'    => $usuarioIdActor,
                    'tipo_evento'   => $todasRespondidas || $sinPivot ? 'movimiento_respondido' : 'movimiento_respondido_parcial',
                    'descripcion'   => ($todasRespondidas || $sinPivot
                        ? "Movimiento respondido desde portal por: {$email}"
                        : "Respuesta parcial desde portal por: {$email} (algunos documentos siguen pendientes)"),
                    'datos_extra'   => [
                        'movimiento_id'        => $movimiento->id,
                        'portal_email'         => $email,
                        'tipos_entregados'     => $tiposEntregadosHoy,
                    ],
                    'created_at'    => now(),
                ]);

                // ── Disparar traslados automáticos configurados para los tipos entregados ──
                // Se hace ANTES del cargo para que, si algo falla, el rollback también revierta los movs generados.
                if (!empty($tiposEntregadosHoy) && $actorDelEmail) {
                    app(\App\Services\MovimientoService::class)->dispararTrasladosAuto(
                        $movimiento,
                        $actorDelEmail->id,
                        $tiposEntregadosHoy,
                        $usuarioIdActor,
                    );
                }

                // ── 1 cargo por evento de entrega (sin importar cuántos tipos abarca) ──
                if ($movimiento->tipo === 'requerimiento' && $movimiento->genera_cargo) {
                    $cargo = Cargo::crear('respuesta_requerimiento', $movimiento, $usuarioIdActor);
                    if ($cargo) {
                        // Detalle de docs ENTREGADOS en este cargo: por cada tipo, la lista de archivos
                        // (nombre original + peso + URL pública) para que el actor pueda auditar y abrir cada archivo.
                        $docsEntregados = collect($archivosGuardadosPorTipo)
                            ->map(function ($archivos, $tipoId) use ($responsablesPendientes) {
                                $resp = $responsablesPendientes->firstWhere('tipo_documento_id', (int) $tipoId);
                                $resp?->loadMissing('tipoDocumento');
                                return [
                                    'nombre'   => $resp?->tipoDocumento?->nombre ?? 'Documento',
                                    'archivos' => collect($archivos)->map(fn($a) => [
                                        'nombre_original' => $a['nombre_original'],
                                        'peso_bytes'      => $a['peso_bytes'],
                                        'url'             => route('mesa-partes.documentos.descargar', $a['id']),
                                    ])->values()->all(),
                                ];
                            })
                            ->values()
                            ->all();

                        // Docs que TODAVÍA siguen pendientes para este actor después de esta entrega.
                        $actorIdsParaPend = collect([$actorDelEmail?->id])->filter()->all();
                        $docsPendientes = !empty($actorIdsParaPend)
                            ? MovimientoResponsable::where('movimiento_id', $movimiento->id)
                                ->whereIn('expediente_actor_id', $actorIdsParaPend)
                                ->where('estado', 'pendiente')
                                ->whereNotNull('tipo_documento_id')
                                ->with('tipoDocumento:id,nombre')
                                ->orderBy('fecha_limite')
                                ->get()
                                ->map(fn($r) => [
                                    'nombre'       => $r->tipoDocumento?->nombre ?? 'Documento',
                                    'fecha_limite' => $r->fecha_limite?->format('d/m/Y'),
                                    'dias_plazo'   => $r->dias_plazo,
                                    'tipo_dias'    => $r->tipo_dias,
                                ])
                                ->all()
                            : [];

                        try {
                            Mail::to($email)->send(new CargoRespuestaMail(
                                $cargo, $movimiento, $docsEntregados, $docsPendientes
                            ));
                        } catch (\Exception $e) {
                            \Log::warning("Error enviando cargo portal a {$email}: " . $e->getMessage());
                        }
                    }
                }
            });
        } catch (\Throwable $e) {
            foreach ($rutasArchivosSubidos as $ruta) {
                if (\Illuminate\Support\Facades\Storage::disk('documentos')->exists($ruta)) {
                    \Illuminate\Support\Facades\Storage::disk('documentos')->delete($ruta);
                }
            }
            report($e);
            return response()->json([
                'ok'      => false,
                'mensaje' => 'No se pudo registrar la respuesta. La operación fue revertida.',
            ], 500);
        }

        // Aviso (campana) al/los gestor(es) del expediente: una parte respondió.
        try {
            $expedienteResp = $movimiento->expediente;
            $gestorUserIds = \App\Models\ExpedienteActor::where('expediente_id', $expedienteResp->id)
                ->where('es_gestor', true)->where('activo', 1)
                ->whereNotNull('usuario_id')->pluck('usuario_id')->all();
            app(\App\Services\AvisoService::class)->avisarUsuarios($gestorUserIds, [
                'titulo'        => 'Respuesta recibida · ' . $expedienteResp->numero_expediente,
                'mensaje'       => 'Una parte respondió un requerimiento.',
                'url'           => '/expedientes/' . $expedienteResp->id,
                'tipo'          => 'respuesta',
                'expediente_id' => $expedienteResp->id,
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Aviso de respuesta falló: ' . $e->getMessage());
        }

        return response()->json(['ok' => true, 'mensaje' => 'Respuesta registrada correctamente.']);
    }

    // ── Logout ────────────────────────────────────────────────────────────────
    public function logout(Request $request)
    {
        AuditoriaPortal::registrar('sesion_cerrada', $request);
        session()->forget(['portal_email', 'portal_dni', 'portal_user_id']);
        return redirect()->route('mesa-partes.index');
    }

    // ── Tipos de documento disponibles para envío espontáneo ─────────────────
    public function tiposDocumentoEnvio(Expediente $expediente)
    {
        $email    = session('portal_email');
        $actorIds = $this->actorIdsPorEmail($email);

        $autorizado = ExpedienteActor::whereIn('id', $actorIds)
            ->where('expediente_id', $expediente->id)
            ->where('acceso_mesa_partes', 1)
            ->where('activo', 1)
            ->exists();

        abort_unless($autorizado, 403, 'No tiene autorización sobre este expediente.');

        $expediente->loadMissing('servicio');
        $tipos = $expediente->servicio
            ->tiposDocumento()
            ->where('tipo_documentos.activo', true)
            ->get(['tipo_documentos.id', 'tipo_documentos.nombre']);

        return response()->json($tipos);
    }

    // ── Enviar documento espontáneo al expediente ────────────────────────────
    public function enviarDocumento(Request $request, Expediente $expediente)
    {
        $email    = session('portal_email');
        $actorIds = $this->actorIdsPorEmail($email);

        $actor = ExpedienteActor::whereIn('id', $actorIds)
            ->where('expediente_id', $expediente->id)
            ->where('acceso_mesa_partes', 1)
            ->where('activo', 1)
            ->first();

        abort_unless($actor, 403, 'No tiene autorización para enviar documentos a este expediente.');

        $request->validate([
            'tipo_documento_id' => ['required', 'integer', 'exists:tipo_documentos,id'],
            'descripcion'       => ['required', 'string', 'max:2000'],
            'documentos'        => ['required', 'array', 'min:1'],
            'documentos.*'      => FileRules::accept(),
        ], [
            'documentos.required' => 'Debes adjuntar al menos un documento.',
            'documentos.min'      => 'Debes adjuntar al menos un documento.',
        ]);

        $tipoValido = $expediente->servicio
            ->tiposDocumento()
            ->where('tipo_documentos.id', $request->tipo_documento_id)
            ->where('tipo_documentos.activo', true)
            ->exists();
        abort_unless($tipoValido, 422, 'El tipo de documento no pertenece al servicio de este expediente.');

        $usuarioIdActor = $actor->usuario_id;

        $movimiento = DB::transaction(function () use ($request, $expediente, $email, $usuarioIdActor) {
            $movimiento = ExpedienteMovimiento::create([
                'expediente_id'               => $expediente->id,
                'tipo'                        => ExpedienteMovimiento::TIPO_ENVIO_EXTERNO,
                'etapa_id'                    => $expediente->etapa_actual_id ?? null,
                'creado_por'                  => null,
                'instruccion'                 => $request->descripcion,
                'tipo_documento_requerido_id' => $request->tipo_documento_id,
                'estado'                      => ExpedienteMovimiento::ESTADO_PENDIENTE_ACEPTACION,
                'tipo_dias'                   => 'calendario',
                'genera_cargo'                => false,
                'portal_email_envio'          => $email,
                'respondido_por'              => $usuarioIdActor,
            ]);

            $carpeta = "expedientes/{$expediente->id}/movimientos/{$movimiento->id}";
            foreach ($request->file('documentos') as $archivo) {
                $ruta = $archivo->store($carpeta, 'documentos');
                MovimientoDocumento::create([
                    'movimiento_id'     => $movimiento->id,
                    'tipo_documento_id' => $request->tipo_documento_id,
                    'subido_por'        => $usuarioIdActor,
                    'nombre_original'   => $archivo->getClientOriginalName(),
                    'ruta_archivo'      => $ruta,
                    'peso_bytes'        => $archivo->getSize(),
                    'momento'           => 'creacion',
                ]);
            }

            ExpedienteHistorial::create([
                'expediente_id' => $expediente->id,
                'usuario_id'    => $usuarioIdActor,
                'tipo_evento'   => 'envio_externo_recibido',
                'descripcion'   => "Envío espontáneo recibido desde portal ({$email}).",
                'datos_extra'   => [
                    'movimiento_id' => $movimiento->id,
                    'portal_email'  => $email,
                    'archivos'      => count($request->file('documentos')),
                ],
            ]);

            return $movimiento;
        });

        return response()->json([
            'ok'      => true,
            'mensaje' => 'Tu envío fue registrado. Quedará disponible en el expediente cuando el responsable lo acepte.',
            'id'      => $movimiento->id,
        ]);
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
            'usuario_id'    => $actor->usuario_id,
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
