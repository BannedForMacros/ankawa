<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

/**
 * Campana de notificaciones del staff interno: listado, no leídas y marcar leídas.
 * Lee de la tabla `notifications` (Laravel) del usuario autenticado.
 */
class NotificacionController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'no_leidas' => $user->unreadNotifications()->count(),
            'recientes' => $user->notifications()->latest()->limit(15)->get()->map(fn ($n) => [
                'id'         => $n->id,
                'leida'      => $n->read_at !== null,
                'created_at' => $n->created_at?->toIso8601String(),
                ...$n->data,
            ]),
        ]);
    }

    public function marcarLeida(Request $request, string $id)
    {
        $n = $request->user()->notifications()->where('id', $id)->first();
        if ($n && $n->read_at === null) {
            $n->markAsRead();
        }
        return response()->json(['ok' => true]);
    }

    public function marcarTodasLeidas(Request $request)
    {
        $request->user()->unreadNotifications->markAsRead();
        return response()->json(['ok' => true]);
    }
}
