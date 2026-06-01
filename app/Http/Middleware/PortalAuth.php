<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class PortalAuth
{
    public function handle(Request $request, Closure $next)
    {
        if (!session('portal_email')) {
            // Recordar a dónde iba (p. ej. un documento abierto desde el correo) para
            // devolverlo ahí tras validar el OTP. Solo navegaciones GET, no POST/AJAX.
            if ($request->isMethod('get') && !$request->expectsJson()) {
                session(['portal_intended' => $request->fullUrl()]);
            }
            return redirect()->route('mesa-partes.index');
        }

        return $next($request);
    }
}
