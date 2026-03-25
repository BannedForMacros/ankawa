<?php

namespace App\Services;

use App\Models\Expediente;
use App\Models\ExpedienteActor;
use App\Models\ExpedienteHistorial;

class GestorExpedienteService
{
    /**
     * Designar un actor existente del expediente como gestor.
     * El actor ya debe estar asignado al expediente.
     * Solo puede haber UN gestor activo por expediente.
     */
    public function designar(Expediente $expediente, int $actorId, int $designadoPor): ExpedienteActor
    {
        $actor = ExpedienteActor::where('expediente_id', $expediente->id)
            ->where('id', $actorId)
            ->where('activo', 1)
            ->firstOrFail();

        // Quitar gestor anterior
        ExpedienteActor::where('expediente_id', $expediente->id)
            ->where('es_gestor', true)
            ->update(['es_gestor' => false]);

        // Marcar al actor como gestor
        $actor->update(['es_gestor' => true]);

        $nombre = $actor->usuario?->name ?? $actor->nombre_externo ?? 'Actor';
        ExpedienteHistorial::create([
            'expediente_id' => $expediente->id,
            'usuario_id'    => $designadoPor,
            'tipo_evento'   => 'designacion_gestor',
            'descripcion'   => "Se designó a {$nombre} como Gestor del Expediente.",
            'datos_extra'   => [
                'actor_id'   => $actor->id,
                'usuario_id' => $actor->usuario_id,
            ],
            'created_at'    => now(),
        ]);

        return $actor;
    }

    /**
     * Verificar si un usuario es gestor de un expediente.
     */
    public function esGestor(Expediente $expediente, int $usuarioId): bool
    {
        return ExpedienteActor::where('expediente_id', $expediente->id)
            ->where('usuario_id', $usuarioId)
            ->where('es_gestor', true)
            ->where('activo', 1)
            ->exists();
    }

    /**
     * Obtener el gestor actual del expediente.
     */
    public function obtenerGestor(Expediente $expediente): ?ExpedienteActor
    {
        return ExpedienteActor::where('expediente_id', $expediente->id)
            ->where('es_gestor', true)
            ->where('activo', 1)
            ->with(['usuario', 'tipoActor'])
            ->first();
    }
}
