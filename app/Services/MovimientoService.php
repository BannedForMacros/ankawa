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
                $ruta = $archivo->store($carpeta, 'public');
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
