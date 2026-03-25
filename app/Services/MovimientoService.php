<?php

namespace App\Services;

use App\Models\Expediente;
use App\Models\ExpedienteMovimiento;
use App\Models\ExpedienteHistorial;
use App\Models\MovimientoDocumento;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

class MovimientoService
{
    public function __construct(
        private NotificacionService $notificacionService,
    ) {}

    /**
     * Crear un nuevo movimiento en el expediente.
     * Solo el Gestor puede crear movimientos.
     */
    public function crear(Expediente $expediente, array $datos, array $archivos = [], array $notificarActorIds = []): ExpedienteMovimiento
    {
        return DB::transaction(function () use ($expediente, $datos, $archivos, $notificarActorIds) {

            // Calcular fecha límite si hay plazo
            $fechaLimite = null;
            if (!empty($datos['dias_plazo'])) {
                $fechaLimite = now()->addDays($datos['dias_plazo'])->toDateString();
            }

            $movimiento = ExpedienteMovimiento::create([
                'expediente_id'             => $expediente->id,
                'etapa_id'                  => $datos['etapa_id'] ?? $expediente->etapa_actual_id,
                'sub_etapa_id'              => $datos['sub_etapa_id'] ?? null,
                'tipo_actor_responsable_id' => $datos['tipo_actor_responsable_id'] ?? null,
                'usuario_responsable_id'    => $datos['usuario_responsable_id'] ?? null,
                'creado_por'                => $datos['creado_por'],
                'instruccion'               => $datos['instruccion'],
                'observaciones'             => $datos['observaciones'] ?? null,
                'dias_plazo'                => $datos['dias_plazo'] ?? null,
                'fecha_limite'              => $fechaLimite,
                'estado'                    => 'pendiente',
            ]);

            // Guardar documentos adjuntos (momento: creacion)
            $this->guardarDocumentos($movimiento, $archivos, $datos['creado_por'], 'creacion');

            // Actualizar etapa actual del expediente si cambió
            if (isset($datos['etapa_id']) && $datos['etapa_id'] != $expediente->etapa_actual_id) {
                $expediente->update(['etapa_actual_id' => $datos['etapa_id']]);
            }

            // Registrar en historial
            ExpedienteHistorial::create([
                'expediente_id' => $expediente->id,
                'usuario_id'    => $datos['creado_por'],
                'tipo_evento'   => 'movimiento_creado',
                'descripcion'   => "Nuevo movimiento: {$datos['instruccion']}",
                'datos_extra'   => ['movimiento_id' => $movimiento->id],
                'created_at'    => now(),
            ]);

            // Enviar notificaciones
            if (!empty($notificarActorIds)) {
                $this->notificacionService->notificarActores($movimiento, $notificarActorIds);
            }

            return $movimiento;
        });
    }

    /**
     * Responder a un movimiento pendiente.
     * Solo el actor responsable puede responder.
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

            // Guardar documentos de respuesta
            $this->guardarDocumentos($movimiento, $archivos, $datos['respondido_por'], 'respuesta');

            // Registrar en historial
            ExpedienteHistorial::create([
                'expediente_id' => $movimiento->expediente_id,
                'usuario_id'    => $datos['respondido_por'],
                'tipo_evento'   => 'movimiento_respondido',
                'descripcion'   => "Movimiento respondido: {$movimiento->instruccion}",
                'datos_extra'   => ['movimiento_id' => $movimiento->id],
                'created_at'    => now(),
            ]);

            // Enviar notificaciones
            if (!empty($notificarActorIds)) {
                $this->notificacionService->notificarActores($movimiento, $notificarActorIds);
            }

            return $movimiento;
        });
    }

    /**
     * Omitir un movimiento pendiente (solo el Gestor).
     */
    public function omitir(ExpedienteMovimiento $movimiento, int $omitidoPor, string $motivo): ExpedienteMovimiento
    {
        $movimiento->update([
            'estado'        => 'omitido',
            'observaciones' => ($movimiento->observaciones ? $movimiento->observaciones . "\n" : '') . "Omitido: {$motivo}",
        ]);

        ExpedienteHistorial::create([
            'expediente_id' => $movimiento->expediente_id,
            'usuario_id'    => $omitidoPor,
            'tipo_evento'   => 'movimiento_omitido',
            'descripcion'   => "Movimiento omitido: {$movimiento->instruccion}. Motivo: {$motivo}",
            'datos_extra'   => ['movimiento_id' => $movimiento->id],
            'created_at'    => now(),
        ]);

        return $movimiento;
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
