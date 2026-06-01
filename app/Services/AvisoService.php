<?php

namespace App\Services;

use App\Events\AvisoPortal;
use App\Models\ExpedienteActor;
use App\Models\ExpedienteMovimiento;
use App\Models\Rol;
use App\Models\User;
use App\Notifications\AvisoNotification;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

/**
 * AvisoService — emisor de notificaciones in-app y en tiempo real.
 *
 * Distinto del NotificacionService (que envía emails/cédulas). Aquí:
 *  - Staff interno → AvisoNotification (campana + broadcast en App.Models.User.{id}).
 *  - Parte externa (portal) → evento AvisoPortal en su canal por actor.
 *
 * Regla del proyecto: rol = alcance, tipo de actor = trabajo. El destino se
 * resuelve por participación (expediente_actores) o por rol, según el caso.
 *
 * Toda emisión va envuelta en try/catch: una falla de notificación (p.ej. Reverb
 * caído) NUNCA debe romper la acción de negocio que la disparó.
 */
class AvisoService
{
    /** Campana + tiempo real a usuarios staff por sus ids. */
    public function avisarUsuarios(array $userIds, array $datos): void
    {
        $userIds = array_values(array_unique(array_filter($userIds)));
        if (empty($userIds)) return;

        try {
            $users = User::whereIn('id', $userIds)->get();
            Notification::send($users, new AvisoNotification($datos));
        } catch (\Throwable $e) {
            Log::warning('AvisoService::avisarUsuarios falló: ' . $e->getMessage());
        }
    }

    /** Avisa a todos los usuarios activos de un rol (por slug). */
    public function avisarRol(string $rolSlug, array $datos): void
    {
        $ids = User::whereHas('rol', fn ($q) => $q->where('slug', $rolSlug))
            ->where('activo', 1)->pluck('id')->all();
        $this->avisarUsuarios($ids, $datos);
    }

    /** Empuja un aviso en vivo a los canales de portal de ciertos actores. */
    public function avisarActoresPortal(array $actorIds, array $datos): void
    {
        foreach (array_values(array_unique(array_filter($actorIds))) as $actorId) {
            try {
                broadcast(new AvisoPortal((int) $actorId, $datos));
            } catch (\Throwable $e) {
                Log::warning("AvisoService::avisarActoresPortal actor {$actorId} falló: " . $e->getMessage());
            }
        }
    }

    /**
     * Aviso por un movimiento nuevo a las partes (actores) afectadas:
     *  - en vivo al portal de cada actor (parte externa con sesión abierta),
     *  - y a la campana del usuario staff si el actor tiene cuenta interna.
     */
    public function avisarMovimientoAActores(ExpedienteMovimiento $mov, array $actorIds, array $datos): void
    {
        $actorIds = array_values(array_unique(array_filter($actorIds)));
        if (empty($actorIds)) return;

        // Portal en vivo (cualquier actor, tenga cuenta o no).
        $this->avisarActoresPortal($actorIds, $datos);

        // Campana para actores que son staff interno (rol != usuario).
        $userIds = ExpedienteActor::whereIn('id', $actorIds)
            ->whereNotNull('usuario_id')
            ->with('usuario.rol')
            ->get()
            ->filter(fn ($a) => $a->usuario?->rol && $a->usuario->rol->slug !== Rol::SLUG_USUARIO)
            ->pluck('usuario_id')->all();

        $this->avisarUsuarios($userIds, $datos);
    }
}
