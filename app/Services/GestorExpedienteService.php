<?php

namespace App\Services;

use App\Models\Expediente;
use App\Models\ExpedienteActor;
use App\Models\ExpedienteHistorial;
use App\Models\User;

class GestorExpedienteService
{
    /**
     * Designar un usuario como gestor del expediente.
     * Solo puede haber UN gestor activo por expediente.
     */
    public function designar(Expediente $expediente, int $usuarioId, int $designadoPor): ExpedienteActor
    {
        // Quitar gestor anterior
        ExpedienteActor::where('expediente_id', $expediente->id)
            ->where('es_gestor', true)
            ->update(['es_gestor' => false]);

        // El usuario ya puede ser actor del expediente (con otro tipo_actor)
        // o puede no estar aún — buscamos si ya existe como actor
        $actor = ExpedienteActor::where('expediente_id', $expediente->id)
            ->where('usuario_id', $usuarioId)
            ->where('activo', 1)
            ->first();

        if ($actor) {
            $actor->update(['es_gestor' => true]);
        } else {
            // Si no es actor, lo agregamos sin tipo_actor específico (solo como gestor)
            $actor = ExpedienteActor::create([
                'expediente_id' => $expediente->id,
                'usuario_id'    => $usuarioId,
                'tipo_actor_id' => $this->tipoActorGestor(),
                'es_gestor'     => true,
                'activo'        => 1,
            ]);
        }

        // Registrar en historial
        $usuario = User::find($usuarioId);
        ExpedienteHistorial::create([
            'expediente_id' => $expediente->id,
            'usuario_id'    => $designadoPor,
            'tipo_evento'   => 'designacion_gestor',
            'descripcion'   => "Se designó a {$usuario->name} como Gestor del Expediente.",
            'datos_extra'   => ['usuario_gestor_id' => $usuarioId],
            'created_at'    => now(),
        ]);

        return $actor;
    }

    /**
     * Transferir la gestión a otro usuario.
     */
    public function transferir(Expediente $expediente, int $nuevoGestorId, int $transferidoPor): ExpedienteActor
    {
        return $this->designar($expediente, $nuevoGestorId, $transferidoPor);
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
            ->with('usuario')
            ->first();
    }

    private function tipoActorGestor(): int
    {
        return \App\Models\TipoActorExpediente::where('slug', 'gestor')
            ->value('id') ?? 1;
    }
}
