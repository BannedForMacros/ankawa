<?php

namespace App\Services;

use App\Models\Etapa;
use App\Models\SubEtapa;
use App\Models\Expediente;
use App\Models\ExpedienteHistorial;

class EtapaService
{
    /**
     * Obtener las etapas con sub-etapas de un servicio.
     */
    public function etapasDelServicio(int $servicioId): \Illuminate\Database\Eloquent\Collection
    {
        return Etapa::where('servicio_id', $servicioId)
            ->where('activo', 1)
            ->with(['subEtapas' => fn($q) => $q->where('activo', 1)->orderBy('orden')])
            ->orderBy('orden')
            ->get();
    }

    /**
     * Cambiar la etapa actual de un expediente.
     */
    public function cambiarEtapa(Expediente $expediente, int $nuevaEtapaId, int $cambiadoPor): void
    {
        $etapaAnterior = $expediente->etapa_actual_id;
        $expediente->update(['etapa_actual_id' => $nuevaEtapaId]);

        $etapaNueva = Etapa::find($nuevaEtapaId);
        ExpedienteHistorial::create([
            'expediente_id' => $expediente->id,
            'usuario_id'    => $cambiadoPor,
            'tipo_evento'   => 'cambio_etapa',
            'descripcion'   => "Etapa cambiada a: {$etapaNueva->nombre}",
            'datos_extra'   => [
                'etapa_anterior_id' => $etapaAnterior,
                'etapa_nueva_id'    => $nuevaEtapaId,
            ],
            'created_at'    => now(),
        ]);
    }

    /**
     * Crear una sub-etapa dentro de una etapa.
     */
    public function crearSubEtapa(int $etapaId, array $datos): SubEtapa
    {
        $maxOrden = SubEtapa::where('etapa_id', $etapaId)->max('orden') ?? 0;

        return SubEtapa::create([
            'etapa_id'    => $etapaId,
            'nombre'      => $datos['nombre'],
            'descripcion' => $datos['descripcion'] ?? null,
            'orden'       => $datos['orden'] ?? ($maxOrden + 1),
            'activo'      => 1,
        ]);
    }
}
