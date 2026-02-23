<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermiso
{
    /**
     * Uso en rutas:
     * ->middleware('permiso:configuracion.roles')           // ver por defecto
     * ->middleware('permiso:configuracion.roles,crear')
     * ->middleware('permiso:configuracion.roles,editar')
     * ->middleware('permiso:configuracion.roles,eliminar')
     */
    public function handle(Request $request, Closure $next, string $moduloSlug, string $accion = 'ver'): Response
    {
        if (!auth()->check()) {
            return redirect()->route('login');
        }

        $user = auth()->user();

        if ($user->activo == 0) {
            auth()->logout();
            return redirect()->route('login')->withErrors([
                'email' => 'Tu cuenta está desactivada.'
            ]);
        }

        if (!$user->rol_id) {
            abort(403, 'No tienes un rol asignado.');
        }

        if (!$user->puedeEn($moduloSlug, $accion)) {
            abort(403, 'No tienes permiso para realizar esta acción.');
        }

        return $next($request);
    }
}