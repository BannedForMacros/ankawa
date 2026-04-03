<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class PortalAuth
{
    public function handle(Request $request, Closure $next)
    {
        if (!session('portal_email')) {
            return redirect()->route('mesa-partes.index');
        }

        return $next($request);
    }
}
