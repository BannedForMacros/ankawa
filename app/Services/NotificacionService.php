<?php

namespace App\Services;

use App\Models\ExpedienteMovimiento;
use App\Models\ExpedienteActor;
use App\Models\MovimientoNotificacion;
use App\Mail\MovimientoNotificacionMail;
use Illuminate\Support\Facades\Mail;

class NotificacionService
{
    /**
     * Notificar a los actores seleccionados sobre un movimiento.
     * Envía a TODOS los emails del actor (principal + adicionales).
     */
    public function notificarActores(ExpedienteMovimiento $movimiento, array $actorIds): void
    {
        $actores = ExpedienteActor::with(['usuario', 'emailsAdicionales'])
            ->whereIn('id', $actorIds)
            ->where('expediente_id', $movimiento->expediente_id)
            ->where('activo', 1)
            ->get();

        $asunto = $this->generarAsunto($movimiento);

        foreach ($actores as $actor) {
            $nombre = $actor->usuario?->name ?? $actor->nombre_externo ?? 'Participante';
            $emails = $actor->todosLosEmails();

            if (empty($emails)) {
                continue;
            }

            foreach ($emails as $email) {
                $notificacion = MovimientoNotificacion::create([
                    'movimiento_id'  => $movimiento->id,
                    'actor_id'       => $actor->id,
                    'email_destino'  => $email,
                    'nombre_destino' => $nombre,
                    'asunto'         => $asunto,
                    'estado_envio'   => 'pendiente',
                    'created_at'     => now(),
                ]);

                try {
                    Mail::to($email, $nombre)->send(new MovimientoNotificacionMail(
                        $movimiento,
                        $nombre,
                    ));

                    $notificacion->update([
                        'estado_envio' => 'enviado',
                        'enviado_at'   => now(),
                    ]);
                } catch (\Exception $e) {
                    $notificacion->update(['estado_envio' => 'fallido']);
                    \Log::warning("Fallo envío notificación actor {$actor->id} → {$email}: " . $e->getMessage());
                }
            }
        }
    }

    /**
     * Obtener todos los actores activos de un expediente para preseleccionarlos.
     * Incluye todos los emails del actor para mostrarlos en el selector.
     */
    public function actoresNotificables(int $expedienteId): array
    {
        return ExpedienteActor::with(['usuario', 'tipoActor', 'emailsAdicionales'])
            ->where('expediente_id', $expedienteId)
            ->where('activo', 1)
            ->get()
            ->filter(fn($actor) => !empty($actor->todosLosEmails()))
            ->map(fn($actor) => [
                'id'           => $actor->id,
                'nombre'       => $actor->usuario?->name ?? $actor->nombre_externo ?? 'Sin nombre',
                'tipo_actor'   => ['nombre' => $actor->tipoActor?->nombre, 'slug' => $actor->tipoActor?->slug],
                'emails'       => $actor->todosLosEmails(),
                'email_principal' => $actor->todosLosEmails()[0] ?? null,
            ])
            ->values()
            ->all();
    }

    private function generarAsunto(ExpedienteMovimiento $movimiento): string
    {
        $movimiento->loadMissing('expediente');
        $numExp = $movimiento->expediente->numero_expediente ?? 'S/N';
        return "Expediente {$numExp} — Nuevo movimiento registrado";
    }
}
