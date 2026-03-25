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
     * Por defecto se sugieren TODOS los actores, pero el gestor puede desmarcar.
     */
    public function notificarActores(ExpedienteMovimiento $movimiento, array $actorIds): void
    {
        $actores = ExpedienteActor::with('usuario')
            ->whereIn('id', $actorIds)
            ->where('expediente_id', $movimiento->expediente_id)
            ->where('activo', 1)
            ->get();

        foreach ($actores as $actor) {
            $email  = $actor->usuario?->email ?? $actor->email_externo;
            $nombre = $actor->usuario?->name  ?? $actor->nombre_externo ?? 'Participante';

            if (!$email) {
                continue;
            }

            $notificacion = MovimientoNotificacion::create([
                'movimiento_id'  => $movimiento->id,
                'actor_id'       => $actor->id,
                'email_destino'  => $email,
                'nombre_destino' => $nombre,
                'asunto'         => $this->generarAsunto($movimiento),
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
                \Log::warning("Fallo envío notificación actor {$actor->id}: " . $e->getMessage());
            }
        }
    }

    /**
     * Obtener todos los actores activos de un expediente para preseleccionarlos.
     */
    public function actoresNotificables(int $expedienteId): \Illuminate\Database\Eloquent\Collection
    {
        return ExpedienteActor::with(['usuario', 'tipoActor'])
            ->where('expediente_id', $expedienteId)
            ->where('activo', 1)
            ->get()
            ->filter(fn($actor) => $actor->usuario?->email || $actor->email_externo);
    }

    private function generarAsunto(ExpedienteMovimiento $movimiento): string
    {
        $movimiento->loadMissing('expediente');
        $numExp = $movimiento->expediente->numero_expediente ?? 'S/N';
        return "Expediente {$numExp} — Nuevo movimiento registrado";
    }
}
