<?php

namespace App\Services;

use App\Models\Etapa;
use App\Models\Expediente;
use App\Models\ExpedienteHistorial;
use Illuminate\Support\Facades\DB;

class EtapaService
{
    /**
     * Obtener las etapas de un servicio.
     */
    public function etapasDelServicio(int $servicioId): \Illuminate\Database\Eloquent\Collection
    {
        return Etapa::where('servicio_id', $servicioId)
            ->where('activo', 1)
            ->orderBy('orden')
            ->get();
    }

    /**
     * Cambiar la etapa actual de un expediente.
     * Valida que la nueva etapa pertenezca al mismo servicio del expediente
     * y registra el cambio en el historial dentro de una transacción.
     */
    public function cambiarEtapa(Expediente $expediente, int $nuevaEtapaId, int $cambiadoPor): void
    {
        // Validación: la etapa debe existir, estar activa y pertenecer al servicio del expediente.
        $etapaNueva = Etapa::where('id', $nuevaEtapaId)
            ->where('servicio_id', $expediente->servicio_id)
            ->where('activo', 1)
            ->first();

        if (!$etapaNueva) {
            throw new \InvalidArgumentException(
                "La etapa #{$nuevaEtapaId} no existe, está inactiva o no pertenece al servicio del expediente."
            );
        }

        DB::transaction(function () use ($expediente, $etapaNueva, $cambiadoPor) {
            $etapaAnterior = $expediente->etapa_actual_id;
            $expediente->update(['etapa_actual_id' => $etapaNueva->id]);

            ExpedienteHistorial::create([
                'expediente_id' => $expediente->id,
                'usuario_id'    => $cambiadoPor,
                'tipo_evento'   => 'cambio_etapa',
                'descripcion'   => "Etapa cambiada a: {$etapaNueva->nombre}",
                'datos_extra'   => [
                    'etapa_anterior_id' => $etapaAnterior,
                    'etapa_nueva_id'    => $etapaNueva->id,
                ],
                'created_at'    => now(),
            ]);
        });
    }

}
