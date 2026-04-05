<?php

namespace App\Services;

use App\Models\Cargo;
use App\Models\Expediente;
use App\Models\ExpedienteActor;
use App\Models\ExpedienteMovimiento;
use App\Models\ExpedienteHistorial;
use App\Models\MovimientoDocumento;
use App\Models\User;
use App\Mail\CargoRespuestaMail;
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
        string $estadoInicial = 'pendiente'
    ): ExpedienteMovimiento {
        return DB::transaction(function () use ($expediente, $datos, $archivos, $notificarActorIds, $estadoInicial) {

            $tipoDias    = $datos['tipo_dias'] ?? 'calendario';
            $fechaLimite = null;
            if (!empty($datos['dias_plazo'])) {
                $fechaLimite = $this->calcularFechaLimite((int) $datos['dias_plazo'], $tipoDias);
            }

            $movimiento = ExpedienteMovimiento::create([
                'expediente_id'              => $expediente->id,
                'tipo'                       => $datos['tipo'] ?? 'requerimiento',
                'etapa_id'                   => $datos['etapa_id'] ?? $expediente->etapa_actual_id,
                'sub_etapa_id'               => $datos['sub_etapa_id'] ?? null,
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
                'enviar_credenciales'        => !empty($datos['enviar_credenciales']),
                'actor_credenciales_id'      => $datos['actor_credenciales_id'] ?? null,
                'genera_cargo'               => !empty($datos['genera_cargo']),
            ]);

            // Si el estado inicial es respondido o recibido, marcar fecha_respuesta
            if (in_array($estadoInicial, ['respondido', 'recibido'])) {
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

            // Enviar credenciales de acceso al actor seleccionado si se indicó
            if (!empty($datos['enviar_credenciales']) && !empty($datos['actor_credenciales_id'])) {
                $this->enviarCredenciales($movimiento, $expediente);
            }

            if (!empty($notificarActorIds)) {
                $this->notificacionService->notificarActores($movimiento, $notificarActorIds);
            }

            return $movimiento;
        });
    }

    /**
     * Generar/resetear credenciales del actor seleccionado y enviar email.
     * Marca credenciales_enviadas=true en el actor de expediente.
     */
    private function enviarCredenciales(ExpedienteMovimiento $movimiento, Expediente $expediente): void
    {
        $actor = ExpedienteActor::with('usuario')->find($movimiento->actor_credenciales_id);
        if (!$actor) return;

        $usuario = $actor->usuario;
        if (!$usuario?->email) return;

        $expediente->loadMissing('solicitud');
        $solicitud = $expediente->solicitud;

        $passwordRaw = Str::random(10);
        $usuario->update(['password' => Hash::make($passwordRaw)]);

        try {
            Mail::raw(
                "Estimado(a) {$usuario->name},\n\n" .
                "Se le ha designado como participante en el expediente {$expediente->numero_expediente}" .
                ($solicitud ? " (Solicitud N° {$solicitud->numero_cargo})" : '') .
                ".\n\nSus credenciales de acceso a la plataforma ANKAWA son:\n" .
                "  Usuario: {$usuario->email}\n" .
                "  Contraseña temporal: {$passwordRaw}\n\n" .
                "Por favor ingrese y cambie su contraseña.\n\n" .
                "Saludos,\nCentro de Arbitraje CARD ANKAWA",
                fn($msg) => $msg->to($usuario->email, $usuario->name)
                                ->subject("Credenciales de acceso - Expediente {$expediente->numero_expediente}")
            );

            // Marcar como enviadas tanto en el movimiento como en el actor
            $movimiento->update(['credenciales_enviadas' => true]);
            $actor->update(['credenciales_enviadas' => true]);
        } catch (\Exception $e) {
            \Log::warning("Error enviando credenciales movimiento #{$movimiento->id}: " . $e->getMessage());
        }
    }

    /**
     * Responder a un movimiento pendiente.
     */
    public function responder(ExpedienteMovimiento $movimiento, array $datos, array $archivos = [], array $notificarActorIds = []): ExpedienteMovimiento
    {
        return DB::transaction(function () use ($movimiento, $datos, $archivos, $notificarActorIds) {

            $movimiento->update([
                'respuesta'       => $datos['respuesta'],
                'fecha_respuesta' => now(),
                'respondido_por'  => $datos['respondido_por'],
                'estado'          => 'respondido',
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

            // Generar cargo si el movimiento lo requiere
            if ($movimiento->genera_cargo) {
                $respondedor = User::find($datos['respondido_por']);
                $cargo = Cargo::crear('respuesta_movimiento', $movimiento, $datos['respondido_por']);
                try {
                    Mail::to($respondedor->email)->send(new CargoRespuestaMail($cargo, $movimiento));
                } catch (\Exception $e) {
                    \Log::warning("Error enviando cargo respuesta movimiento #{$movimiento->id}: " . $e->getMessage());
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
            // 1. Responder el movimiento actual
            $this->responder($movimiento, $datosRespuesta, $archivosRespuesta);

            // 2. Crear el siguiente movimiento
            return $this->crear($expediente, $datosNuevo, $archivosNuevo, $notificarActorIds);
        });
    }

    /**
     * Marcar como vencidos los movimientos cuya fecha_limite ya pasó.
     */
    public function marcarVencidos(): int
    {
        return ExpedienteMovimiento::where('estado', 'pendiente')
            ->where('activo', true)
            ->whereNotNull('fecha_limite')
            ->where('fecha_limite', '<', now()->toDateString())
            ->update(['estado' => 'vencido']);
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
