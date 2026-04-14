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
    public function designar(Expediente $expediente, int $actorId, int $designadoPorId): ExpedienteActor
    {
        $actor = ExpedienteActor::where('expediente_id', $expediente->id)
            ->where('id', $actorId)
            ->where('activo', 1)
            ->firstOrFail();

        // Marcar al actor como responsable, guardando quién lo designó
        $actor->update([
            'es_gestor'        => true,
            'designado_por_id' => $designadoPorId,
        ]);

        $designador = \App\Models\User::find($designadoPorId);
        $nombre = $actor->usuario?->name ?? $actor->nombre_externo ?? 'Actor';
        $nombreDesignador = $designador?->name ?? 'Sistema';

        ExpedienteHistorial::create([
            'expediente_id' => $expediente->id,
            'usuario_id'    => $designadoPorId,
            'tipo_evento'   => 'designacion_gestor',
            'descripcion'   => "{$nombreDesignador} designó a {$nombre} como Responsable del Expediente.",
            'datos_extra'   => [
                'actor_id'          => $actor->id,
                'usuario_id'        => $actor->usuario_id,
                'designado_por_id'  => $designadoPorId,
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
