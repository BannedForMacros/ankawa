<?php

namespace App\Http\Controllers;

use App\Models\ExpedienteActor;
use App\Models\ExpedienteActorEmail;
use Illuminate\Http\Request;

/**
 * Autorización de canales privados para el PORTAL externo (Mesa de Partes).
 *
 * Las partes no usan el guard `web` (entran por OTP → session('portal_email')),
 * así que el endpoint estándar /broadcasting/auth las rechaza. Este endpoint
 * autoriza el canal `private-portal.actor.{id}` validando que la sesión OTP
 * sea dueña de ese actor, y devuelve la firma de autenticación del protocolo
 * Pusher (que habla Reverb) firmada con el secret de la app.
 */
class PortalBroadcastAuthController extends Controller
{
    public function __invoke(Request $request)
    {
        $email = session('portal_email');
        abort_unless($email, 403, 'Sesión de portal no válida.');

        $channel  = (string) $request->input('channel_name');
        $socketId = (string) $request->input('socket_id');

        if (!preg_match('/^private-portal\.actor\.(\d+)$/', $channel, $m)) {
            abort(403, 'Canal no permitido.');
        }
        $actorId = (int) $m[1];

        abort_unless($this->actorIdsPorEmail($email)->contains($actorId), 403, 'No autorizado para este canal.');

        $key    = config('broadcasting.connections.reverb.key');
        $secret = config('broadcasting.connections.reverb.secret');

        // Firma de canal privado (sin channel_data): app_key:HMAC_SHA256(socket_id:channel, secret)
        $signature = hash_hmac('sha256', $socketId . ':' . $channel, $secret);

        return response()->json(['auth' => $key . ':' . $signature]);
    }

    /** Mismos criterios que PortalController::actorIdsPorEmail. */
    private function actorIdsPorEmail(string $email)
    {
        return ExpedienteActor::where('email_externo', $email)
            ->orWhereHas('usuario', fn ($q) => $q->where('email', $email))
            ->pluck('id')
            ->merge(ExpedienteActorEmail::where('email', $email)->pluck('expediente_actor_id'))
            ->unique()
            ->values();
    }
}
