<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\BroadcastMessage;

/**
 * Notificación in-app de CARD ANKAWA — se persiste (campana) y se emite en
 * tiempo real por Reverb. Dos vías con garantías distintas:
 *
 *  - 'database': SÍNCRONA. La campana queda persistida de inmediato, así que el
 *    badge de no leídas siempre aparece al recargar/abrir la página, sin worker.
 *  - 'broadcast': el tiempo real lo entrega Laravel vía BroadcastNotificationCreated,
 *    que implementa ShouldBroadcast (ENCOLADO, no ShouldBroadcastNow). Por tanto el
 *    "pop" en vivo del staff REQUIERE un `php artisan queue:work` activo
 *    (QUEUE_CONNECTION=database). Sin worker: la campana funciona, pero solo se
 *    actualiza al recargar; el aviso en vivo no llega.
 *
 * Nota: el portal externo (App\Events\AvisoPortal) sí es ShouldBroadcastNow y no
 * depende del worker. Si en el futuro se quiere staff 100% en vivo sin worker,
 * habría que emitir un evento ShouldBroadcastNow propio en paralelo.
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
