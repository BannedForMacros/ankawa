<?php

namespace App\Services;

use App\Models\Expediente;
use App\Models\ExpedienteActor;
use App\Models\ExpedienteMovimiento;
use App\Models\ExpedienteHistorial;
use App\Models\MovimientoDocumento;
use App\Models\MovimientoResponsable;
use App\Models\MovimientoTrasladoAuto;
use App\Models\MovimientoTrasladoAutoDisparo;
use App\Models\User;
use App\Models\Rol;
use App\Mail\AccesoMesaPartesMail;
use App\Mail\CredencialesAccesoMail;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class MovimientoService
{
    public function __construct(
        private NotificacionService $notificacionService,
    ) {}

    /**
     * Crear un nuevo movimiento en el expediente.
     */
    public function crear(
        Expediente $expediente,
        array $datos,
        array $archivos = [],
        array $notificarActorIds = [],
        string $estadoInicial = ExpedienteMovimiento::ESTADO_PENDIENTE
    ): ExpedienteMovimiento {
        $movimiento = DB::transaction(function () use ($expediente, $datos, $archivos, $notificarActorIds, $estadoInicial) {

            $tipoDias    = $datos['tipo_dias'] ?? 'calendario';
            $fechaLimite = null;
            if (!empty($datos['dias_plazo'])) {
                $fechaLimite = $this->calcularFechaLimite((int) $datos['dias_plazo'], $tipoDias);
            }

            $tipoMovimiento = $datos['tipo'] ?? ExpedienteMovimiento::TIPO_REQUERIMIENTO;

            // Default según regla de negocio: solo los requerimientos generan cargo al ser respondidos.
            // El frontend / controller puede sobreescribir vía $datos['genera_cargo'].
            // La emisión real depende además del switch en Configuración → Tipos de Cargo (TipoEventoCargo).
            $generaCargo = array_key_exists('genera_cargo', $datos)
                ? (bool) $datos['genera_cargo']
                : ($tipoMovimiento === ExpedienteMovimiento::TIPO_REQUERIMIENTO);

            $movimiento = ExpedienteMovimiento::create([
                'expediente_id'              => $expediente->id,
                'tipo'                       => $tipoMovimiento,
                'etapa_id'                   => $datos['etapa_id'] ?? $expediente->etapa_actual_id,
                'tipo_actor_responsable_id'  => $datos['tipo_actor_responsable_id'] ?? null,
                'usuario_responsable_id'     => $datos['usuario_responsable_id'] ?? null,
                'creado_por'                 => $datos['creado_por'],
                'instruccion'                => $datos['instruccion'],
                'observaciones'              => $datos['observaciones'] ?? null,
                'dias_plazo'                 => $datos['dias_plazo'] ?? null,
                'tipo_dias'                  => $tipoDias,
                'fecha_limite'               => $fechaLimite,
                'tipo_documento_requerido_id' => $datos['tipo_documento_requerido_id'] ?? null,
                'estado'                     => $estadoInicial,
                'genera_cargo'               => $generaCargo,
                'habilitar_mesa_partes'          => !empty($datos['habilitar_mesa_partes']),
                'enviar_credenciales_expediente' => !empty($datos['enviar_credenciales_expediente']),
                'actor_credenciales_exp_id'      => $datos['actor_credenciales_exp_id'] ?? null,
                'credenciales_email_destino'     => $datos['credenciales_email_destino'] ?? null,
                // Solo true cuando lo invoca dispararTrasladosAuto() — para habilitar cancelación posterior.
                'creado_por_auto'                => !empty($datos['creado_por_auto']),
            ]);

            // Crear filas pivot de responsables — agrupados por tipo de documento.
            // Estructura del payload: requerimientos[].{ tipo_documento_id, responsables[].{actor_ids, dias_plazo, tipo_dias}, traslado_auto?: {...} }
            // Cada combinación (tipo_documento × actor) genera una fila independiente con su propio plazo/estado/respuesta.
            $requerimientosData = $datos['requerimientos'] ?? [];
            if (!empty($requerimientosData)) {
                $maxFechaLimite = $fechaLimite;
                foreach ($requerimientosData as $req) {
                    $tipoDocId = $req['tipo_documento_id'] ?? null;
                    foreach (($req['responsables'] ?? []) as $r) {
                        $actorIds = $r['actor_ids'] ?? [];
                        if (empty($actorIds)) continue;
                        $fl = $this->calcularFechaLimite((int) $r['dias_plazo'], $r['tipo_dias'] ?? 'calendario');
                        foreach ($actorIds as $actorId) {
                            $actor = ExpedienteActor::find($actorId);
                            MovimientoResponsable::create([
                                'movimiento_id'       => $movimiento->id,
                                'expediente_actor_id' => $actorId,
                                'tipo_actor_id'       => $actor?->tipo_actor_id,
                                'tipo_documento_id'   => $tipoDocId,
                                'es_opcional'         => !empty($r['es_opcional']),
                                'dias_plazo'          => $r['dias_plazo'],
                                'tipo_dias'           => $r['tipo_dias'] ?? 'calendario',
                                'fecha_limite'        => $fl,
                                'estado'              => ExpedienteMovimiento::ESTADO_PENDIENTE,
                            ]);
                        }
                        if ($maxFechaLimite === null || $fl > $maxFechaLimite) {
                            $maxFechaLimite = $fl;
                        }
                    }

                    // Persistir traslado automático si fue configurado para este tipo de documento.
                    // Sólo tiene sentido si hay tipo_documento_id (necesario para disparar al matchear la entrega).
                    if ($tipoDocId && !empty($req['traslado_auto'])) {
                        $ta = $req['traslado_auto'];
                        MovimientoTrasladoAuto::create([
                            'movimiento_id'             => $movimiento->id,
                            'tipo_documento_id'         => $tipoDocId,
                            'sumilla'                   => $ta['sumilla'] ?? '',
                            'disparadores_actor_ids'    => array_map('intval', $ta['disparadores_actor_ids'] ?? []),
                            'destinatarios_actor_ids'   => array_map('intval', $ta['destinatarios_actor_ids'] ?? []),
                            'genera_requerimiento_auto' => filter_var($ta['genera_requerimiento_auto'] ?? false, FILTER_VALIDATE_BOOLEAN),
                            'requerimiento_auto_config' => $ta['requerimiento_auto_config'] ?? null,
                            'activo'                    => true,
                        ]);
                    }
                }
                $movimiento->update(['fecha_limite' => $maxFechaLimite]);
            }

            // Si el estado inicial es respondido o recibido, marcar fecha_respuesta
            if (in_array($estadoInicial, [ExpedienteMovimiento::ESTADO_RESPONDIDO, ExpedienteMovimiento::ESTADO_RECIBIDO], true)) {
                $movimiento->update([
                    'fecha_respuesta' => now(),
                    'respondido_por'  => $datos['creado_por'],
                ]);
            }

            $this->guardarDocumentos($movimiento, $archivos, $datos['creado_por'], 'creacion', $datos['documento_tipo_id'] ?? null);

            // Actualizar etapa actual del expediente si cambió
            if (isset($datos['etapa_id']) && $datos['etapa_id'] != $expediente->etapa_actual_id) {
                $expediente->update(['etapa_actual_id' => $datos['etapa_id']]);
            }

            ExpedienteHistorial::create([
                'expediente_id' => $expediente->id,
                'usuario_id'    => $datos['creado_por'],
                'tipo_evento'   => 'movimiento_creado',
                'descripcion'   => "[{$expediente->numero_expediente}] Nuevo movimiento: {$datos['instruccion']}",
                'datos_extra'   => ['movimiento_id' => $movimiento->id],
                'created_at'    => now(),
            ]);

            // Habilitar acceso a Mesa de Partes
            if (!empty($datos['habilitar_mesa_partes']) && !empty($datos['actores_mesa_partes_ids'])) {
                $this->habilitarMesaPartes($movimiento, $expediente, $datos['actores_mesa_partes_ids']);

                // Para traslados/notificaciones: los actores recién habilitados reciben
                // automáticamente su cédula de notificación en el mismo acto procesal.
                // habilitarMesaPartes ya corrió → acceso_mesa_partes = 1 en BD,
                // así que notificarActores los encontrará aunque no estuvieran en el
                // actoresNotificables que cargó el frontend al abrir la página.
                if (($datos['tipo'] ?? ExpedienteMovimiento::TIPO_REQUERIMIENTO) === ExpedienteMovimiento::TIPO_NOTIFICACION) {
                    $notificarActorIds = array_unique(
                        array_merge($notificarActorIds, $datos['actores_mesa_partes_ids'])
                    );
                }
            }

            // Enviar credenciales de Expediente Electrónico
            if (!empty($datos['enviar_credenciales_expediente']) && !empty($datos['actor_credenciales_exp_id'])) {
                $this->enviarCredencialesExpediente($movimiento, $expediente);
            }

            if (!empty($notificarActorIds)) {
                $this->notificacionService->notificarActores($movimiento, $notificarActorIds);
            }

            return $movimiento;
        });

        // ── Avisos in-app / tiempo real a las partes afectadas (post-commit) ──
        // Las partes requeridas (responsables) + destinatarios de cédula reciben
        // un aviso en vivo en su portal; los actores con cuenta staff, en su campana.
        try {
            $avisoActorIds = MovimientoResponsable::where('movimiento_id', $movimiento->id)
                ->pluck('expediente_actor_id')
                ->merge($notificarActorIds)
                ->unique()->values()->all();

            if (!empty($avisoActorIds)) {
                app(\App\Services\AvisoService::class)->avisarMovimientoAActores($movimiento, $avisoActorIds, [
                    'titulo'        => 'Nuevo movimiento · ' . $expediente->numero_expediente,
                    'mensaje'       => \Illuminate\Support\Str::limit($movimiento->instruccion, 100),
                    'url'           => '/mesa-partes/inicio',
                    'tipo'          => $movimiento->tipo,
                    'expediente_id' => $expediente->id,
                ]);
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Aviso de movimiento falló: ' . $e->getMessage());
        }

        return $movimiento;
    }

    /**
     * Habilitar acceso a Mesa de Partes para los actores seleccionados.
     * Envía email informativo a todos sus correos.
     */
    private function habilitarMesaPartes(ExpedienteMovimiento $movimiento, Expediente $expediente, array $actorIds): void
    {
        $actores = ExpedienteActor::with(['usuario', 'emailsAdicionales'])
            ->whereIn('id', $actorIds)
            ->where('expediente_id', $expediente->id)
            ->where('activo', 1)
            ->get();

        foreach ($actores as $actor) {
            if ($actor->acceso_mesa_partes) continue;

            // Update con la condición `activo=1` incluida para evitar race entre el get() y el update():
            // si el actor se desactiva entre ambas operaciones, el update no aplica.
            $afectados = ExpedienteActor::where('id', $actor->id)
                ->where('activo', 1)
                ->update(['acceso_mesa_partes' => 1]);

            if ($afectados === 0) {
                continue;
            }

            $nombre = $actor->usuario?->name ?? $actor->nombre_externo ?? 'Actor';

            foreach ($actor->todosLosEmails() as $email) {
                try {
                    Mail::to($email)->send(new AccesoMesaPartesMail($expediente, $actor));
                } catch (\Exception $e) {
                    \Log::warning("Error enviando acceso mesa partes a {$email}: " . $e->getMessage());
                }
            }

            ExpedienteHistorial::create([
                'expediente_id' => $expediente->id,
                'usuario_id'    => auth()->id(),
                'tipo_evento'   => 'acceso_mesa_partes_habilitado',
                'descripcion'   => "Se habilitó acceso a Mesa de Partes para {$nombre}.",
                'datos_extra'   => ['actor_id' => $actor->id],
                'created_at'    => now(),
            ]);
        }

        $movimiento->update(['actores_mesa_partes_ids' => $actorIds]);
    }

    /**
     * Enviar credenciales de acceso al Expediente Electrónico.
     * Crea cuenta si no existe, envía email con credenciales.
     */
    private function enviarCredencialesExpediente(ExpedienteMovimiento $movimiento, Expediente $expediente): void
    {
        $actor = ExpedienteActor::with('usuario')->find($movimiento->actor_credenciales_exp_id);
        if (!$actor) return;

        $usuario = $actor->usuario;
        if (!$usuario) return;

        $emailDestino = $movimiento->credenciales_email_destino ?: $usuario->email;
        if (!$emailDestino) return;

        $expediente->loadMissing('solicitud');
        $solicitud = $expediente->solicitud;

        $passwordRaw = Str::random(10);
        $usuario->update(['password' => Hash::make($passwordRaw)]);

        try {
            Mail::to($emailDestino, $usuario->name)->send(new CredencialesAccesoMail(
                nombreDestinatario: $usuario->name,
                emailUsuario:       $usuario->email,
                passwordTemporal:   $passwordRaw,
                numeroExpediente:   $expediente->numero_expediente,
                numeroCargo:        $solicitud?->numero_cargo,
                contexto:           'expediente',
            ));

            $movimiento->update([
                'enviar_credenciales_expediente' => true,
                'credenciales_enviadas' => true,
            ]);
            $actor->update([
                'credenciales_enviadas' => true,
                'acceso_expediente_electronico' => 1,
            ]);

            $nombre = $usuario->name;
            ExpedienteHistorial::create([
                'expediente_id' => $expediente->id,
                'usuario_id'    => auth()->id(),
                'tipo_evento'   => 'acceso_expediente_habilitado',
                'descripcion'   => "Se habilitó acceso al Expediente Electrónico para {$nombre}.",
                'datos_extra'   => ['actor_id' => $actor->id, 'email_destino' => $emailDestino],
                'created_at'    => now(),
            ]);
        } catch (\Exception $e) {
            \Log::warning("Error enviando credenciales exp. electrónico movimiento #{$movimiento->id}: " . $e->getMessage());
        }
    }

    /**
     * Disparar traslados automáticos configurados para los tipos entregados por un actor.
     *
     * Se invoca desde el flujo de respuesta (PortalController::responder) DESPUÉS de marcar
     * las filas de movimiento_responsables como 'respondido'. Por cada tipo entregado:
     *   - Busca config en movimiento_traslados_auto (movimiento + tipo_documento).
     *   - Si el actor está en disparadores_actor_ids (o la lista está vacía → todos disparan)
     *     y no se disparó antes para este (config, actor), crea:
     *       1) Un movimiento 'notificacion' con la sumilla, dirigido a destinatarios_actor_ids
     *       2) Si genera_requerimiento_auto: un movimiento 'requerimiento' adicional con el
     *          responsable y plazo configurados.
     *   - Registra el disparo en movimiento_traslados_auto_disparos (idempotencia).
     *
     * Devuelve la cantidad de cascadas efectivamente disparadas.
     */
    public function dispararTrasladosAuto(
        ExpedienteMovimiento $movimiento,
        int $actorIdDisparador,
        array $tiposEntregadosIds,
        ?int $usuarioDisparadorId = null,
    ): int {
        if (empty($tiposEntregadosIds)) return 0;

        $configs = MovimientoTrasladoAuto::where('movimiento_id', $movimiento->id)
            ->whereIn('tipo_documento_id', $tiposEntregadosIds)
            ->where('activo', true)
            ->get();

        if ($configs->isEmpty()) return 0;

        $movimiento->loadMissing('expediente');
        $cantDisparados = 0;

        foreach ($configs as $cfg) {
            // ¿Este actor está habilitado para disparar esta config?
            $disparadores = $cfg->disparadores_actor_ids ?? [];
            $habilitado   = empty($disparadores) || in_array($actorIdDisparador, $disparadores, false);
            if (!$habilitado) continue;

            // Idempotencia: no disparar dos veces para el mismo (config × actor).
            $yaDisparado = MovimientoTrasladoAutoDisparo::where('traslado_auto_id', $cfg->id)
                ->where('triggered_by_actor_id', $actorIdDisparador)
                ->exists();
            if ($yaDisparado) continue;

            // Un cascade = UN solo movimiento en el historial (trazabilidad lineal):
            //   - Si genera_requerimiento_auto = true  → crea un REQUERIMIENTO con plazo
            //     que ya intrínsecamente notifica vía notificar_a (no hace falta notif separada).
            //   - Si genera_requerimiento_auto = false → crea una NOTIFICACIÓN informativa.
            $movGenerado = null;

            if ($cfg->genera_requerimiento_auto && !empty($cfg->requerimiento_auto_config)) {
                $rc = $cfg->requerimiento_auto_config;
                // El requerimiento notifica al responsable + todos los destinatarios configurados.
                $destinatariosUnicos = array_values(array_unique(array_merge(
                    array_map('intval', $cfg->destinatarios_actor_ids ?? []),
                    [(int) $rc['responsable_actor_id']],
                )));
                $movGenerado = $this->crear(
                    $movimiento->expediente,
                    [
                        'etapa_id'        => $movimiento->etapa_id,
                        'instruccion'     => $cfg->sumilla,
                        'creado_por'      => $usuarioDisparadorId,
                        'tipo'            => ExpedienteMovimiento::TIPO_REQUERIMIENTO,
                        'creado_por_auto' => true,
                        'requerimientos'  => [[
                            'tipo_documento_id' => $rc['tipo_documento_id'] ?? null,
                            'responsables'      => [[
                                'actor_ids'  => [$rc['responsable_actor_id']],
                                'dias_plazo' => $rc['dias_plazo'],
                                'tipo_dias'  => $rc['tipo_dias'] ?? 'calendario',
                            ]],
                        ]],
                    ],
                    [],  // sin archivos
                    $destinatariosUnicos,  // notificar a TODOS los destinatarios + responsable
                    ExpedienteMovimiento::ESTADO_PENDIENTE,
                );
            } else {
                $movGenerado = ExpedienteMovimiento::create([
                    'expediente_id'   => $movimiento->expediente_id,
                    'tipo'            => ExpedienteMovimiento::TIPO_NOTIFICACION,
                    'etapa_id'        => $movimiento->etapa_id,
                    'creado_por'      => $usuarioDisparadorId,
                    'instruccion'     => $cfg->sumilla,
                    'estado'          => ExpedienteMovimiento::ESTADO_RECIBIDO,
                    'genera_cargo'    => false,
                    'fecha_respuesta' => now(),
                    'respondido_por'  => $usuarioDisparadorId,
                    'creado_por_auto' => true,
                ]);
                if (!empty($cfg->destinatarios_actor_ids)) {
                    $this->notificacionService->notificarActores($movGenerado, $cfg->destinatarios_actor_ids);
                }
            }

            // Registrar el disparo para idempotencia y trazabilidad.
            MovimientoTrasladoAutoDisparo::create([
                'traslado_auto_id'       => $cfg->id,
                'triggered_by_actor_id'  => $actorIdDisparador,
                'movimiento_generado_id' => $movGenerado->id,
                'triggered_at'           => now(),
            ]);

            $cantDisparados++;
        }

        return $cantDisparados;
    }

    /**
     * Cancelar un movimiento generado automáticamente por un auto-traslado.
     *
     * Filosofía: **trazabilidad lineal**. La cancelación CONGELA el movimiento auto-generado
     * (estado=cancelado, plazo deja de correr) pero NO retrocede estado de movimientos previos.
     * Si el gestor necesita pedirle al actor que resubmita, debe emitir un NUEVO requerimiento
     * (acción explícita hacia adelante) — la cancelación por sí sola no reabre nada.
     *
     * Requisitos validados por el caller (controller):
     *   - El movimiento existe, `creado_por_auto = true`, no está ya cancelado.
     *   - El usuario es gestor del expediente.
     *
     * Acciones:
     *   1. Marca el movimiento como `cancelado` (estado), guarda timestamp, usuario, motivo.
     *   2. Persiste el documento de sustento del gestor en `movimiento_documentos` con momento='cancelacion'.
     *   3. Registra la cancelación en `expediente_historial`.
     *
     * NO se modifica el movimiento padre, NO se reabren filas de responsables, NO se borra el disparo.
     * Todo el rastro previo queda intacto: el demandado entregó, el cascade se ejecutó, después fue
     * cancelado. La línea de tiempo es lineal.
     */
    public function cancelarMovimientoAuto(
        ExpedienteMovimiento $movimiento,
        int $userId,
        string $motivo,
        int $tipoDocumentoId,
        \Illuminate\Http\UploadedFile $archivo,
    ): void {
        DB::transaction(function () use ($movimiento, $userId, $motivo, $tipoDocumentoId, $archivo) {
            $movimiento->update([
                'estado'             => ExpedienteMovimiento::ESTADO_CANCELADO,
                'cancelado_at'       => now(),
                'cancelado_por'      => $userId,
                'motivo_cancelacion' => $motivo,
            ]);

            // Guardar el documento de sustento del gestor (momento='cancelacion').
            $carpeta = "expedientes/{$movimiento->expediente_id}/movimientos/{$movimiento->id}";
            $ruta = $archivo->store($carpeta, 'documentos');
            if (!$ruta) {
                throw new \RuntimeException('No se pudo guardar el documento de sustento de la cancelación.');
            }
            MovimientoDocumento::create([
                'movimiento_id'     => $movimiento->id,
                'tipo_documento_id' => $tipoDocumentoId,
                'subido_por'        => $userId,
                'nombre_original'   => $archivo->getClientOriginalName(),
                'ruta_archivo'      => $ruta,
                'peso_bytes'        => $archivo->getSize(),
                'momento'           => 'cancelacion',
            ]);

            ExpedienteHistorial::create([
                'expediente_id' => $movimiento->expediente_id,
                'usuario_id'    => $userId,
                'tipo_evento'   => 'movimiento_auto_cancelado',
                'descripcion'   => "Movimiento auto-generado cancelado por el gestor. Motivo: {$motivo}",
                'datos_extra'   => [
                    'movimiento_id'         => $movimiento->id,
                    'tipo_documento_id_doc' => $tipoDocumentoId,
                ],
                'created_at'    => now(),
            ]);
        });
    }

    private function calcularFechaLimite(int $dias, string $tipoDias): string
    {
        if ($tipoDias === 'habiles') {
            $feriados = \DB::table('feriados')->where('activo', true)->pluck('fecha')->toArray();
            $fecha    = now()->copy();
            $contados = 0;
            while ($contados < $dias) {
                $fecha->addDay();
                if ($fecha->dayOfWeek !== 0 && $fecha->dayOfWeek !== 6
                    && !in_array($fecha->toDateString(), $feriados)) {
                    $contados++;
                }
            }
            return $fecha->toDateString();
        }
        return now()->addDays($dias)->toDateString();
    }

    private function guardarDocumentos(ExpedienteMovimiento $movimiento, array $archivos, ?int $subidoPor, string $momento, ?int $tipoDocumentoId = null): void
    {
        $carpeta = "expedientes/{$movimiento->expediente_id}/movimientos/{$movimiento->id}";

        foreach ($archivos as $archivo) {
            if ($archivo instanceof UploadedFile) {
                $ruta = $archivo->store($carpeta, 'documentos');
                MovimientoDocumento::create([
                    'movimiento_id'     => $movimiento->id,
                    'tipo_documento_id' => $tipoDocumentoId,
                    'subido_por'        => $subidoPor,
                    'nombre_original'   => $archivo->getClientOriginalName(),
                    'ruta_archivo'      => $ruta,
                    'peso_bytes'        => $archivo->getSize(),
                    'momento'           => $momento,
                ]);
            }
        }
    }
}
