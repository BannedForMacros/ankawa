<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\BroadcastMessage;

/**
 * Notificación in-app de CARD ANKAWA — se persiste (campana) y se emite en
 * tiempo real por Reverb simultáneamente. Síncrona a propósito (no ShouldQueue)
 * para que aparezca sin requerir un worker de cola; el broadcast a Reverb es
 * una llamada local rápida.
 *
 * $datos: ['titulo','mensaje','url','tipo','icono'?,'expediente_id'?]
 */
class AvisoNotification extends Notification
{
    public function __construct(public array $datos) {}

    public function via($notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toArray($notifiable): array
    {
        return [
            'titulo'        => $this->datos['titulo']  ?? 'Notificación',
            'mensaje'       => $this->datos['mensaje'] ?? '',
            'url'           => $this->datos['url']     ?? null,
            'tipo'          => $this->datos['tipo']    ?? 'info',
            'icono'         => $this->datos['icono']   ?? null,
            'expediente_id' => $this->datos['expediente_id'] ?? null,
        ];
    }

    public function toBroadcast($notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }
}
