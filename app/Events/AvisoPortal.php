<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Aviso en vivo para una PARTE EXTERNA del portal (Mesa de Partes).
 *
 * Se emite a un canal privado por actor — `portal.actor.{actorId}` — que el
 * frontend del portal autoriza contra la sesión OTP vía PortalBroadcastAuthController.
 * ShouldBroadcastNow → síncrono, sin depender de un worker de cola.
 */
class AvisoPortal implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public function __construct(public int $actorId, public array $datos) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('portal.actor.' . $this->actorId)];
    }

    public function broadcastAs(): string
    {
        return 'aviso';
    }

    public function broadcastWith(): array
    {
        return $this->datos;
    }
}
