<?php

namespace App\Services;

use App\Models\Expediente;
use App\Models\ExpedienteMovimiento;
use App\Models\ExpedienteHistorial;
use App\Models\MovimientoDocumento;
use App\Models\User;
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

            $fechaLimite = null;
            if (!empty($datos['dias_plazo'])) {
                $fechaLimite = now()->addDays((int) $datos['dias_plazo'])->toDateString();
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
                'fecha_limite'               => $fechaLimite,
                'tipo_documento_requerido_id' => $datos['tipo_documento_requerido_id'] ?? null,
                'estado'                     => $estadoInicial,
                'enviar_credenciales'        => !empty($datos['enviar_credenciales']),
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

            // Enviar credenciales de acceso al actor si se marcó
            if (!empty($datos['enviar_credenciales']) && $movimiento->usuario_responsable_id) {
                $this->enviarCredenciales($movimiento, $expediente);
            }

            if (!empty($notificarActorIds)) {
                $this->notificacionService->notificarActores($movimiento, $notificarActorIds);
            }

            return $movimiento;
        });
    }

    /**
     * Generar/resetear credenciales del actor responsable y enviar email.
     */
    private function enviarCredenciales(ExpedienteMovimiento $movimiento, Expediente $expediente): void
    {
        $usuario = User::find($movimiento->usuario_responsable_id);
        if (!$usuario?->email) return;

        $expediente->loadMissing('solicitud');
        $solicitud = $expediente->solicitud;

        $passwordRaw = Str::random(10);
        $usuario->update(['password' => Hash::make($passwordRaw)]);

        $credencialesTexto = "\n\nSus credenciales de acceso:\n  Usuario: {$usuario->email}\n  Contraseña temporal: {$passwordRaw}";

        try {
            Mail::raw(
                "Estimado(a) {$usuario->name},\n\n" .
                "Se le ha notificado en el expediente {$expediente->numero_expediente}" .
                ($solicitud ? " (Solicitud N° {$solicitud->numero_cargo})" : '') .
                ".\n\nMovimiento: {$movimiento->instruccion}" .
                $credencialesTexto .
                "\n\nSaludos,\nCentro de Arbitraje CARD ANKAWA",
                fn($msg) => $msg->to($usuario->email, $usuario->name)
                                ->subject("Notificación - Expediente {$expediente->numero_expediente}")
            );

            $movimiento->update(['credenciales_enviadas' => true]);
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

    private function guardarDocumentos(ExpedienteMovimiento $movimiento, array $archivos, int $subidoPor, string $momento): void
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
