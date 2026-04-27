<?php

namespace App\Services;

use App\Models\Cargo;
use App\Models\Expediente;
use App\Models\ExpedienteActor;
use App\Models\ExpedienteMovimiento;
use App\Models\ExpedienteHistorial;
use App\Models\MovimientoDocumento;
use App\Models\MovimientoResponsable;
use App\Models\User;
use App\Models\Rol;
use App\Mail\AccesoMesaPartesMail;
use App\Mail\CargoRespuestaMail;
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
        return DB::transaction(function () use ($expediente, $datos, $archivos, $notificarActorIds, $estadoInicial) {

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
            ]);

            // Crear filas pivot de responsables (nuevo sistema multi-responsable)
            // Cada "fila" del frontend agrupa varios actor_ids con un mismo plazo.
            $responsablesData = $datos['responsables'] ?? [];
            if (!empty($responsablesData)) {
                $maxFechaLimite = $fechaLimite;
                foreach ($responsablesData as $r) {
                    $actorIds = $r['actor_ids'] ?? [];
                    if (empty($actorIds)) continue;
                    $fl = $this->calcularFechaLimite((int) $r['dias_plazo'], $r['tipo_dias'] ?? 'calendario');
                    foreach ($actorIds as $actorId) {
                        $actor = ExpedienteActor::find($actorId);
                        MovimientoResponsable::create([
                            'movimiento_id'       => $movimiento->id,
                            'expediente_actor_id' => $actorId,
                            'tipo_actor_id'       => $actor?->tipo_actor_id,
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
                $movimiento->update(['fecha_limite' => $maxFechaLimite]);
            }

            // Si el estado inicial es respondido o recibido, marcar fecha_respuesta
            if (in_array($estadoInicial, [ExpedienteMovimiento::ESTADO_RESPONDIDO, ExpedienteMovimiento::ESTADO_RECIBIDO], true)) {
                $movimiento->update([
                    'fecha_respuesta' => now(),
                    'respondido_por'  => $datos['creado_por'],
                ]);
            }

            $this->guardarDocumentos($movimiento, $archivos, $datos['creado_por'], 'creacion');

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
     * Responder a un movimiento pendiente.
     *
     * El cargo de respuesta se emite cuando:
     *   - el movimiento es de tipo 'requerimiento', y
     *   - la columna `genera_cargo` del movimiento está en true (configurable al crear), y
     *   - el tipo de evento 'respuesta_requerimiento' está activo en Configuración → Tipos de Cargo.
     */
    public function responder(
        ExpedienteMovimiento $movimiento,
        array $datos,
        array $archivos = [],
        array $notificarActorIds = [],
    ): ExpedienteMovimiento {
        return DB::transaction(function () use ($movimiento, $datos, $archivos, $notificarActorIds) {

            $pivotRows = $movimiento->responsables;

            if ($pivotRows->isNotEmpty()) {
                // Nuevo path: actualizar la fila pivot del actor que responde
                $actor = ExpedienteActor::where('usuario_id', $datos['respondido_por'])
                    ->whereIn('id', $pivotRows->pluck('expediente_actor_id'))
                    ->first();

                if ($actor) {
                    $pivotRows->where('expediente_actor_id', $actor->id)
                        ->first()
                        ?->update([
                            'estado'          => ExpedienteMovimiento::ESTADO_RESPONDIDO,
                            'respuesta'       => $datos['respuesta'],
                            'respondido_por'  => $datos['respondido_por'],
                            'fecha_respuesta' => now(),
                        ]);
                }

                $todosRespondieron = !$movimiento->responsables()
                    ->where('estado', ExpedienteMovimiento::ESTADO_PENDIENTE)
                    ->exists();

                if (!$todosRespondieron) {
                    $this->guardarDocumentos($movimiento, $archivos, $datos['respondido_por'], 'respuesta');
                    ExpedienteHistorial::create([
                        'expediente_id' => $movimiento->expediente_id,
                        'usuario_id'    => $datos['respondido_por'],
                        'tipo_evento'   => 'movimiento_respondido_parcial',
                        'descripcion'   => "Respuesta parcial al movimiento: {$movimiento->instruccion}",
                        'datos_extra'   => ['movimiento_id' => $movimiento->id],
                        'created_at'    => now(),
                    ]);
                    return $movimiento;
                }
            }

            $movimiento->update([
                'respuesta'       => $datos['respuesta'],
                'fecha_respuesta' => now(),
                'respondido_por'  => $datos['respondido_por'],
                'estado'          => ExpedienteMovimiento::ESTADO_RESPONDIDO,
            ]);

            // Si el expediente tiene solicitud en estado 'subsanacion',
            // al responder el demandante se habilita la re-revisión del gestor
            $expediente = $movimiento->expediente()->with('solicitud')->first();
            if ($expediente?->solicitud?->estado === 'subsanacion') {
                $expediente->solicitud->update([
                    'estado'             => 'pendiente',
                    'resultado_revision' => null,
                ]);
            }

            $this->guardarDocumentos($movimiento, $archivos, $datos['respondido_por'], 'respuesta');

            ExpedienteHistorial::create([
                'expediente_id' => $movimiento->expediente_id,
                'usuario_id'    => $datos['respondido_por'],
                'tipo_evento'   => 'movimiento_respondido',
                'descripcion'   => "Movimiento respondido: {$movimiento->instruccion}",
                'datos_extra'   => ['movimiento_id' => $movimiento->id],
                'created_at'    => now(),
            ]);

            if (!empty($notificarActorIds)) {
                $this->notificacionService->notificarActores($movimiento, $notificarActorIds);
            }

            // Cargo de respuesta — emisión configurable por tipo de movimiento + tipo de evento.
            if ($movimiento->tipo === ExpedienteMovimiento::TIPO_REQUERIMIENTO && $movimiento->genera_cargo) {
                $cargo = Cargo::crear('respuesta_requerimiento', $movimiento, $datos['respondido_por']);
                if ($cargo) {
                    $respondedor = User::find($datos['respondido_por']);
                    try {
                        if ($respondedor?->email) {
                            Mail::to($respondedor->email)->send(new CargoRespuestaMail($cargo, $movimiento));
                        }
                    } catch (\Exception $e) {
                        \Log::warning("Error enviando cargo respuesta movimiento #{$movimiento->id}: " . $e->getMessage());
                    }
                }
            }

            return $movimiento;
        });
    }

    /**
     * Responder un movimiento Y crear el siguiente en una sola transacción.
     */
    public function responderYCrear(
        ExpedienteMovimiento $movimiento,
        array $datosRespuesta,
        array $archivosRespuesta,
        Expediente $expediente,
        array $datosNuevo,
        array $archivosNuevo,
        array $notificarActorIds = []
    ): ExpedienteMovimiento {
        return DB::transaction(function () use ($movimiento, $datosRespuesta, $archivosRespuesta, $expediente, $datosNuevo, $archivosNuevo, $notificarActorIds) {
            $this->responder($movimiento, $datosRespuesta, $archivosRespuesta);
            return $this->crear($expediente, $datosNuevo, $archivosNuevo, $notificarActorIds);
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

    private function guardarDocumentos(ExpedienteMovimiento $movimiento, array $archivos, ?int $subidoPor, string $momento): void
    {
        $carpeta = "expedientes/{$movimiento->expediente_id}/movimientos/{$movimiento->id}";

        foreach ($archivos as $archivo) {
            if ($archivo instanceof UploadedFile) {
                $ruta = $archivo->store($carpeta, 'public');
                MovimientoDocumento::create([
                    'movimiento_id'   => $movimiento->id,
                    'subido_por'      => $subidoPor,
                    'nombre_original' => $archivo->getClientOriginalName(),
                    'ruta_archivo'    => $ruta,
                    'peso_bytes'      => $archivo->getSize(),
                    'momento'         => $momento,
                ]);
            }
        }
    }
}
